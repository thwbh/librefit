-- Revert libre_user fields to nullable
-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table

-- Create new table with nullable fields
CREATE TABLE libre_user_new (
    id INTEGER PRIMARY KEY NOT NULL,
    avatar TEXT,
    name TEXT
);

-- Copy existing data back
INSERT INTO libre_user_new (id, avatar, name)
SELECT id, avatar, name
FROM libre_user;

-- Drop current table
DROP TABLE libre_user;

-- Rename new table to original name
ALTER TABLE libre_user_new RENAME TO libre_user;
