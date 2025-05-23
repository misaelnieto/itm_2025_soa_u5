import sqlite3

DB_PATH = "/ruta/compartida/base_datos.py"



def get_connection():
    return sqlite3.connect(DB_PATH)