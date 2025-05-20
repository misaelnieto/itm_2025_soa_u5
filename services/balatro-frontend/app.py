from flask import Flask, jsonify, request, send_from_directory, render_template
import requests

from game_state import GameState
from services.score_handler import  score_hand

app = Flask(__name__)

# Route to serve the index.html
@app.route('/')
def index():
    try:
        response = requests.get('http://balatro-backend:8080/game_state')
        response.raise_for_status()
        game_state_data = response.json()  # assuming the backend returns JSON
        game_state = GameState.from_dict(game_state_data)  # You must define this method
    except Exception as e:
        return f"Error retrieving game state: {e}", 500

    print(game_state)
    return render_template('index.html', game_state=game_state, player_hand=game_state.p1_hand_handler.hand)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)


