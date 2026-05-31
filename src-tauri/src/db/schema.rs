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

diesel::table! {
    workout_type (shortvalue) {
        longvalue -> Text,
        shortvalue -> Text,
    }
}

diesel::table! {
    exercise_category (shortvalue) {
        longvalue -> Text,
        shortvalue -> Text,
    }
}

diesel::table! {
    muscle (shortvalue) {
        longvalue -> Text,
        shortvalue -> Text,
    }
}

diesel::table! {
    exercise (id) {
        id -> Integer,
        name -> Text,
        category -> Text,
        default_rest_seconds -> Nullable<Integer>,
    }
}

diesel::table! {
    exercise_muscle (exercise_id, muscle) {
        exercise_id -> Integer,
        muscle -> Text,
        role -> Text,
    }
}

diesel::table! {
    workout_session (id) {
        id -> Integer,
        workout_type -> Text,
        name -> Nullable<Text>,
        started_at -> Text,
        ended_at -> Nullable<Text>,
    }
}

diesel::table! {
    workout_exercise (id) {
        id -> Integer,
        session_id -> Integer,
        exercise_id -> Integer,
        sequence -> Integer,
    }
}

diesel::table! {
    workout_set (id) {
        id -> Integer,
        workout_exercise_id -> Integer,
        sequence -> Integer,
        logged_at -> Text,
        payload_ver -> Integer,
        metrics -> Text,
    }
}

diesel::table! {
    workout_pause (id) {
        id -> Integer,
        session_id -> Integer,
        paused_at -> Text,
        resumed_at -> Nullable<Text>,
    }
}

diesel::joinable!(exercise -> exercise_category (category));
diesel::joinable!(exercise_muscle -> exercise (exercise_id));
diesel::joinable!(exercise_muscle -> muscle (muscle));
diesel::joinable!(workout_session -> workout_type (workout_type));
diesel::joinable!(workout_exercise -> workout_session (session_id));
diesel::joinable!(workout_exercise -> exercise (exercise_id));
diesel::joinable!(workout_set -> workout_exercise (workout_exercise_id));
diesel::joinable!(workout_pause -> workout_session (session_id));

diesel::allow_tables_to_appear_in_same_query!(
    body_data,
    exercise,
    exercise_category,
    exercise_muscle,
    food_category,
    intake,
    intake_target,
    libre_user,
    muscle,
    weight_target,
    weight_tracker,
    workout_exercise,
    workout_pause,
    workout_session,
    workout_set,
    workout_type,
);
