-- Add activity_level column to body_data table
-- Valid values: 1.0 (sedentary), 1.25 (lightly active), 1.5 (moderately active), 1.75 (very active), 2.0 (extremely active)
ALTER TABLE body_data ADD COLUMN activity_level REAL NOT NULL DEFAULT 1.0;
