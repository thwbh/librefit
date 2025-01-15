CREATE TABLE libre_user
(
    id     INTEGER NOT NULL PRIMARY KEY,
    avatar TEXT,
    name   TEXT
);

--- initial entry to be present on first startup
INSERT INTO libre_user (id, avatar, name) VALUES (NULL, NULL, NULL);

CREATE TABLE calorie_tracker
(
    id          INTEGER NOT NULL PRIMARY KEY,
    added       TEXT    NOT NULL,
    amount      INTEGER NOT NULL,
    category    TEXT    NOT NULL,
    description TEXT
);

CREATE TABLE weight_tracker
(
    id     INTEGER NOT NULL PRIMARY KEY,
    added  TEXT    NOT NULL,
    amount REAL    NOT NULL
);

CREATE TABLE food_category
(
    longvalue  TEXT NOT NULL,
    shortvalue TEXT NOT NULL PRIMARY KEY
);

INSERT INTO food_category (shortvalue, longvalue)
VALUES ('b', 'Breakfast'),
       ('l', 'Lunch'),
       ('d', 'Dinner'),
       ('s', 'Snack'),
       ('t', 'Treat'),
       ('u', 'Unset');

CREATE TABLE calorie_target
(
    id               INTEGER NOT NULL PRIMARY KEY,
    added            TEXT    NOT NULL,
    end_date         TEXT    NOT NULL,
    maximum_calories INTEGER NOT NULL,
    start_date       TEXT    NOT NULL,
    target_calories  INTEGER NOT NULL
);

CREATE TABLE weight_target
(
    id             INTEGER NOT NULL PRIMARY KEY,
    added          TEXT    NOT NULL,
    end_date       TEXT    NOT NULL,
    initial_weight REAL    NOT NULL,
    start_date     TEXT    NOT NULL,
    target_weight  REAL    NOT NULL
);

CREATE TABLE body_data
(
    id      INTEGER NOT NULL PRIMARY KEY,
    age     INTEGER NOT NULL,
    height  REAL NOT NULL,
    weight  REAL NOT NULL,
    sex     TEXT NOT NULL
);
