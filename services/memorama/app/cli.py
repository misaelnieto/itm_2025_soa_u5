import typer
import json
import random
from typing import List, Optional
from sqlmodel import Session, select

from app.core.db import engine
from app.models import Game, Player, Card, GameStatus, CardStatus

app = typer.Typer()

def get_session():
    with Session(engine) as session:
        return session

@app.command()
def create_game(name: str = typer.Option(..., "--name", "-n", help="Nombre del juego")):
    """Crear un nuevo juego de memorama."""
    session = get_session()
    game = Game(name=name)
    session.add(game)
    session.commit()
    session.refresh(game)
    typer.echo(f"Juego creado con ID: {game.id}")

@app.command()
def list_games():
    """Listar todos los juegos de memorama."""
    session = get_session()
    games = session.exec(select(Game)).all()
    if not games:
        typer.echo("No hay juegos disponibles.")
        return
    
    for game in games:
        status = "Esperando" if game.status == GameStatus.WAITING else \
                 "En progreso" if game.status == GameStatus.IN_PROGRESS else "Completado"
        typer.echo(f"ID: {game.id}, Nombre: {game.name}, Estado: {status}")

@app.command()
def game_details(game_id: int = typer.Argument(..., help="ID del juego")):
    """Ver detalles de un juego específico."""
    session = get_session()
    game = session.get(Game, game_id)
    if not game:
        typer.echo(f"Juego con ID {game_id} no encontrado.")
        return
    
    status = "Esperando" if game.status == GameStatus.WAITING else \
             "En progreso" if game.status == GameStatus.IN_PROGRESS else "Completado"
    
    typer.echo(f"ID: {game.id}")
    typer.echo(f"Nombre: {game.name}")
    typer.echo(f"Estado: {status}")
    typer.echo(f"Jugador actual: {game.current_player}")
    typer.echo(f"Ganador: {game.winner}")
    
    typer.echo("\nJugadores:")
    for player in game.players:
        typer.echo(f"  - ID: {player.id}, Nombre: {player.name}, Puntuación: {player.score}")
    
    if game.status != GameStatus.WAITING:
        typer.echo("\nCartas:")
        for card in game.cards:
            card_status = "Oculta" if card.status == CardStatus.HIDDEN else \
                         "Revelada" if card.status == CardStatus.REVEALED else "Emparejada"
            typer.echo(f"  - ID: {card.id}, Tipo: {card.card_type}, Posición: {card.position}, Estado: {card_status}")

@app.command()
def start_game(game_id: int = typer.Argument(..., help="ID del juego")):
    """Iniciar un juego de memorama."""
    session = get_session()
    game = session.get(Game, game_id)
    if not game:
        typer.echo(f"Juego con ID {game_id} no encontrado.")
        return
    
    if game.status != GameStatus.WAITING:
        typer.echo("El juego ya ha sido iniciado.")
        return
    
    # Crear cartas para el juego
    create_cards_for_game(game, session)
    
    # Actualizar estado del juego
    game.status = GameStatus.IN_PROGRESS
    session.add(game)
    session.commit()
    session.refresh(game)
    
    typer.echo(f"Juego {game.name} iniciado correctamente.")

@app.command()
def add_player(
    game_id: int = typer.Argument(..., help="ID del juego"),
    name: str = typer.Option(..., "--name", "-n", help="Nombre del jugador")
):
    """Añadir un jugador a un juego."""
    session = get_session()
    game = session.get(Game, game_id)
    if not game:
        typer.echo(f"Juego con ID {game_id} no encontrado.")
        return
    
    player = Player(name=name, game_id=game_id)
    session.add(player)
    session.commit()
    session.refresh(player)
    
    typer.echo(f"Jugador {name} añadido al juego {game.name} con ID: {player.id}")

@app.command()
def flip_card(
    game_id: int = typer.Argument(..., help="ID del juego"),
    card_id: int = typer.Argument(..., help="ID de la carta")
):
    """Voltear una carta en el juego."""
    session = get_session()
    game = session.get(Game, game_id)
    if not game:
        typer.echo(f"Juego con ID {game_id} no encontrado.")
        return
    
    if game.status != GameStatus.IN_PROGRESS:
        typer.echo("El juego no está en progreso.")
        return
    
    card = session.get(Card, card_id)
    if not card or card.game_id != game_id:
        typer.echo(f"Carta con ID {card_id} no encontrada en el juego {game_id}.")
        return
    
    if card.status != CardStatus.HIDDEN:
        typer.echo("La carta ya está volteada o emparejada.")
        return
    
    # Voltear la carta
    card.status = CardStatus.REVEALED
    session.add(card)
    session.commit()
    session.refresh(card)
    
    typer.echo(f"Carta {card_id} volteada: {card.card_type}")
    
    # Comprobar si hay dos cartas volteadas
    revealed_cards = session.exec(
        select(Card).where(Card.game_id == game_id, Card.status == CardStatus.REVEALED)
    ).all()
    
    if len(revealed_cards) == 2:
        check_match(game_id)

@app.command()
def check_match(game_id: int = typer.Argument(..., help="ID del juego")):
    """Comprobar si hay coincidencia entre las cartas volteadas."""
    session = get_session()
    game = session.get(Game, game_id)
    if not game:
        typer.echo(f"Juego con ID {game_id} no encontrado.")
        return
    
    if game.status != GameStatus.IN_PROGRESS:
        typer.echo("El juego no está en progreso.")
        return
    
    # Obtener cartas volteadas
    revealed_cards = session.exec(
        select(Card).where(Card.game_id == game_id, Card.status == CardStatus.REVEALED)
    ).all()
    
    if len(revealed_cards) != 2:
        typer.echo("Debe haber exactamente 2 cartas volteadas.")
        return
    
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
        
        typer.echo("¡Coincidencia encontrada!")
    else:
        # No hay coincidencia, voltear las cartas de nuevo
        for card in revealed_cards:
            card.status = CardStatus.HIDDEN
            session.add(card)
        
        typer.echo("No hay coincidencia.")
    
    # Comprobar si el juego ha terminado
    matched_cards = session.exec(
        select(Card).where(Card.game_id == game_id, Card.status == CardStatus.MATCHED)
    ).all()
    
    if len(matched_cards) == len(game.cards):
        game.status = GameStatus.COMPLETED
        
        # Determinar el ganador
        players = session.exec(
            select(Player).where(Player.game_id == game_id).order_by(Player.score.desc())
        ).all()
        
        if players:
            game.winner = players[0].id
            typer.echo(f"¡Juego completado! Ganador: {players[0].name} con {players[0].score} puntos.")
    
    session.add(game)
    session.commit()

def create_cards_for_game(game: Game, session: Session):
    """Crear cartas para un juego."""
    # Símbolos para las cartas
    card_symbols = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐮', '🐷']
    
    # Seleccionar símbolos aleatorios
    selected_symbols = random.sample(card_symbols, min(6, len(card_symbols)))
    
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

if __name__ == "__main__":
    app()
