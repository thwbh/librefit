-- LibreFit Initial Database Schema
-- This migration consolidates all previous migrations into a single initial schema

-- User table
CREATE TABLE libre_user
(
    id     INTEGER NOT NULL PRIMARY KEY,
    avatar TEXT    NOT NULL,
    name   TEXT    NOT NULL
);

-- Intake (calorie) tracker table
CREATE TABLE intake
(
    id          INTEGER NOT NULL PRIMARY KEY,
    added       TEXT    NOT NULL,
    amount      INTEGER NOT NULL,
    category    TEXT    NOT NULL,
    description TEXT,
    time        TEXT    NOT NULL DEFAULT '00:00:00'
);

-- Weight tracker table
CREATE TABLE weight_tracker
(
    id     INTEGER NOT NULL PRIMARY KEY,
    added  TEXT    NOT NULL,
    amount REAL    NOT NULL,
    time   TEXT    NOT NULL DEFAULT '00:00:00'
);

-- Food category lookup table
CREATE TABLE food_category
(
    longvalue  TEXT NOT NULL,
    shortvalue TEXT NOT NULL PRIMARY KEY
);

-- Insert default food categories
INSERT INTO food_category (shortvalue, longvalue)
VALUES ('b', 'Breakfast'),
       ('l', 'Lunch'),
       ('d', 'Dinner'),
       ('s', 'Snack'),
       ('t', 'Treat'),
       ('u', 'Unset');

-- Intake (calorie) target table
CREATE TABLE intake_target
(
    id               INTEGER NOT NULL PRIMARY KEY,
    added            TEXT    NOT NULL,
    end_date         TEXT    NOT NULL,
    maximum_calories INTEGER NOT NULL,
    start_date       TEXT    NOT NULL,
    target_calories  INTEGER NOT NULL
);

-- Weight target table
CREATE TABLE weight_target
(
    id             INTEGER NOT NULL PRIMARY KEY,
    added          TEXT    NOT NULL,
    end_date       TEXT    NOT NULL,
    initial_weight REAL    NOT NULL,
    start_date     TEXT    NOT NULL,
    target_weight  REAL    NOT NULL
);

-- Body data table
CREATE TABLE body_data
(
    id             INTEGER NOT NULL PRIMARY KEY,
    age            INTEGER NOT NULL,
    height         REAL    NOT NULL,
    weight         REAL    NOT NULL,
    sex            TEXT    NOT NULL,
    activity_level REAL    NOT NULL DEFAULT 1.0
);

-- Performance indexes for frequently queried fields
CREATE INDEX idx_intake_added ON intake(added);
CREATE INDEX idx_weight_tracker_added ON weight_tracker(added);
CREATE INDEX idx_intake_target_dates ON intake_target(start_date, end_date);
CREATE INDEX idx_weight_target_dates ON weight_target(start_date, end_date);
