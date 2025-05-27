#game.py
from typing import List, Dict, Tuple

class Juego:
    def __init__(self, id_partida: str):
        self.id_partida: str = id_partida
        # Almacena los numeros secretos de ambos jugadores
        self.secretos: Dict[str, str] = {}  # ej. {"jugador1": "12345", "jugador2": "67890"}
        # Historial de intentos: lista de tuplas (intento, picas, fijas)
        self.intentos: Dict[str, List[Tuple[str, int, int]]] = {} # Almacena los intentos de cada jugador
        ###puntuacion
        #self.puntuaciones: Dict[str, int] = {}
        self.puntuaciones = {
            "jugador1":0,
            "jugador2":0
        }
        self.finalizada = False
        self.ganador = None

    def finalizar_partida(self, ganador: str):
        """
        Marca la partida como finalizada
        """
        self.finalizada = True
        self.ganador = ganador
        self.puntuaciones[ganador] += 1000  # Asignar puntos al ganador




    def registrar_jugador(self, jugador: str, secreto: str) -> None: # esta linea es para el registro de los jugadores
        """
        Registra el numero secreto de un jugador.
        El numero debe ser una cadena de 5 digitos unicos.
        """
        if len(secreto) != 5 or not secreto.isdigit() or len(set(secreto)) != 5: # verifica que el numero sea de 5 digitos unicos
            raise ValueError("El numero debe ser 5 digitos unicos.")
        self.secretos[jugador] = secreto
        if jugador not in self.intentos:
            self.intentos[jugador] = []
            self.puntuaciones[jugador] = 500 ### puntacion inicial de 500 puntos

    def intento(self, jugador: str, intento: str) -> Tuple[int, int]:
        """
        El jugador 'jugador' envia un intento para adivinar el numero del oponente.
        Devuelve una tupla (fijas, picas) y guarda el intento.
        """
        if jugador not in self.secretos: # verifica que el jugador haya registrado su numero
            raise ValueError(f"El jugador {jugador} no ha registrado su numero.")
        
        # Buscar oponente diferente al jugador actual
        oponentes = [j for j in self.secretos if j != jugador]
        if not oponentes:
            raise ValueError("Aun no hay un oponente registrado.")
        oponente = oponentes[0]

        secreto = self.secretos[oponente]
        if len(intento) != 5 or not intento.isdigit() or len(set(intento)) != 5:
            raise ValueError("El intento debe ser 5 digitos unicos.")

        # Calcular fijas y picas
        fijas = sum(s == i for s, i in zip(secreto, intento))
        picas = sum(min(secreto.count(d), intento.count(d)) for d in set(intento)) - fijas
        
        ### actulizar puntuacion de los jugadores
        self.puntuaciones[jugador] -= 18
        numero_intentos = len(self.intentos[jugador]) + 1
        if fijas == 5:
            if numero_intentos == 1:
                self.puntuaciones[jugador] += 1000
            elif numero_intentos == 2:
                self.puntuaciones[jugador] += 500

        # Guardar intento en el historial
        self.intentos[jugador].append((intento, picas, fijas))

        return fijas, picas

    def obtener_historial(self, jugador: str) -> List[Tuple[str, int, int]]:
        """
        Devuelve la lista de intentos realizados por 'jugador'.
        """
        return self.intentos.get(jugador, [])

    def esta_finalizado(self) -> bool:
        """
        Retorna True si alguno de los jugadores obtuvo 5 fijas en su ultimo intento.
        """
        for intentos in self.intentos.values():
            if intentos and intentos[-1][2] == 5:
                return True
        return self.finalizada

    def obtener_ganador(self) -> str:
        """
        Retorna el nombre del jugador que gano, o None si no hay ganador aun.
        """
        for jugador, intentos in self.intentos.items():
            if intentos and intentos[-1][2] == 5:
                return jugador
        return self.ganador
    ### para puntuacion
    def obtener_puntuacion(self, jugador: str) -> int:
        return self.puntuaciones.get(jugador, 0)

    def reinicar(self):
        """
        Opcional: reinicar la partida para una nueva partida
        """
        self.finalizada = False
        self.ganador = None
        self.puntuaciones = {
            "jugador": 0,
            "jugador2": 0
        }
        