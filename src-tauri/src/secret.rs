//! Secret storage abstraction (add-food-recognition, FR).
//!
//! The AI-intake API key is the only secret in the app. It is stored via this
//! `SecretStore` abstraction and NEVER written to SQLite, serialized to the
//! webview, or included in an export (see FR-007, FR-008).
//!
//! Phase 1 ships the trait plus an in-memory fake. The in-memory store is used
//! both by tests and — until the concrete OS-keystore backend (task 1.3) is
//! wired — as the running app's placeholder backend. The placeholder keeps the
//! key only for the process lifetime; it is secure-by-omission (nothing hits
//! disk) but does not persist across restarts, which is why 1.3 is required
//! before release.

use std::collections::HashMap;
use std::sync::Mutex;

/// Keystore account/entry name for the AI-intake API key.
pub const AI_INTAKE_API_KEY: &str = "ai_intake.api_key";

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

/// Tauri-managed wrapper so a `dyn SecretStore` can live in app state.
pub struct ManagedSecretStore(pub Box<dyn SecretStore>);

impl ManagedSecretStore {
    pub fn store(&self) -> &dyn SecretStore {
        self.0.as_ref()
    }
}
