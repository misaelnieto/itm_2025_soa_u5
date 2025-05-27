from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
import random

from app.core.db import get_session
from app.models import Game, Player, Card, GameStatus, CardStatus

router = APIRouter(
    prefix="/api/games",
    tags=["games"],
)

# Símbolos para las cartas
CARD_SYMBOLS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐮', '🐷']

@router.get("/", response_model=List[Game])
def get_games(session: Session = Depends(get_session)):
    """Obtener todos los juegos."""
    games = session.exec(select(Game)).all()
    return games


@router.post("/", response_model=Game)
def create_game(name: str, session: Session = Depends(get_session)):
    """Crear un nuevo juego."""
    game = Game(name=name)
    session.add(game)
    session.commit()
    session.refresh(game)
    return game


@router.get("/{game_id}", response_model=Game)
def get_game(game_id: int, session: Session = Depends(get_session)):
    """Obtener un juego por su ID."""
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Juego con ID {game_id} no encontrado")
    return game


@router.post("/{game_id}/start", response_model=Game)
def start_game(game_id: int, session: Session = Depends(get_session)):
    """Iniciar un juego."""
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Juego con ID {game_id} no encontrado")
    
    if game.status != GameStatus.WAITING:
        raise HTTPException(status_code=400, detail="El juego ya ha sido iniciado")
    
    # Verificar que haya al menos 2 jugadores
    players = session.exec(select(Player).where(Player.game_id == game_id)).all()
    if len(players) < 2:
        raise HTTPException(status_code=400, detail="Se necesitan al menos 2 jugadores para iniciar el juego")
    
    # Crear cartas para el juego
    create_cards_for_game(game, session)
    
    # Actualizar estado del juego
    game.status = GameStatus.IN_PROGRESS
    game.current_player = players[0].id  # El primer jugador comienza
    session.add(game)
    session.commit()
    session.refresh(game)
    
    return game


@router.post("/{game_id}/players", response_model=Player)
def add_player(game_id: int, name: str, session: Session = Depends(get_session)):
    """Añadir un jugador a un juego."""
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Juego con ID {game_id} no encontrado")
    
    # Verificar que el juego esté en estado de espera
    if game.status != GameStatus.WAITING:
        raise HTTPException(status_code=400, detail="No se pueden añadir jugadores a un juego en progreso o completado")
    
    # Verificar que no haya más de 2 jugadores
    players = session.exec(select(Player).where(Player.game_id == game_id)).all()
    if len(players) >= 2:
        raise HTTPException(status_code=400, detail="El juego ya tiene el máximo de jugadores (2)")
    
    # Crear el jugador
    player = Player(name=name, game_id=game_id)
    session.add(player)
    session.commit()
    session.refresh(player)
    return player


@router.get("/{game_id}/players", response_model=List[Player])
def get_players(game_id: int, session: Session = Depends(get_session)):
    """Obtener todos los jugadores de un juego."""
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Juego con ID {game_id} no encontrado")
    
    players = session.exec(select(Player).where(Player.game_id == game_id)).all()
    return players


@router.get("/{game_id}/cards", response_model=List[Card])
def get_cards(game_id: int, session: Session = Depends(get_session)):
    """Obtener todas las cartas de un juego."""
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Juego con ID {game_id} no encontrado")
    
    cards = session.exec(select(Card).where(Card.game_id == game_id)).all()
    return cards


@router.post("/{game_id}/cards/{card_id}/flip", response_model=Card)
def flip_card(game_id: int, card_id: int, session: Session = Depends(get_session)):
    """Voltear una carta."""
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Juego con ID {game_id} no encontrado")
    
    if game.status != GameStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="El juego no está en progreso")
    
    card = session.get(Card, card_id)
    if not card or card.game_id != game_id:
        raise HTTPException(status_code=404, detail=f"Carta con ID {card_id} no encontrada")
    
    if card.status != CardStatus.HIDDEN:
        raise HTTPException(status_code=400, detail="La carta ya está volteada o emparejada")
    
    # Obtener cartas ya volteadas
    revealed_cards = session.exec(
        select(Card).where(Card.game_id == game_id, Card.status == CardStatus.REVEALED)
    ).all()
    
    # No permitir voltear más de 2 cartas a la vez
    if len(revealed_cards) >= 2:
        raise HTTPException(status_code=400, detail="Ya hay 2 cartas volteadas")
    
    # Voltear la carta
    card.status = CardStatus.REVEALED
    session.add(card)
    session.commit()
    session.refresh(card)
    
    return card


@router.post("/{game_id}/check-match", response_model=Game)
def check_match(game_id: int, session: Session = Depends(get_session)):
    """Comprobar si hay coincidencia entre las cartas volteadas."""
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Juego con ID {game_id} no encontrado")
    
    if game.status != GameStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="El juego no está en progreso")
    
    # Obtener cartas volteadas
    revealed_cards = session.exec(
        select(Card).where(Card.game_id == game_id, Card.status == CardStatus.REVEALED)
    ).all()
    
    if len(revealed_cards) != 2:
        raise HTTPException(status_code=400, detail="Debe haber exactamente 2 cartas volteadas")
    
    # Comprobar si hay coincidencia
    if revealed_cards[0].card_type == revealed_cards[1].card_type:
        # Coincidencia encontrada
        for card in revealed_cards:
            card.status = CardStatus.MATCHED
            session.add(card)
        
        # Actualizar puntuación del jugador actual
        if game.current_player:
            player = session.get(Player, game.current_player)
            if player:
                player.score += 10
                session.add(player)
    else:
        # No hay coincidencia, voltear las cartas de nuevo
        for card in revealed_cards:
            card.status = CardStatus.HIDDEN
            session.add(card)
        
        # Cambiar el turno al siguiente jugador
        players = session.exec(select(Player).where(Player.game_id == game_id)).all()
        current_index = next((i for i, p in enumerate(players) if p.id == game.current_player), 0)
        next_index = (current_index + 1) % len(players)
        game.current_player = players[next_index].id
    
    # Comprobar si el juego ha terminado
    matched_cards = session.exec(
        select(Card).where(Card.game_id == game_id, Card.status == CardStatus.MATCHED)
    ).all()
    
    total_cards = session.exec(
        select(Card).where(Card.game_id == game_id)
    ).all()
    
    if len(matched_cards) == len(total_cards):
        game.status = GameStatus.COMPLETED
        
        # Determinar el ganador
        players = session.exec(
            select(Player).where(Player.game_id == game_id).order_by(Player.score.desc())
        ).all()
        
        if players:
            game.winner = players[0].id
    
    session.add(game)
    session.commit()
    session.refresh(game)
    
    return game


@router.post("/{game_id}/reset", response_model=Game)
def reset_game(game_id: int, session: Session = Depends(get_session)):
    """Reiniciar un juego."""
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Juego con ID {game_id} no encontrado")
    
    # Eliminar todas las cartas del juego
    cards = session.exec(select(Card).where(Card.game_id == game_id)).all()
    for card in cards:
        session.delete(card)
    
    # Reiniciar puntuaciones de los jugadores
    players = session.exec(select(Player).where(Player.game_id == game_id)).all()
    for player in players:
        player.score = 0
        session.add(player)
    
    # Actualizar estado del juego
    game.status = GameStatus.WAITING
    game.current_player = None
    game.winner = None
    
    session.add(game)
    session.commit()
    session.refresh(game)
    
    return game


def create_cards_for_game(game: Game, session: Session):
    """Crear cartas para un juego."""
    # Seleccionar símbolos aleatorios
    selected_symbols = random.sample(CARD_SYMBOLS, min(6, len(CARD_SYMBOLS)))
    
    # Crear pares de cartas
    card_pairs = selected_symbols * 2
    random.shuffle(card_pairs)
    
    # Crear cartas en la base de datos
    for i, symbol in enumerate(card_pairs):
        card = Card(
            card_type=symbol,
            position=i,
            status=CardStatus.HIDDEN,
            game_id=game.id
        )
        session.add(card)
    
    session.commit()
