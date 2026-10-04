-- Generic application settings store (add-food-recognition, FR).
--
-- A plain key/value table for non-secret application settings. The AI-intake
-- feature is its first consumer (enabled flag, provider base URL, model name,
-- consent flag), but the table is deliberately generic — future settings land
-- here too. Values are stored as TEXT; typed interpretation lives in the
-- `app_config` service. No `user_id` — the app is local, single-user.
--
-- SECRETS NEVER LIVE HERE. The AI-intake API key is stored only in the OS
-- keystore (see the `SecretStore` abstraction), never in this table, so it is
-- also never carried into a JSON export.

CREATE TABLE app_config
(
    key   TEXT NOT NULL PRIMARY KEY,
    value TEXT NOT NULL
);
