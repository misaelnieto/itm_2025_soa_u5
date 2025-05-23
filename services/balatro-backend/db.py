import sqlite3

DB_PATH = "/app/data/balatro_leadeboard.db"



def get_connection():
    return sqlite3.connect(DB_PATH)