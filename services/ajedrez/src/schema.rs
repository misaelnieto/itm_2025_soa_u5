// @generated automatically by Diesel CLI.

diesel::table! {
    leaderboard (id) {
        id -> Integer,
        session_id -> Integer,
        winner_id -> Integer,
        points -> Integer,
        created -> Nullable<Timestamp>,
    }
}

diesel::table! {
    sessions (id) {
        id -> Integer,
        white_player -> Integer,
        black_player -> Integer,
        state -> Text,
        fen_state -> Text,
        pgn_state -> Text,
        created -> Nullable<Timestamp>,
        updated -> Nullable<Timestamp>,
    }
}

diesel::joinable!(leaderboard -> sessions (session_id));

diesel::allow_tables_to_appear_in_same_query!(
    leaderboard,
    sessions,
);
