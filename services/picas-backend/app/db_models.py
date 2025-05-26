from sqlalchemy import Column, Integer, String
from app.database import Base

class Leaderboard(Base):
    __tablename__ = "leaderboard"

    id = Column(Integer, primary_key=True, index=True)
    jugador = Column(String, index=True)
    puntuacion = Column(Integer)

class Partida(Base):
    __tablename__ = "partidas"
    id = Column(String, primary_key=True, index=True)  # id_partida
    jugador1 = Column(String, nullable=True)  # secreto jugador1
    jugador2 = Column(String, nullable=True)  # secreto jugador2
    historial1 = Column(String, nullable=True)  # JSON string de intentos jugador1
    historial2 = Column(String, nullable=True)  # JSON string de intentos jugador2
