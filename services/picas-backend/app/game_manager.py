class GameRoom:
    def __init__(self):
        self.players = {}  # socket_id: {"role": "jugador1/jugador2", "ready": False, "secret": ""}
    
    def add_player(self, websocket):
        if len(self.players) >= 2:
            return None  # sala llena
        role = "jugador1" if "jugador1" not in [p["role"] for p in self.players.values()] else "jugador2"
        self.players[websocket] = {"role": role, "ready": False, "secret": ""}
        return role

    def remove_player(self, websocket):
        if websocket in self.players:
            del self.players[websocket]

    def set_ready(self, websocket, secret_number):
        if websocket in self.players:
            self.players[websocket]["ready"] = True
            self.players[websocket]["secret"] = secret_number

    def both_ready(self):
        return len(self.players) == 2 and all(p["ready"] for p in self.players.values())

    def both_online(self):
        return len(self.players) == 2

    def get_opponent(self, websocket):
        for ws in self.players:
            if ws != websocket:
                return ws
        return None
