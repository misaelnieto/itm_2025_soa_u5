from flask import Flask, render_template
import requests

from services.score_handler import  score_hand

app = Flask(__name__)

# Route to serve the index.html
@app.route('/')
def index():
    return render_template('index.html')






@app.route('/leaderboardBalatro')
def leaderboard():
    # Hacer la petición al backend
    response = requests.get("https://itm-soa.io/juegos/balatro-backend/leaderboard")

    if response.status_code == 200:
        top_players = response.json()  # Esto será una lista de diccionarios
    else:
        top_players = []  # o manejar el error como prefieras

    return render_template('leader_board.html', top_players=top_players)




if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)


