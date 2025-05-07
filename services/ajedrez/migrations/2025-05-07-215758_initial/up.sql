CREATE TABLE sessions (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    white_player INTEGER NOT NULL,
    black_player INTEGER NOT NULL,
    state VARCHAR(32) NOT NULL,
    fen_state VARCHAR(90) NOT NULL,
    pgn_state VARCHAR(512) NOT NULL,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated DATETIME DEFAULT CURRENT_TIMESTAMP
);



-- Trigger to automatically set the updated column to now()
CREATE TRIGGER set_timestamp 
AFTER UPDATE ON sessions
BEGIN
    UPDATE sessions SET updated = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Leaderboard

CREATE TABLE leaderboard (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    winner_id INTEGER NOT NULL,
    points INTEGER NOT NULL,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);