-- Make name and avatar fields mandatory in libre_user table
-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table

-- Create new table with NOT NULL constraints
CREATE TABLE libre_user_new (
    id INTEGER PRIMARY KEY NOT NULL,
    avatar TEXT NOT NULL,
    name TEXT NOT NULL
);

-- Copy existing data (providing defaults for any NULL values)
INSERT INTO libre_user_new (id, avatar, name)
SELECT id, COALESCE(avatar, ''), COALESCE(name, '')
FROM libre_user;

-- Drop old table
DROP TABLE libre_user;

-- Rename new table to original name
ALTER TABLE libre_user_new RENAME TO libre_user;
