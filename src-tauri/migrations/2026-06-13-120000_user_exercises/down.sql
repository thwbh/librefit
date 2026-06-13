-- Reverse the exercise hardening. SQLite can't DROP COLUMN on an FK-parent
-- table referenced by children without a rebuild, but it CAN drop simple
-- columns added by ALTER when no index/constraint depends on them — so drop the
-- indexes first, then the columns. User-created rows are deleted (no seeded-only
-- home), then the sentinel category is removed.

DROP INDEX IF EXISTS idx_exercise_unverified;
DROP INDEX IF EXISTS idx_exercise_slug;

DELETE FROM exercise WHERE slug IS NULL;

ALTER TABLE exercise DROP COLUMN created_at;
ALTER TABLE exercise DROP COLUMN verified;
ALTER TABLE exercise DROP COLUMN slug;

DELETE FROM exercise_category WHERE shortvalue = 'uncategorized';
