from sqlalchemy import Column, Integer, String
from app.database import Base

class Leaderboard(Base):
    __tablename__ = "leaderboard"

    id = Column(Integer, primary_key=True, index=True)
    jugador = Column(String, index=True)
    puntuacion = Column(Integer)
