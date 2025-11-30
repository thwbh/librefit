-- Drop all indexes
DROP INDEX IF EXISTS idx_weight_target_dates;
DROP INDEX IF EXISTS idx_intake_target_dates;
DROP INDEX IF EXISTS idx_weight_tracker_added;
DROP INDEX IF EXISTS idx_intake_added;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS body_data;
DROP TABLE IF EXISTS weight_target;
DROP TABLE IF EXISTS intake_target;
DROP TABLE IF EXISTS food_category;
DROP TABLE IF EXISTS weight_tracker;
DROP TABLE IF EXISTS intake;
DROP TABLE IF EXISTS libre_user;
