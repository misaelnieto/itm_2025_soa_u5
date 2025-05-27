import json
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
from sqlmodel import Session, select

from app.core.db import get_session, engine
from app.models import Game, Player, Card, GameStatus, CardStatus

# Almacenar conexiones activas
class ConnectionManager:
    def __init__(self):
        # Mapeo de ID de juego a conjunto de conexiones WebSocket
        self.active_connections: Dict[int, Dict[int, WebSocket]] = {}
        # Mapeo de conexión WebSocket a ID de jugador
        self.connection_player: Dict[WebSocket, tuple[int, int]] = {}  # (game_id, player_id)

    async def connect(self, websocket: WebSocket, game_id: int, player_id: int):
        # Inicializar el diccionario para el juego si no existe
        if game_id not in self.active_connections:
            self.active_connections[game_id] = {}
        
        # Almacenar la conexión
        self.active_connections[game_id][player_id] = websocket
        self.connection_player[websocket] = (game_id, player_id)
        
        # Enviar el estado actual del juego al jugador que se conecta
        await self.send_game_state(game_id)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.connection_player:
            game_id, player_id = self.connection_player[websocket]
            
            # Eliminar la conexión
            if game_id in self.active_connections and player_id in self.active_connections[game_id]:
                del self.active_connections[game_id][player_id]
                
                # Si no quedan conexiones para este juego, eliminar el juego
                if not self.active_connections[game_id]:
                    del self.active_connections[game_id]
            
            # Eliminar el mapeo de conexión a jugador
            del self.connection_player[websocket]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_text(json.dumps(message))

    async def broadcast(self, message: dict, game_id: int, exclude: WebSocket = None):
        if game_id in self.active_connections:
            for player_id, connection in self.active_connections[game_id].items():
                if connection != exclude:
                    await connection.send_text(json.dumps(message))

    async def send_game_state(self, game_id: int):
        """Enviar el estado actual del juego a todos los jugadores conectados."""
        with Session(engine) as session:
            game = session.get(Game, game_id)
            if not game:
                return
            
            # Convertir el juego a un diccionario
            game_data = {
                "id": game.id,
                "name": game.name,
                "status": game.status,
                "current_player": game.current_player,
                "winner": game.winner,
                "players": [
                    {
                        "id": player.id,
                        "name": player.name,
                        "score": player.score
                    }
                    for player in game.players
                ],
                "cards": [
                    {
                        "id": card.id,
                        "card_type": card.card_type,
                        "position": card.position,
                        "status": card.status
                    }
                    for card in game.cards
                ]
            }
            
            # Enviar el estado del juego a todos los jugadores
            message = {
                "type": "game_state",
                "game": game_data
            }
            
            await self.broadcast(message, game_id)

# Crear una instancia del gestor de conexiones
manager = ConnectionManager()

# Función para manejar las conexiones WebSocket
async def websocket_endpoint(websocket: WebSocket):
    # Aceptar la conexión WebSocket primero
    await websocket.accept()
    
    try:
        while True:
            # Recibir mensaje del cliente
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Procesar el mensaje según la acción
            await process_message(websocket, message)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Función para procesar mensajes recibidos
async def process_message(websocket: WebSocket, message: dict):
    action = message.get("action")
    
    with Session(engine) as session:
        if action == "create_game":
            # Crear un nuevo juego
            game_name = message.get("name", "Juego de Memorama")
            player_name = message.get("player_name", "")
            
            # Si el nombre está vacío, usar un nombre por defecto
            if not player_name or player_name.strip() == "":
                player_name = "Jugador 1"
            else:
                player_name = player_name.strip()
            
            game = Game(name=game_name, status=GameStatus.WAITING)
            session.add(game)
            session.commit()
            session.refresh(game)
            
            # Crear el primer jugador
            player = Player(name=player_name, game_id=game.id)
            session.add(player)
            session.commit()
            session.refresh(player)
            
            # Conectar al jugador
            await manager.connect(websocket, game.id, player.id)
            
            # Enviar confirmación al cliente
            await manager.send_personal_message({
                "type": "game_created",
                "game_id": game.id,
                "player_id": player.id,
                "player_name": player.name
            }, websocket)
            
        elif action == "join_game":
            # Unirse a un juego existente
            game_id = message.get("game_id")
            player_name = message.get("name", "")
            
            # Si el nombre está vacío, usar un nombre por defecto
            if not player_name or player_name.strip() == "":
                player_name = "Jugador 2"
            else:
                player_name = player_name.strip()
            
            game = session.get(Game, game_id)
            if not game:
                await manager.send_personal_message({
                    "type": "error",
                    "message": f"Juego con ID {game_id} no encontrado"
                }, websocket)
                return
            
            # Crear un nuevo jugador
            player = Player(name=player_name, game_id=game.id)
            session.add(player)
            session.commit()
            session.refresh(player)
            
            # Conectar al jugador
            await manager.connect(websocket, game.id, player.id)
            
            # Notificar a todos los jugadores
            await manager.broadcast({
                "type": "player_joined",
                "player": {
                    "id": player.id,
                    "name": player.name,
                    "score": player.score
                }
            }, game.id)
            
            # Enviar confirmación al cliente
            await manager.send_personal_message({
                "type": "game_joined",
                "game_id": game.id,
                "player_id": player.id,
                "player_name": player.name
            }, websocket)
            
        elif action == "start_game":
            # Iniciar un juego
            game_id = message.get("game_id")
            
            game = session.get(Game, game_id)
            if not game:
                await manager.send_personal_message({
                    "type": "error",
                    "message": f"Juego con ID {game_id} no encontrado"
                }, websocket)
                return
            
            # Verificar que haya al menos 2 jugadores
            players = session.exec(select(Player).where(Player.game_id == game.id)).all()
            if len(players) < 2:
                await manager.send_personal_message({
                    "type": "error",
                    "message": "Se necesitan al menos 2 jugadores para iniciar el juego"
                }, websocket)
                return
            
            # Crear cartas para el juego
            create_cards_for_game(game, session)
            
            # Actualizar estado del juego
            game.status = GameStatus.IN_PROGRESS
            game.current_player = players[0].id  # El primer jugador comienza
            session.add(game)
            session.commit()
            
            # Enviar el estado actualizado a todos los jugadores
            await manager.send_game_state(game.id)
            
            # Notificar el turno del primer jugador
            await manager.broadcast({
                "type": "player_turn",
                "player": {
                    "id": players[0].id,
                    "name": players[0].name
                }
            }, game.id)
            
        elif action == "flip_card":
            # Voltear una carta
            game_id = message.get("game_id")
            card_id = message.get("card_id")
            
            # Verificar que el juego exista
            game = session.get(Game, game_id)
            if not game:
                await manager.send_personal_message({
                    "type": "error",
                    "message": f"Juego con ID {game_id} no encontrado"
                }, websocket)
                return
            
            # Verificar que el juego esté en progreso
            if game.status != GameStatus.IN_PROGRESS:
                await manager.send_personal_message({
                    "type": "error",
                    "message": "El juego no está en progreso"
                }, websocket)
                return
            
            # Verificar que sea el turno del jugador
            if websocket in manager.connection_player:
                _, player_id = manager.connection_player[websocket]
                if player_id != game.current_player:
                    await manager.send_personal_message({
                        "type": "error",
                        "message": "No es tu turno"
                    }, websocket)
                    return
            
            # Verificar que la carta exista y pertenezca al juego
            card = session.get(Card, card_id)
            if not card or card.game_id != game.id:
                await manager.send_personal_message({
                    "type": "error",
                    "message": f"Carta con ID {card_id} no encontrada"
                }, websocket)
                return
            
            # Verificar que la carta no esté ya volteada o emparejada
            if card.status != CardStatus.HIDDEN:
                await manager.send_personal_message({
                    "type": "error",
                    "message": "La carta ya está volteada o emparejada"
                }, websocket)
                return
            
            # Obtener cartas ya volteadas
            revealed_cards = session.exec(
                select(Card).where(Card.game_id == game.id, Card.status == CardStatus.REVEALED)
            ).all()
            
            # No permitir voltear más de 2 cartas a la vez
            if len(revealed_cards) >= 2:
                await manager.send_personal_message({
                    "type": "error",
                    "message": "Ya hay 2 cartas volteadas"
                }, websocket)
                return
            
            # Voltear la carta
            card.status = CardStatus.REVEALED
            session.add(card)
            session.commit()
            
            # Enviar el estado actualizado a todos los jugadores
            await manager.send_game_state(game.id)
            
            # Si es la segunda carta volteada, comprobar si hay coincidencia
            revealed_cards = session.exec(
                select(Card).where(Card.game_id == game.id, Card.status == CardStatus.REVEALED)
            ).all()
            
            if len(revealed_cards) == 2:
                # Esperar un momento para que los jugadores vean las cartas
                import asyncio
                await asyncio.sleep(1)
                
                # Comprobar si hay coincidencia
                if revealed_cards[0].card_type == revealed_cards[1].card_type:
                    # Coincidencia encontrada
                    for card in revealed_cards:
                        card.status = CardStatus.MATCHED
                        session.add(card)
                    
                    # Actualizar puntuación del jugador actual
                    player = session.get(Player, game.current_player)
                    if player:
                        player.score += 10
                        session.add(player)
                    
                    session.commit()
                    
                    # Notificar a todos los jugadores
                    await manager.broadcast({
                        "type": "match_found",
                        "player": {
                            "id": player.id,
                            "name": player.name
                        }
                    }, game.id)
                    
                    # Comprobar si el juego ha terminado
                    matched_cards = session.exec(
                        select(Card).where(Card.game_id == game.id, Card.status == CardStatus.MATCHED)
                    ).all()
                    
                    total_cards = session.exec(
                        select(Card).where(Card.game_id == game.id)
                    ).all()
                    
                    if len(matched_cards) == len(total_cards):
                        # El juego ha terminado
                        game.status = GameStatus.COMPLETED
                        
                        # Determinar el ganador
                        players = session.exec(
                            select(Player).where(Player.game_id == game.id).order_by(Player.score.desc())
                        ).all()
                        
                        if players:
                            game.winner = players[0].id
                            session.add(game)
                            session.commit()
                            
                            # Notificar a todos los jugadores
                            await manager.broadcast({
                                "type": "game_over",
                                "winner": {
                                    "id": players[0].id,
                                    "name": players[0].name,
                                    "score": players[0].score
                                }
                            }, game.id)
                    
                    # Enviar el estado actualizado a todos los jugadores
                    await manager.send_game_state(game.id)
                else:
                    # No hay coincidencia, voltear las cartas de nuevo
                    for card in revealed_cards:
                        card.status = CardStatus.HIDDEN
                        session.add(card)
                    
                    # Cambiar el turno al siguiente jugador
                    players = session.exec(select(Player).where(Player.game_id == game.id)).all()
                    current_index = next((i for i, p in enumerate(players) if p.id == game.current_player), 0)
                    next_index = (current_index + 1) % len(players)
                    game.current_player = players[next_index].id
                    
                    session.add(game)
                    session.commit()
                    
                    # Notificar el cambio de turno
                    await manager.broadcast({
                        "type": "player_turn",
                        "player": {
                            "id": players[next_index].id,
                            "name": players[next_index].name
                        }
                    }, game.id)
                    
                    # Enviar el estado actualizado a todos los jugadores
                    await manager.send_game_state(game.id)
            
        elif action == "reset_game":
            # Reiniciar un juego
            game_id = message.get("game_id")
            
            game = session.get(Game, game_id)
            if not game:
                await manager.send_personal_message({
                    "type": "error",
                    "message": f"Juego con ID {game_id} no encontrado"
                }, websocket)
                return
            
            # Eliminar todas las cartas del juego
            cards = session.exec(select(Card).where(Card.game_id == game.id)).all()
            for card in cards:
                session.delete(card)
            
            # Reiniciar puntuaciones de los jugadores
            players = session.exec(select(Player).where(Player.game_id == game.id)).all()
            for player in players:
                player.score = 0
                session.add(player)
            
            # Actualizar estado del juego
            game.status = GameStatus.WAITING
            game.current_player = None
            game.winner = None
            
            session.add(game)
            session.commit()
            
            # Enviar el estado actualizado a todos los jugadores
            await manager.send_game_state(game.id)

# Función para crear cartas para un juego
def create_cards_for_game(game: Game, session: Session):
    """Crear cartas para un juego."""
    import random
    
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
