-- Add time column to intake table (default to midnight "00:00:00")
ALTER TABLE intake ADD COLUMN time TEXT NOT NULL DEFAULT '00:00:00';

-- Add time column to weight_tracker table (default to midnight "00:00:00")
ALTER TABLE weight_tracker ADD COLUMN time TEXT NOT NULL DEFAULT '00:00:00';
