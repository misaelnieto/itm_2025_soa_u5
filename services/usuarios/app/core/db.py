from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

engine = create_engine(str(settings.USUARIOS_DB_URI))


def create_db_and_tables():
    """
    Crea la base de datos y las tablas
    """
    SQLModel.metadata.create_all(engine)


def get_db_session():
    """
    Obtiene una sesión de la base de datos
    """
    with Session(engine) as session:
        yield session
