from flask import Flask, render_template

from services.score_handler import  score_hand

app = Flask(__name__)

# Route to serve the index.html
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)


