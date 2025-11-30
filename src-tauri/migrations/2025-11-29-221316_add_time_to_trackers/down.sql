-- SQLite doesn't support DROP COLUMN directly, so we need to recreate tables

-- Recreate intake table without time column
CREATE TABLE intake_backup (
    id          INTEGER NOT NULL PRIMARY KEY,
    added       TEXT    NOT NULL,
    amount      INTEGER NOT NULL,
    category    TEXT    NOT NULL,
    description TEXT
);

INSERT INTO intake_backup (id, added, amount, category, description)
SELECT id, added, amount, category, description FROM intake;

DROP TABLE intake;

ALTER TABLE intake_backup RENAME TO intake;

CREATE INDEX idx_intake_added ON intake(added);
CREATE INDEX idx_intake_category ON intake(category);

-- Recreate weight_tracker table without time column
CREATE TABLE weight_tracker_backup (
    id     INTEGER NOT NULL PRIMARY KEY,
    added  TEXT    NOT NULL,
    amount REAL    NOT NULL
);

INSERT INTO weight_tracker_backup (id, added, amount)
SELECT id, added, amount FROM weight_tracker;

DROP TABLE weight_tracker;

ALTER TABLE weight_tracker_backup RENAME TO weight_tracker;

CREATE INDEX idx_weight_tracker_added ON weight_tracker(added);
