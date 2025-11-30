// @generated automatically by Diesel CLI.

diesel::table! {
    body_data (id) {
        id -> Integer,
        age -> Integer,
        height -> Float,
        weight -> Float,
        sex -> Text,
        activity_level -> Float,
    }
}

diesel::table! {
    food_category (shortvalue) {
        longvalue -> Text,
        shortvalue -> Text,
    }
}

diesel::table! {
    intake (id) {
        id -> Integer,
        added -> Text,
        amount -> Integer,
        category -> Text,
        description -> Nullable<Text>,
        time -> Text,
    }
}

diesel::table! {
    intake_target (id) {
        id -> Integer,
        added -> Text,
        end_date -> Text,
        maximum_calories -> Integer,
        start_date -> Text,
        target_calories -> Integer,
    }
}

diesel::table! {
    libre_user (id) {
        id -> Integer,
        avatar -> Text,
        name -> Text,
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
        time -> Text,
    }
}

diesel::allow_tables_to_appear_in_same_query!(
    body_data,
    food_category,
    intake,
    intake_target,
    libre_user,
    weight_target,
    weight_tracker,
);
