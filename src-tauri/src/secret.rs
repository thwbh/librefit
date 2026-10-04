//! Secret storage abstraction (add-food-recognition, FR).
//!
//! The AI-intake API key is the only secret in the app. It is stored via this
//! `SecretStore` abstraction and NEVER written to SQLite, serialized to the
//! webview, or included in an export (see FR-007, FR-008).
//!
//! The production backend is [`KeyringSecretStore`], built on the Rust `keyring`
//! crate so the key lives in the OS credential store (macOS Keychain, Windows
//! Credential Manager, Linux Secret Service, Android Keystore) and the backend
//! can still read it to make the provider call. [`InMemorySecretStore`] remains
//! for tests.

use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};

/// Keystore account/entry name for the AI-intake API key.
pub const AI_INTAKE_API_KEY: &str = "ai_intake.api_key";

/// Keyring service namespace for all LibreFit secrets. Kept independent of the
/// bundle identifier so it stays stable even if the identifier changes.
pub const KEYRING_SERVICE: &str = "librefit";

#[derive(Debug)]
pub enum SecretStoreError {
    Backend(String),
}

impl std::fmt::Display for SecretStoreError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            // Deliberately never includes the secret value.
            SecretStoreError::Backend(msg) => write!(f, "secret store error: {}", msg),
        }
    }
}

impl std::error::Error for SecretStoreError {}

/// Store, retrieve, and remove a single named secret.
///
/// Implementations MUST NOT log secret values. The method surface is kept
/// AppHandle-free so concrete backends can capture whatever handle they need at
/// construction time, keeping the trait mockable.
pub trait SecretStore: Send + Sync {
    fn set(&self, account: &str, secret: &str) -> Result<(), SecretStoreError>;
    fn get(&self, account: &str) -> Result<Option<String>, SecretStoreError>;
    fn delete(&self, account: &str) -> Result<(), SecretStoreError>;
}

/// Process-lifetime, in-memory secret store. Used by tests and as the running
/// app's placeholder backend until the OS-keystore backend (task 1.3) lands.
#[derive(Default)]
pub struct InMemorySecretStore {
    entries: Mutex<HashMap<String, String>>,
}

impl SecretStore for InMemorySecretStore {
    fn set(&self, account: &str, secret: &str) -> Result<(), SecretStoreError> {
        let mut map = self
            .entries
            .lock()
            .map_err(|e| SecretStoreError::Backend(e.to_string()))?;
        map.insert(account.to_owned(), secret.to_owned());
        Ok(())
    }

    fn get(&self, account: &str) -> Result<Option<String>, SecretStoreError> {
        let map = self
            .entries
            .lock()
            .map_err(|e| SecretStoreError::Backend(e.to_string()))?;
        Ok(map.get(account).cloned())
    }

    fn delete(&self, account: &str) -> Result<(), SecretStoreError> {
        let mut map = self
            .entries
            .lock()
            .map_err(|e| SecretStoreError::Backend(e.to_string()))?;
        map.remove(account);
        Ok(())
    }
}

/// Register the platform-native credential store as the global default — exactly
/// once, lazily, on the first secret operation. Lazy (rather than at startup)
/// because on Android the store needs `ndk-context`, which is initialized from
/// `MainActivity.onCreate` *after* Tauri's setup hook runs. By first use the
/// context is ready. We set the default ourselves (rather than via keyring's `v1`
/// wrapper) because that wrapper refuses Android/iOS.
fn ensure_default_store() -> Result<(), SecretStoreError> {
    static INIT: OnceLock<Result<(), String>> = OnceLock::new();
    INIT.get_or_init(|| set_platform_default_store().map_err(|e| e.to_string()))
        .clone()
        .map_err(SecretStoreError::Backend)
}

fn set_platform_default_store() -> Result<(), SecretStoreError> {
    #[cfg(any(target_os = "macos", target_os = "ios"))]
    let store = apple_native_keyring_store::keychain::Store::new()
        .map_err(|e| SecretStoreError::Backend(e.to_string()))?;
    #[cfg(target_os = "windows")]
    let store = windows_native_keyring_store::Store::new()
        .map_err(|e| SecretStoreError::Backend(e.to_string()))?;
    #[cfg(target_os = "linux")]
    let store = zbus_secret_service_keyring_store::Store::new()
        .map_err(|e| SecretStoreError::Backend(e.to_string()))?;
    #[cfg(target_os = "android")]
    let store = android_native_keyring_store::Store::new()
        .map_err(|e| SecretStoreError::Backend(e.to_string()))?;

    #[cfg(any(
        target_os = "macos",
        target_os = "ios",
        target_os = "windows",
        target_os = "linux",
        target_os = "android"
    ))]
    {
        keyring_core::set_default_store(store);
        log::debug!("SecretStore: default keyring store registered");
        Ok(())
    }
    #[cfg(not(any(
        target_os = "macos",
        target_os = "ios",
        target_os = "windows",
        target_os = "linux",
        target_os = "android"
    )))]
    Err(SecretStoreError::Backend(
        "no keyring backend for this platform".to_string(),
    ))
}

/// Production backend: stores secrets in the OS credential store via `keyring-core`.
/// Entries are namespaced by [`KEYRING_SERVICE`] + account. The platform default
/// store is registered lazily on first use (see [`ensure_default_store`]).
pub struct KeyringSecretStore {
    service: String,
}

impl KeyringSecretStore {
    pub fn new(service: impl Into<String>) -> Self {
        Self {
            service: service.into(),
        }
    }

    fn entry(&self, account: &str) -> Result<keyring_core::Entry, SecretStoreError> {
        ensure_default_store()?;
        keyring_core::Entry::new(&self.service, account)
            .map_err(|e| SecretStoreError::Backend(e.to_string()))
    }
}

impl SecretStore for KeyringSecretStore {
    fn set(&self, account: &str, secret: &str) -> Result<(), SecretStoreError> {
        self.entry(account)?
            .set_password(secret)
            .map_err(|e| SecretStoreError::Backend(e.to_string()))
    }

    fn get(&self, account: &str) -> Result<Option<String>, SecretStoreError> {
        match self.entry(account)?.get_password() {
            Ok(secret) => Ok(Some(secret)),
            Err(keyring_core::Error::NoEntry) => Ok(None),
            Err(e) => Err(SecretStoreError::Backend(e.to_string())),
        }
    }

    fn delete(&self, account: &str) -> Result<(), SecretStoreError> {
        // Deleting a missing entry is a no-op, not an error.
        match self.entry(account)?.delete_credential() {
            Ok(()) | Err(keyring_core::Error::NoEntry) => Ok(()),
            Err(e) => Err(SecretStoreError::Backend(e.to_string())),
        }
    }
}

/// Tauri-managed wrapper so a `dyn SecretStore` can live in app state.
pub struct ManagedSecretStore(pub Box<dyn SecretStore>);

impl ManagedSecretStore {
    pub fn store(&self) -> &dyn SecretStore {
        self.0.as_ref()
    }
}
