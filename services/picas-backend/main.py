#main.py
from fastapi import FastAPI, HTTPException
from typing import Dict

from game import Juego
from models import (
    SolicitudRegistroJugador,
    RespuestaGenerica,
    SolicitudIntento,
    RespuestaIntento,
    RespuestaHistorial,
    ItemHistorial,
    RespuestaEstadoPartida,
)

app = FastAPI(title="API Picas y Fijas")

id_partida_fija = "partida-unica"
partidas: Dict[str, Juego] = {
    id_partida_fija: Juego(id_partida_fija)
}


@app.post("/registrar", response_model=RespuestaGenerica)
def registrar_jugador(req: SolicitudRegistroJugador):
    # Registra el número secreto de un jugador
    partida = partidas(id_partida_fija)
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
    return RespuestaEstadoPartida(
        id_partida=id_partida_fija,
        finalizada=partida.esta_finalizado(),
        ganador=partida.obtener_ganador(),
    )
