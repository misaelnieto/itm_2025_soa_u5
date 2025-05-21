# models.py
from typing import List, Dict, Tuple, Optional
from pydantic import BaseModel, Field


class SolicitudRegistroJugador(BaseModel):
    id_partida: str = Field(..., description="Identificador de la partida")
    jugador: str = Field(..., description="Nombre o ID del jugador ('jugador1' o 'jugador2')")
    secreto: str = Field(..., min_length=5, max_length=5, description="Número secreto de 5 dígitos únicos")

class RespuestaGenerica(BaseModel):
    mensaje: str = Field(..., description="Mensaje de respuesta genérico")

class SolicitudIntento(BaseModel):
    id_partida: str = Field(..., description="Identificador de la partida")
    jugador: str = Field(..., description="Jugador que realiza el intento")
    intento: str = Field(..., min_length=5, max_length=5, description="Número intentado de 5 dígitos únicos")

class RespuestaIntento(BaseModel):
    fijas: int = Field(..., ge=0, le=5, description="Cantidad de dígitos en posición correcta")
    picas: int = Field(..., ge=0, le=5, description="Cantidad de dígitos en número pero en posición incorrecta")
    intentos: int = Field(..., ge=1, description="Número de intentos realizados por el jugador")
    mensaje: str = Field(..., description="Mensaje de progreso o victoria")

class ItemHistorial(BaseModel):
    intento: str = Field(..., description="Número intentado")
    picas: int = Field(..., description="Picas obtenidas")
    fijas: int = Field(..., description="Fijas obtenidas")

class RespuestaHistorial(BaseModel):
    id_partida: str = Field(..., description="Identificador de la partida")
    jugador: str = Field(..., description="Jugador cuyo historial se consulta")
    historial: List[ItemHistorial] = Field(..., description="Lista de intentos realizados")

class RespuestaEstadoPartida(BaseModel):
    id_partida: str = Field(..., description="Identificador de la partida")
    finalizada: bool = Field(..., description="Indica si la partida ha terminado")
    ganador: Optional[str] = Field(None, description="Jugador ganador o None si aún no hay ganador")
    puntuacion: Optional[int] = Field(None, description="Puntuación final del ganador") ### Puntuacion

class Juego:
    def __init__(self, id_partida: str):
        self.id_partida: str = id_partida
        # Almacena los números secretos de ambos jugadores
        self.secretos: Dict[str, str] = {}  # ej. {"nachito": "12345", "jose": "67890"}
        # Historial de intentos: lista de tuplas (intento, picas, fijas)
        self.intentos: Dict[str, List[Tuple[str, int, int]]] = {}

    def registrar_jugador(self, jugador: str, secreto: str) -> None:
        """
        Registra el número secreto de un jugador.
        El número debe ser una cadena de 5 dígitos únicos.
        """
        if len(secreto) != 5 or not secreto.isdigit() or len(set(secreto)) != 5:
            raise ValueError("El secreto debe ser 5 dígitos únicos.")
        self.secretos[jugador] = secreto

    def intento(self, jugador: str, intento: str) -> Tuple[int, int]:
        """
        El jugador 'jugador' envía un intento para adivinar el número del oponente.
        Devuelve una tupla (fijas, picas) y guarda el intento.
        """
        if jugador not in self.secretos:
            raise ValueError(f"El jugador {jugador} no está registrado.")
    
        oponente = None
        for j in self.secretos:
            if j != jugador:
                oponente = j
                break
        if oponente is None:
            raise ValueError("No hay oponente registrado aún.")

        secreto = self.secretos[oponente]
        if len(intento) != 5 or not intento.isdigit() or len(set(intento)) != 5:
            raise ValueError("El intento debe ser 5 dígitos únicos.")

        # Calcular fijas y picas
        fijas = sum(s == i for s, i in zip(secreto, intento))
        picas = sum(min(secreto.count(d), intento.count(d)) for d in set(intento)) - fijas

        # Guardar intento en el historial
        if jugador not in self.intentos:
            self.intentos[jugador] = []
        self.intentos[jugador].append((intento, picas, fijas))

        return fijas, picas

    def obtener_historial(self, jugador: str) -> List[Tuple[str, int, int]]:
        """
        Devuelve la lista de intentos realizados por 'jugador'.
        """
        return self.intentos.get(jugador, [])

    def esta_finalizado(self) -> bool:
        """
        Retorna True si alguno de los jugadores obtuvo 5 fijas en su último intento.
        """
        for intentos in self.intentos.values():
            if intentos and intentos[-1][2] == 5:
                return True
        return False

    def obtener_ganador(self) -> Optional[str]:
        """
        Retorna el nombre del jugador que ganó, o None si no hay ganador aún.
        """
        for jugador, intentos in self.intentos.items():
            if intentos and intentos[-1][2] == 5:
                return jugador
        return None
### datos para leaderboard
class EntradaLeaderboard(BaseModel):
    rank: int
    jugador: str
    puntuacion: int
### mostrar leaderboard
class RespuestaLeaderboard(BaseModel):
    top: List[EntradaLeaderboard]
