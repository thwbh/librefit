use math::round::half_away_from_zero;

/// Wraps [half_away_from_zero] to make f32 rounding less verbose.
pub fn floor_f32(value: f32, precision: i8) -> f32 {
    half_away_from_zero(value as f64, precision) as f32
}
