-- Remove activity_level column from body_data table
-- Note: SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
CREATE TABLE body_data_backup (
    id INTEGER PRIMARY KEY NOT NULL,
    age INTEGER NOT NULL,
    height REAL NOT NULL,
    weight REAL NOT NULL,
    sex TEXT NOT NULL
);

INSERT INTO body_data_backup SELECT id, age, height, weight, sex FROM body_data;

DROP TABLE body_data;

ALTER TABLE body_data_backup RENAME TO body_data;
