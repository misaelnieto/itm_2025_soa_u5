#main.py
from fastapi import FastAPI, HTTPException
from typing import Dict

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
from app.db_models import Leaderboard
from sqlalchemy.orm import Session
from app.database import SessionLocal
from sqlalchemy import inspect

inspector = inspect(engine)
if 'leaderboard' not in inspector.get_table_names():
    Leaderboard.__table__.create(bind=engine) #crear tabla leaderboard si no existe

#Base.metadata.create_all(bind=engine) = crear todo lo de la base de datos


app = FastAPI(title="API Picas y Fijas")

id_partida_fija = "partida-unica"
partidas: Dict[str, Juego] = {
    id_partida_fija: Juego(id_partida_fija)
}


@app.post("/registrar", response_model=RespuestaGenerica)
def registrar_jugador(req: SolicitudRegistroJugador):
    # Registra el número secreto de un jugador
    partida = partidas[id_partida_fija]
    try:
        partida.registrar_jugador(req.jugador, req.secreto)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return RespuestaGenerica(mensaje=f"Jugador {req.jugador} registrado exitosamente")

@app.post("/intentar", response_model=RespuestaIntento)
def realizar_intento(req: SolicitudIntento):
    partida = partidas[id_partida_fija]
    try:
        fijas, picas = partida.intento(req.jugador, req.intento)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    intentos_realizados = len(partida.obtener_historial(req.jugador))
    mensaje = "Sigue intentando"
    if fijas == 5:
        mensaje = f"Felicidades {req.jugador}! Has ganado."
    return RespuestaIntento(fijas=fijas, picas=picas, intentos=intentos_realizados, mensaje=mensaje)


@app.get("/historial/{jugador}", response_model=RespuestaHistorial)
def obtener_historial(jugador: str):
    partida = partidas[id_partida_fija]
    historial_raw = partida.obtener_historial(jugador)
    historial = [ItemHistorial(intento=h[0], picas=h[1], fijas=h[2]) for h in historial_raw]
    return RespuestaHistorial(id_partida=id_partida_fija, jugador=jugador, historial=historial)

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