ROWS = 6
COLS = 7

class Connect4Game:
    def __init__(self):
        self.board = [[0]*COLS for _ in range(ROWS)]
        self.current_player = 1
        self.winner = None

    def reset(self):
        self.board = [[0]*COLS for _ in range(ROWS)]
        self.current_player = 1
        self.winner = None

    def play_move(self, col):
        if self.winner is not None:
            return False, "El juego ya terminó"

        if not (0 <= col < COLS):
            return False, "Columna inválida"

        row = None
        for r in reversed(range(ROWS)):
            if self.board[r][col] == 0:
                row = r
                break

        if row is None:
            return False, "Columna llena"

        self.board[row][col] = self.current_player

        if self.check_winner(row, col):
            self.winner = self.current_player
            return True, "Ganador"

        if all(self.board[0][c] != 0 for c in range(COLS)):
            self.winner = 0
            return True, "Empate"

        self.current_player = 2 if self.current_player == 1 else 1
        return True, "Turno siguiente"

    def check_winner(self, row, col):
        def count(dx, dy):
            total = 0
            r, c = row + dy, col + dx
            while 0 <= r < ROWS and 0 <= c < COLS and self.board[r][c] == self.current_player:
                total += 1
                r += dy
                c += dx
            return total

        directions = [(1,0), (0,1), (1,1), (1,-1)]
        for dx, dy in directions:
            if 1 + count(dx, dy) + count(-dx, -dy) >= 4:
                return True
        return False
