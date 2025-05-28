import datetime
import sqlite3

DB_PATH = "/app/data/balatro_leadeboard.db"



def get_connection():
    return sqlite3.connect(DB_PATH)

def create_tables():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS leaderboard (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                score INTEGER NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()

def get_leaderboard():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name, score, date FROM leaderboard ORDER BY score DESC LIMIT 10")
    rows = cursor.fetchall()
    conn.close()
    return rows

def insert_score(name, score):
    connection = get_connection()
    cursor = connection.cursor()
    now = datetime.datetime.now()

    cursor.execute("SELECT name FROM leaderboard WHERE name = ?", (name,))
    result = cursor.fetchone()

    if result is None:
        cursor.execute(
            "INSERT INTO leaderboard (name, score, date) VALUES (?, ?, ?)",
            (name, score, now)
        )
    else:
        cursor.execute(
            "UPDATE leaderboard SET score = ?, date = ? WHERE name = ?",
            (score, now, name)
        )

    connection.commit()
    connection.close()