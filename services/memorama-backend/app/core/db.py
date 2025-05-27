from sqlmodel import SQLModel, create_engine, Session

# SQLite URL
SQLITE_URL = "sqlite:///./memorama.db"

# Crear engine
engine = create_engine(
    SQLITE_URL, 
    echo=True,  # Mostrar SQL generado
    connect_args={"check_same_thread": False}  # Necesario para SQLite
)

def create_db_and_tables():
    """Crear la base de datos y tablas."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Obtener una sesión de base de datos."""
    with Session(engine) as session:
        yield session
