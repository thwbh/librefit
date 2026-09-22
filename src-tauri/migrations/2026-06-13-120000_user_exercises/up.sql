-- User-extensible exercise library (add-exercise-library, WO/DH).
--
-- Keep a single `exercise` table for seeded + user-created rows. Harden it with
-- three added columns (pure ALTER ADD — no table rebuild, so the FK children
-- exercise_muscle / workout_exercise are untouched):
--   * slug       — stable natural key; NON-NULL for seeded rows, NULL for user
--                  rows. Seeded content (future seeded exercises/templates)
--                  references exercises by slug, never by raw id, so a user row
--                  claiming an autoincrement id can never collide. Also the
--                  seeded/user discriminator: seeded == slug IS NOT NULL.
--   * verified   — user "Ghost" rows start 0; promoted to 1 once category +
--                  muscles are supplied. Seeded rows are always 1. This flag —
--                  not the category — is the source of truth for completeness.
--   * added / time — local creation date + time, split across two columns using
--                  the same field names as intake/weight_tracker (this app is
--                  local, single-user, single-device — no timezone offset to
--                  keep). Feeds the dashboard avatar's graceful-decay window.
--
-- `category` stays NOT NULL (relaxing it would force rebuilding this FK-parent
-- table inside a transaction, which SQLite can't do safely with foreign_keys
-- ON). Instead a name-only Ghost is parked under a seeded 'uncategorized'
-- category until the user assigns a real one; `verified = 0` marks it pending.

-- Sentinel category for name-only Ghost exercises.
INSERT INTO exercise_category (shortvalue, longvalue)
VALUES ('uncategorized', 'Uncategorized');

ALTER TABLE exercise ADD COLUMN slug TEXT;
ALTER TABLE exercise ADD COLUMN verified BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE exercise ADD COLUMN added TEXT;
ALTER TABLE exercise ADD COLUMN time TEXT;

-- Backfill seeded rows: stable slug from the (unique) name, mark verified.
-- Names contain only spaces and hyphens, so lower + space->hyphen is clean and
-- unique.
UPDATE exercise SET slug = lower(replace(name, ' ', '-')), verified = 1;

-- UNIQUE over slug; SQLite treats NULLs as distinct, so user rows (slug NULL)
-- coexist freely while seeded slugs stay unique.
CREATE UNIQUE INDEX idx_exercise_slug ON exercise (slug);
-- Cheap count/listing of unverified user exercises for the avatar indicator.
CREATE INDEX idx_exercise_unverified ON exercise (verified) WHERE slug IS NULL;
