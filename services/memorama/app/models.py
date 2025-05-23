from enum import Enum
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel


class GameStatus(str, Enum):
    """Estado del juego."""
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class CardStatus(str, Enum):
    """Estado de la carta."""
    HIDDEN = "hidden"
    REVEALED = "revealed"
    MATCHED = "matched"


class PlayerBase(SQLModel):
    """Modelo base para jugador."""
    name: str
    score: int = 0


class Player(PlayerBase, table=True):
    """Modelo de jugador."""
    id: Optional[int] = Field(default=None, primary_key=True)
    game_id: Optional[int] = Field(default=None, foreign_key="game.id")
    game: Optional["Game"] = Relationship(back_populates="players")


class CardBase(SQLModel):
    """Modelo base para carta."""
    card_type: str
    position: int
    status: CardStatus = CardStatus.HIDDEN


class Card(CardBase, table=True):
    """Modelo de carta."""
    id: Optional[int] = Field(default=None, primary_key=True)
    game_id: Optional[int] = Field(default=None, foreign_key="game.id")
    game: Optional["Game"] = Relationship(back_populates="cards")


class GameBase(SQLModel):
    """Modelo base para juego."""
    name: str
    status: GameStatus = GameStatus.WAITING
    current_player: Optional[int] = None
    winner: Optional[int] = None


class Game(GameBase, table=True):
    """Modelo de juego."""
    id: Optional[int] = Field(default=None, primary_key=True)
    players: List[Player] = Relationship(back_populates="game")
    cards: List[Card] = Relationship(back_populates="game")
