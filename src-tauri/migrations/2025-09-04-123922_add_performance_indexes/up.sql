-- Add performance indexes for frequently queried fields
CREATE INDEX idx_calorie_tracker_added ON calorie_tracker(added);
CREATE INDEX idx_weight_tracker_added ON weight_tracker(added);
CREATE INDEX idx_calorie_target_dates ON calorie_target(start_date, end_date);
CREATE INDEX idx_weight_target_dates ON weight_target(start_date, end_date);
