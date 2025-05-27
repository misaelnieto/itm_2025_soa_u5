#main.py
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from app.game_manager import GameRoom
from typing import Dict
import logging 
from sqlalchemy.orm import Session
import json
import asyncio

from app.game import Juego
from app.models import (
    SolicitudRegistroJugador,
    RespuestaGenerica,
    SolicitudIntento,
    RespuestaIntento,
    RespuestaHistorial,
    ItemHistorial,
    RespuestaEstadoPartida,
    EntradaLeaderboard,
    RespuestaLeaderboard
)
from app.database import Base, engine
from app.db_models import Leaderboard, Partida

from app.database import SessionLocal


def init_db(): #### Creacion de la base de datos 
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Verifica si ya hay datos para evitar duplicados
    count = db.query(Leaderboard).count()
    if count == 0:
        #se crean 10 registros de prueba
        for i in range(1, 11):
            jugador = f"JugadorPrueba_{i}"
            puntuacion = 60 - (i * 5)  # Puntuaciones de prueba
            entrada = Leaderboard(jugador=jugador, puntuacion=puntuacion)
            db.add(entrada)
        db.commit()
        logging.info("Se insertaron 10 registros de prueba en Leaderboard")
    else:
        logging.info("La tabla Leaderboard ya tiene registros. NO se insertaron datos de prueba.")
    # Inicializa la partida única si no existe
    if not db.query(Partida).filter_by(id="partida-unica").first():
        nueva = Partida(id="partida-unica", jugador1=None, jugador2=None, historial1=None, historial2=None)
        db.add(nueva)
        db.commit()
    db.close()

app = FastAPI(title="API Picas y Fijas")
room = GameRoom()

logging.basicConfig(level=logging.INFO)


# Permitir acceso desde tu frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # o tu dominio específico
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.websocket("/juegos/picas-backend/ws")
async def websocket_endpoint(websocket: WebSocket):
    logging.info("intentanding")
    await websocket.accept()
    
    role = room.add_player(websocket)
    if not role:
        await websocket.send_json({"type": "error", "message": "Sala llena"})
        await websocket.close()
        return

    await websocket.send_json({"type": "role", "role": role})
    # Enviar status inicial waiting
    await websocket.send_json({"type": "status", "status": "waiting"})

    # Si ambos jugadores están conectados, notifica a todos los clientes (para frontend: ocultar wait-background)
    if room.both_online():
        for ws in room.players:
            await ws.send_json({"type": "both_connected"})

    # Si ambos jugadores ya están listos, notifica a este cliente (para iniciar juego si recarga)
    if room.both_ready():
        await websocket.send_json({"type": "start"})

    try:
        while True:
            data = await websocket.receive_json()

            if data["type"] == "ready":
                secret = data["secret"]
                room.set_ready(websocket, secret)
                opponent = room.get_opponent(websocket)

                # Notificar al oponente si el jugador actual ya está listo
                if opponent:
                    await opponent.send_json({"type": "status", "status": "ready"})

                # Solo notificar 'waiting' si NO están ambos listos
                if not room.both_ready():
                    await websocket.send_json({"type": "status", "status": "waiting"})

                if room.both_ready():
                    # Notificar a ambos que ya pueden jugar
                    for ws in [websocket, opponent]:
                        if ws:
                            await ws.send_json({"type": "start"})

    except WebSocketDisconnect:
        room.remove_player(websocket)
        # Reinicia el GameRoom y el estado de la partida si ya no quedan jugadores
        if len(room.players) == 0:
            room.players.clear()  # Limpia GameRoom
            partidas[id_partida_fija] = Juego(id_partida_fija)  # Reinicia la partida en memoria
            # Limpiar historial en la base de datos
            db: Session = SessionLocal()
            partida_db = db.query(Partida).filter_by(id="partida-unica").first()
            if partida_db:
                partida_db.historial1 = None
                partida_db.historial2 = None
                db.commit()
            db.close()
        # Notificar al oponente que el jugador se fue
        opponent = room.get_opponent(websocket)
        if opponent:
            await opponent.send_json({"type": "opponent_left"})

id_partida_fija = "partida-unica"
partidas: Dict[str, Juego] = {
    id_partida_fija: Juego(id_partida_fija)
}


@app.post("/registrar", response_model=RespuestaGenerica)
def registrar_jugador(req: SolicitudRegistroJugador):
    db: Session = SessionLocal()
    partida_db = db.query(Partida).filter_by(id="partida-unica").first()
    if not partida_db:
        partida_db = Partida(id="partida-unica")
        db.add(partida_db)
        db.commit()
        db.refresh(partida_db)
    # Guardar el secreto en la columna correspondiente
    if req.jugador == "jugador1":
        partida_db.jugador1 = req.secreto
    elif req.jugador == "jugador2":
        partida_db.jugador2 = req.secreto
    else:
        db.close()
        raise HTTPException(status_code=400, detail="Rol de jugador inválido")
    db.commit()
    db.close()
    return RespuestaGenerica(mensaje=f"Jugador {req.jugador} registrado exitosamente")


@app.post("/intentar", response_model=RespuestaIntento)
def realizar_intento(req: SolicitudIntento, background_tasks: BackgroundTasks = None):
    db: Session = SessionLocal()
    partida_db = db.query(Partida).filter_by(id="partida-unica").first()
    if not partida_db:
        db.close()
        raise HTTPException(status_code=400, detail="No existe la partida")
    # Obtener el secreto del oponente
    if req.jugador == "jugador1":
        secreto_oponente = partida_db.jugador2
        historial_key = "historial1"
        oponente_rol = "jugador2"
    elif req.jugador == "jugador2":
        secreto_oponente = partida_db.jugador1
        historial_key = "historial2"
        oponente_rol = "jugador1"
    else:
        db.close()
        raise HTTPException(status_code=400, detail="Rol de jugador inválido")
    if not secreto_oponente:
        db.close()
        raise HTTPException(status_code=400, detail="El contrincante no ha registrado su número")
    # Validar intento
    intento = req.intento
    if len(intento) != 5 or not intento.isdigit() or len(set(intento)) != 5:
        db.close()
        raise HTTPException(status_code=400, detail="El intento debe ser 5 dígitos únicos.")
    # Calcular fijas y picas
    fijas = sum(s == i for s, i in zip(secreto_oponente, intento))
    picas = sum(min(secreto_oponente.count(d), intento.count(d)) for d in set(intento)) - fijas
    # Guardar historial
    historial = getattr(partida_db, historial_key)
    if historial:
        historial_list = json.loads(historial)
    else:
        historial_list = []
    historial_list.append([intento, picas, fijas])
    setattr(partida_db, historial_key, json.dumps(historial_list))
    db.commit()
    db.close()
    # Enviar intento al oponente por WebSocket (si está conectado)
    if background_tasks is not None:
        background_tasks.add_task(send_opponent_guess_ws, oponente_rol, intento, picas, fijas, len(historial_list))
    ####################
    if fijas == 5:
        partidas[id_partida_fija].finalizar_partida(req.jugador)
   
        ### Enviar notificacion de fin de juego por websocket
        if background_tasks is not None:
            background_tasks.add_task(notificar_fin_juego_ws, req.jugador)
    ######################
    return RespuestaIntento(fijas=fijas, picas=picas, intentos=len(historial_list), intento=intento)

#---------
# Funcion para notificar fin del juego
#----------

async def notificar_fin_juego_ws(ganador):
    for ws in room.players:
        if ws:
            asyncio.create_task (ws.send_json({
                "type": "game_over",
                "ganador": ganador
            }))



# ---
# Función para enviar el intento al oponente por WebSocket
# ---
async def send_opponent_guess_ws(oponente_rol, intento, picas, fijas, n_intentos):
    ws = get_websocket_by_role(room, oponente_rol)
    if ws:
        await ws.send_json({
            "type": "opponent_guess",
            "intento": intento,
            "picas": picas,
            "fijas": fijas,
            "intentos": n_intentos
        })

# ---
# Utilidad para mapear rol a websocket
# ---
def get_websocket_by_role(room, role):
    for ws, info in room.players.items():
        if info["role"] == role:
            return ws
    return None

@app.get("/historial/{jugador}", response_model=RespuestaHistorial)
def obtener_historial(jugador: str):
    from sqlalchemy.orm import Session
    import json
    db: Session = SessionLocal()
    partida_db = db.query(Partida).filter_by(id="partida-unica").first()
    if not partida_db:
        db.close()
        raise HTTPException(status_code=400, detail="No existe la partida")
    if jugador == "jugador1":
        historial_json = partida_db.historial1
    elif jugador == "jugador2":
        historial_json = partida_db.historial2
    else:
        db.close()
        raise HTTPException(status_code=400, detail="Rol de jugador inválido")
    if historial_json:
        historial_raw = json.loads(historial_json)
    else:
        historial_raw = []
    historial = [ItemHistorial(intento=h[0], picas=h[1], fijas=h[2]) for h in historial_raw]
    db.close()
    return RespuestaHistorial(id_partida="partida-unica", jugador=jugador, historial=historial)

@app.get("/estado", response_model=RespuestaEstadoPartida)
def obtener_estado():

    partida = partidas[id_partida_fija]
    finalizada=partida.esta_finalizado()
    ganador=partida.obtener_ganador()
    puntuacion = None

    if finalizada and ganador:
        puntuacion = partida.puntuaciones[ganador]
        #### ##############
        db: Session = SessionLocal()
        existe = db.query(Leaderboard).filter_by(jugador=ganador, puntuacion=puntuacion).first()
        if not existe:

            nueva_entrada = Leaderboard(jugador=ganador, puntuacion=puntuacion)
            db.add(nueva_entrada)
            db.commit()
        db.close()

        return RespuestaEstadoPartida(
            id_partida=id_partida_fija,
            finalizada=finalizada,
            ganador=ganador,
            puntuacion=puntuacion
        )
### se#######
@app.get("/leaderboard", response_model=RespuestaLeaderboard)
def obtener_leaderboard():
    db: Session = SessionLocal()
    resultados = db.query(Leaderboard).order_by(Leaderboard.puntuacion.desc()).limit(10).all()
    db.close()

    entradas = [
        EntradaLeaderboard(rank=i+1, jugador=entrada.jugador, puntuacion=entrada.puntuacion)
        for i, entrada in enumerate(resultados)
]
    return RespuestaLeaderboard(top=entradas)

@app.get("/")
def root():
    return {"message": "Bienvenido a la API de Picas y Fijas!"}