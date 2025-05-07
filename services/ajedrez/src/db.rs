use crate::models::{AjedrezSession, AjedrezSessionNew, AjedrezSessionState, MoveOutcome, MoveRequest, MoveResponse};
use crate::schema::sessions::dsl::*;
use ajedrez::{BoardAsFEN, Color, FENStringParsing, INITIAL_FEN_BOARD, Move};
use chrono::Utc;
use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use dotenvy::dotenv;
use std::env;
use std::str::FromStr;
use anyhow::{Context, Result};
use anyhow::anyhow;

fn generate_pgn() -> String {
    // Get the current date in "YYYY.MM.DD" format
    let today = Utc::now().format("%Y.%m.%d").to_string();
    format!(
        r#"[Event "Ajedrez"]
[Site "Online"]
[Date "{}"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
"#,
        today
    )
}

pub fn establish_connection() -> SqliteConnection {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    
    SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}

pub fn load_sessions(conn: &mut SqliteConnection) -> Vec<AjedrezSession> {
    let query = sessions.limit(5).select(AjedrezSession::as_select());
    query.load(conn).expect("Error loading sessions")
}

pub fn create_session(
    db_connection: &mut SqliteConnection,
    white_player_id: i32,
    black_player_id: i32,
) -> AjedrezSession {
    let new_session = AjedrezSessionNew {
        white_player: &white_player_id,
        black_player: &black_player_id,
        state: "Pending",
        fen_state: INITIAL_FEN_BOARD,
        pgn_state: &generate_pgn(),
    };

    diesel::insert_into(sessions)
        .values(&new_session)
        .get_result(db_connection)
        .expect("Error creating new session")
}

pub fn make_movement(db_connection: &mut SqliteConnection, request: MoveRequest) -> MoveResponse {
    // Primero checar si la sesión existe
    let query_result = sessions
        .find(request.session_id)
        .select(AjedrezSession::as_select())
        .first(db_connection)
        .optional();

    let game_session = match query_result {
        Ok(Some(gs)) => gs,
        Ok(None) => {
            return MoveResponse {
                result: MoveOutcome::SessionDoesNotExist,
                description: String::from("Session does not exists"),
            };
        }
        Err(e) => {
            return MoveResponse {
                result: MoveOutcome::DatabaseError,
                description: format!("Some database error happened: {}", e),
            };
        }
    };

    // Luego checar si el jugador esta en la partida
    if request.player_id != game_session.black_player
        && request.player_id != game_session.white_player
    {
        return MoveResponse {
            result: MoveOutcome::UserNotInSession,
            description: String::from("This user is not in the play session"),
        };
    }

    // Cargar el estado del juego
    let mut board = match game_session.fen_state.parse_fen() {
        Ok(b) => b,
        Err(e) => {
            return MoveResponse {
                result: MoveOutcome::FenParseError,
                description: format!("Can't load the board state from database: {:#?}", e),
            };
        }
    };

    // Checar si el jugador es del color correcto
    if request.player_id == game_session.white_player && board.active_color == Color::Black {
        return MoveResponse {
            result: MoveOutcome::InvalidMove,
            description: format!(
                "Player {} is White, but next turn is for Black",
                game_session.white_player
            ),
        };
    }
    if request.player_id == game_session.black_player && board.active_color == Color::White {
        return MoveResponse {
            result: MoveOutcome::InvalidMove,
            description: format!(
                "Player {} is Black, but next turn is for White",
                game_session.black_player
            ),
        };
    }

    let player_move = match Move::from_str(&request.move_alg) {
        Ok(m) => m,
        Err(e) => {
            return MoveResponse {
                result: MoveOutcome::InvalidMove,
                description: format!("Failed to parse the movement: {:#?}", e),
            };
        }
    };

    // Hacer el movimiento
    let move_result = match board.move_piece(player_move) {
        Ok(res) => res,
        Err(e) => {
            return MoveResponse {
                result: MoveOutcome::InvalidMove,
                description: format!("Failed to make the movement {:#?}", e),
            };
        }
    };

    // Actualiza la BD con el nuevo estatus del juego
    let update_result = diesel::update(sessions)
        .filter(id.eq(game_session.id))
        .set((state.eq("Started"), fen_state.eq(board.as_fen())))
        .execute(db_connection);

    match update_result {
        Ok(updated_rows) => {
            if updated_rows != 1 {
                return MoveResponse {
                    result: MoveOutcome::DatabaseError,
                    description: "The game state was not updated".to_owned(),
                };
            }
        }
        Err(e) => {
            return MoveResponse {
                result: MoveOutcome::DatabaseError,
                description: format!("Database error when updating the game state {:#?}", e),
            };
        }
    }

    // regresar el resultado
    MoveResponse {
        result: MoveOutcome::ValidMove,
        description: move_result,
    }
}

pub fn get_session_state(db_connection: &mut SqliteConnection, session_id: i32) -> Result<AjedrezSessionState> {
    // Query the session
    let game_session = sessions
        .filter(id.eq(session_id))
        .select(AjedrezSession::as_select())
        .first(db_connection)
        .optional()
        .context("Failed to query session")?
        .ok_or_else(|| anyhow!("Session does not exist"))?;

    // Load the game state
    let board = game_session
        .fen_state
        .parse_fen()
        .with_context(|| format!("Can't load the board state from database: {}", game_session.fen_state))?;

    Ok(AjedrezSessionState {
        db_state: game_session,
        board,
    })
}

