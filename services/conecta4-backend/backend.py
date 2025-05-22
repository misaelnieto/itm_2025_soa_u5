from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from conecta4_logic import Connect4Game

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

game = Connect4Game()

class MoveRequest(BaseModel):
    column: int

@app.get("/api/backend-conecta4/state")
def get_state():
    return {
        "board": game.board,
        "current_player": game.current_player,
        "winner": game.winner,
    }

@app.post("/api/backend-conecta4/move")
def make_move(move: MoveRequest):
    success, message = game.play_move(move.column)
    return {
        "success": success,
        "message": message,
        "board": game.board,
        "current_player": game.current_player,
        "winner": game.winner,
    }

@app.post("/api/backend-conecta4/reset")
def reset_game():
    game.reset()
    return {"message": "Juego reiniciado"}
