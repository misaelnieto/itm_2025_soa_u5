use ajedrez::ChessBoard;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use rocket::form::FromForm;
use rocket_okapi::okapi::schemars;
use rocket_okapi::okapi::schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::fmt;
use tabled::Tabled;
use crate::schema::{sessions, leaderboard};

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum SessionState {
    Pending,   // Waiting for players to join
    Started,   // Game is in progress
    Paused,    // Game is temporarily paused
    Abandoned, // Game was abandoned
    Completed, // Game has ended
    Won,       // One player has won
    Draw,      // Game ended in a draw
}

impl fmt::Display for SessionState {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let state_str = match self {
            SessionState::Pending => "Pending",
            SessionState::Started => "Started",
            SessionState::Paused => "Paused",
            SessionState::Abandoned => "Abandoned",
            SessionState::Completed => "Completed",
            SessionState::Won => "Won",
            SessionState::Draw => "Draw",
        };
        write!(f, "{}", state_str)
    }
}

#[derive(Queryable, Selectable, Debug, Serialize, Deserialize, JsonSchema, Tabled)]
#[diesel(table_name = sessions)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct AjedrezSession {
    pub id: i32,
    pub white_player: i32,
    pub black_player: i32,
    pub state: String,
    #[tabled(skip = true)]
    pub fen_state: String,
    #[tabled(skip = true)]
    pub pgn_state: String,
    #[tabled(skip = true)]
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Timestamp>)]
    pub created: Option<NaiveDateTime>,
    #[tabled(skip = true)]
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Timestamp>)]
    pub updated: Option<NaiveDateTime>,
}

impl AjedrezSession {
    pub fn created_display(&self) -> String {
        self.created.map_or_else(String::new, |d| d.to_string())
    }

    pub fn updated_display(&self) -> String {
        self.updated.map_or_else(String::new, |d| d.to_string())
    }
}

#[derive(Insertable)]
#[diesel(table_name = sessions)]
pub struct AjedrezSessionNew<'a> {
    pub white_player: &'a i32,
    pub black_player: &'a i32,
    pub state: &'a str,
    pub fen_state: &'a str,
    pub pgn_state: &'a str,
}

#[derive(Debug, Serialize, Deserialize, JsonSchema, FromForm)]
pub struct SessionPlayers {
    pub black_player: i32,
    pub white_player: i32,
}

pub enum MoveOutcome {
    SessionDoesNotExist,
    UserNotInSession,
    InvalidMove,
    ValidMove,
    DatabaseError,
    FenParseError,
}

pub struct MoveRequest {
    pub session_id: i32,
    pub player_id: i32,
    pub move_alg: String,
}

pub struct MoveResponse {
    pub result: MoveOutcome,
    pub description: String,
}

pub enum AjedrezSessionStateError {
    DatabaseError,
    DoesNotExist,
    ParseError,
}

pub struct AjedrezSessionState {
    pub db_state: AjedrezSession,
    pub board: ChessBoard,
}

#[derive(Queryable, Selectable, Debug, Serialize, Deserialize, JsonSchema, Tabled)]
#[diesel(table_name = leaderboard)]
pub struct LeaderBoard {
    pub id: i32,
    pub session_id: i32,
    pub winner_id: i32,
    pub points: i32,
    #[diesel(sql_type = diesel::sql_types::Timestamp)]
    pub created: NaiveDateTime,
}

// You'll also need an insertable version for new records
#[derive(Insertable)]
#[diesel(table_name = leaderboard)]
pub struct LeaderBoardNew<'a> {
    pub session_id: &'a i32,
    pub winner_id: &'a i32,
    pub points: &'a i32,
}