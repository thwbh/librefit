// @generated automatically by Diesel CLI.

diesel::table! {
    calorie_target (id) {
        id -> Integer,
        added -> Text,
        end_date -> Text,
        maximum_calories -> Integer,
        start_date -> Text,
        target_calories -> Integer,
    }
}

diesel::table! {
    calorie_tracker (id) {
        id -> Integer,
        added -> Text,
        amount -> Integer,
        category -> Text,
        description -> Nullable<Text>,
    }
}

diesel::table! {
    food_category (shortvalue) {
        longvalue -> Text,
        shortvalue -> Text,
    }
}

diesel::table! {
    weight_target (id) {
        id -> Integer,
        added -> Text,
        end_date -> Text,
        initial_weight -> Float,
        start_date -> Text,
        target_weight -> Float,
    }
}

diesel::table! {
    weight_tracker (id) {
        id -> Integer,
        added -> Text,
        amount -> Float,
    }
}

diesel::allow_tables_to_appear_in_same_query!(
    calorie_target,
    calorie_tracker,
    food_category,
    weight_target,
    weight_tracker,
);
