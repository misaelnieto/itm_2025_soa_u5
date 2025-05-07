use clap::ArgAction;
use clap::{arg, builder::styling, value_parser, Command, Arg};
use ajedrez_svc::db::{load_sessions, create_session, establish_connection, make_movement, get_session_state};
use ajedrez_svc::models::{MoveRequest, MoveOutcome};
use uuid::Uuid;
use tabled;
use diesel::sqlite::SqliteConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

const STYLES: styling::Styles = styling::Styles::styled()
.header(styling::AnsiColor::Green.on_default().bold())
.usage(styling::AnsiColor::Green.on_default().bold())
.literal(styling::AnsiColor::Blue.on_default().bold())
.placeholder(styling::AnsiColor::Cyan.on_default());


fn main() {
    let matches = Command::new("Ajedrez cli")
        .styles(STYLES)
        .version("0.1")
        .about("This is the Ajedrez command line utility")
        .next_line_help(true)
        .subcommand(
            Command::new("init")
                .about("Initialize the database")
        )
        .subcommand(
            Command::new("create_session")
                .about("Creates a new chess session")
        )
        .subcommand(
            Command::new("list")
                .about("Lists the chess sessions")
        )
        .subcommand(
            Command::new("make_move")
                .about("Make a move.")
                .arg(
                    Arg::new("session_uuid")
                    .short('s')
                    .long("session")
                    .help("UUID of the chess session")
                    .required(true)
                    .value_parser(value_parser!(Uuid))
                    .action(ArgAction::Set)
                )
                .arg(
                    Arg::new("player_uuid")
                    .short('p')
                    .long("player")
                    .help("UUID of the player making the move")
                    .required(true)
                    .value_parser(value_parser!(Uuid))
                    .action(ArgAction::Set)
                )
                .arg(arg!(-m --move <MOVE> "The move in algebraic notation").required(true))
        )
        .subcommand(
            Command::new("inspect")
                .about("Inspect the current state of a chess session")
                .arg(
                    Arg::new("session_uuid")
                    .short('s')
                    .long("session")
                    .help("UUID of the chess session")
                    .required(true)
                    .value_parser(value_parser!(Uuid))
                    .action(ArgAction::Set)
                )
        )
        .get_matches();

    let connection = &mut establish_connection();

    match matches.subcommand() {
        Some(("init", _)) => {
            cmd_init_db(connection);
        }
        Some(("create_session", _)) => {
            cmd_create_session(connection);
        }
        Some(("list", _)) => {
            cmd_list_session(connection);
        }
        Some(("make_move", submatch)) => {
            cmd_make_move(connection, submatch);
        }
        Some(("inspect", submatch)) => {
            let session_id = submatch.get_one::<i32>("session_id").unwrap();
            let game_session = get_session_state(connection, *session_id);
            match game_session {
                Ok(current_state) => {
                    use tabled::Table;
                    use tabled::settings::Rotate;
                    let mut table = Table::new(vec![current_state.db_state]);
                    println!("{}", table.with(Rotate::Left));
                    println!("{}", current_state.board.as_str())
                }
                Err(e) => {
                    eprintln!("Error: {}", e);
                }
            }
        }
        _ => {
            eprintln!("Unknown or missing subcommand. Use --help for usage information.");
        }
    }
}

fn cmd_init_db(connection: &mut SqliteConnection) {
    println!("Initializing database...");
    match connection.run_pending_migrations(MIGRATIONS) {
        Ok(_) => println!("Database initialized successfully"),
        Err(e) => eprintln!("Error initializing database: {}", e),
    }
}

fn cmd_make_move(connection: &mut SqliteConnection, submatch: &clap::ArgMatches) {
    let session_id = submatch.get_one::<i32>("session_id").unwrap();
    let player_id = submatch.get_one::<i32>("player_id").unwrap();
    let chess_move = submatch.get_one::<String>("move").unwrap();
    let outcome = make_movement(connection, MoveRequest { session_id: *session_id, player_id: *player_id , move_alg: chess_move.clone() });

    match outcome.result {
        MoveOutcome::DatabaseError => println!("Database error: {}", outcome.description),
        MoveOutcome::SessionDoesNotExist => println!("That session does not exist") ,
        MoveOutcome::UserNotInSession => println!("That user is not a player on this session"),
        MoveOutcome::InvalidMove => println!("Invalid move: {}", outcome.description),
        MoveOutcome::ValidMove => println!("Move: {}",outcome.description),
        MoveOutcome::FenParseError => println!("{}", outcome.description),
    }
}

fn cmd_list_session(connection: &mut SqliteConnection) {
    println!("Connecting to db ...");
    let game_sessions = load_sessions(connection);
    let table = tabled::Table::new(game_sessions)
        .with(tabled::settings::Style::rounded())
        .to_string();
    println!("{}", table);
}

fn cmd_create_session(connection: &mut SqliteConnection) {
    println!("Creating user session");
    let white_player_id = 123;
    let black_player_id = 123;
    let new_session = create_session(
        connection,
        white_player_id,
        black_player_id
    );
    println!("New chess session: {:?}", new_session);
}