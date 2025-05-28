import logging
from flask import Flask, render_template
import requests

logging.basicConfig(level=logging.INFO)
app = Flask(__name__)

# Route to serve the index.html
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/leaderboardBalatro')
def leaderboard():
# Route to fetch the leaderboard from the backend')
    logging.info("Fetching leaderboard from backend...")
    # Hacer la petición al backend
    headers = {'Accept': 'application/json',}
    response = requests.get("http://host.docker.internal:8088/leaderboard", headers=headers)
    logging.info(f"Response from backend: {response.status_code} - {response.text}")
    # Verificar si la respuesta es exitosa
    if response.status_code == 200:
        top_players = response.json()  # Esto será una lista de diccionarios
    else:
        top_players = []  # o manejar el error como prefieras
    logging.info(f"Top players: {top_players}")
    return render_template('leader_board.html', top_players=top_players)




if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)


