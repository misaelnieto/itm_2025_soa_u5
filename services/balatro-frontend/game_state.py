from services.deck_handler import PlayerDeckHandler


class GameState():
    def __init__(self):
        self.p1_score = 0
        self.p2_score = 0
        self.p1_last_score = 0
        self.p2_last_score = 0
        self.current_player = 1
        self.current_turn = 0
        self.p1_hand_handler = PlayerDeckHandler()
        self.p2_hand_handler = PlayerDeckHandler()