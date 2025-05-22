from flask import Flask, jsonify, request, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room
from game_state import GameState
from services.score_handler import score_hand
import uuid
import eventlet
from flask_cors import CORS
import logging


eventlet.monkey_patch()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.config['SECRET_KEY'] = 'secret'
socketio = SocketIO(app, 
    path='/juegos/balatro-backend/socket.io',
    cors_allowed_origins="*",
    async_mode='eventlet',
    logger=True,
    engineio_logger=True,
    always_connect=True)
game_state = GameState()


waiting_player = None
sessions = {}
game_states = {}
logging.basicConfig(level=logging.INFO)

@socketio.on('connect')
def handle_connect(auth):
    
	
    global waiting_player
    
    logging.info("Connect")
    print("Si recibio 'connect' el socket")
    #sid significa session id
    sid = request.sid


    if(waiting_player is None):
        waiting_player = sid
        print(f"{sid} is waiting someone to play with")

        emit('message', {'message': 'We are matching you with someone else'})
    
    else:
        print('There is a second player')
        #Hay un jugador esperando, y como se esta conectando un nuevo jugador se debe de crear una sala para ambos
        room_id = str(uuid.uuid4())
        socketio.server.enter_room(waiting_player, room_id)
        socketio.server.enter_room(sid, room_id)

        #Guardar la sesion
        sessions[waiting_player] = room_id
        sessions[sid] = room_id

        # Crear un estado independiente por sala
        state = GameState()
        state.p1_sid = waiting_player
        state.p2_sid = sid


        # Guardar el estado 
        game_states[room_id] = state

        # Imprimir en el backend que se creo una nueva sala
        print(f"{waiting_player} and {sid} were matched{room_id}")

        # Emitir el evento
        emit('matched', { 'room': room_id, 'player_hand':state.p1_hand_handler.hand }, to=waiting_player)
        emit('matched', { 'room': room_id, 'player_hand':state.p2_hand_handler.hand }, to=sid)

        waiting_player = None


@app.route('/play_hand', methods=['POST'])
def play_hand():

    data = request.get_json()
    sid = data.get('sid')   # Obtener el sid por el fetch
    cards = data.get('cards', [])


    # Obtener el room_id
    room_id = sessions.get(sid)

    # Obtener el estado del room_id
    game_state = game_states.get(room_id)


    if sid == game_state.p1_sid:
        # Es el jugador 1
        
        if game_state.current_player != 1:
            # No es turno del jugador 1
            return jsonify({"message":"It's not your turn"})


        score, hand_played, valid_cards = score_hand(cards)
        game_state.p1_last_score = score
        game_state.p1_score  = game_state.p1_score + score
        for i in range(len(cards)):
            game_state.p1_hand_handler.remove_from_hand(cards[i])

        # Si el jugador 1 ya hizo su jugada, es turno del jugador 2
        socketio.emit('update_turn', {'current_turn':2}, room = room_id)
        game_state.current_player = 2
        game_state.p1_last_hand = hand_played.name
        return jsonify({"received": cards,"score": score,"hand_played": hand_played.name, "valid_cards": valid_cards})


    elif sid == game_state.p2_sid:
        #Es el jugador 2

        if game_state.current_player !=2:
            # No es turno del jugador 2
            return jsonify({"message":"It's not your turn"})

        score, hand_played, valid_cards = score_hand(cards)
        game_state.p2_last_score = score  
        game_state.p2_score  = game_state.p2_score + score
        game_state.current_turn = game_state.current_turn + 1 # Hay un turno mas

        if game_state.current_turn >= 3:
            # Se acabo el juego

            # Verificar quien gano
            if game_state.p2_score > game_state.p1_score:
                socketio.emit('game_over', { 'score': game_state.p1_score, 'win':0 }, to=game_state.p1_sid)
                socketio.emit('game_over', { 'score': game_state.p2_score, 'win':1 }, to=game_state.p2_sid)
            
            elif game_state.p1_score > game_state.p2_score:
                socketio.emit('game_over', { 'score': game_state.p1_score, 'win':1 }, to=game_state.p1_sid)
                socketio.emit('game_over', { 'score': game_state.p2_score, 'win':0 }, to=game_state.p2_sid)

            else:
                socketio.emit('game_over', { 'score': game_state.p1_score, 'win':2 }, to=game_state.p1_sid)
                socketio.emit('game_over', { 'score': game_state.p2_score, 'win':2 }, to=game_state.p2_sid)

            sessions.pop(game_state.p1_sid, None)
            sessions.pop(game_state.p2_sid, None)
            game_states.pop(room_id, None)

            leave_room(room_id, sid=game_state.p1_sid)
            leave_room(room_id, sid=game_state.p2_sid)


            return jsonify({"finish":1})
        
        else:
            # El juego no se ha acabado
            for i in range(len(cards)):
                game_state.p2_hand_handler.remove_from_hand(cards[i])

            # Si el jugador 2 ya hizo su jugada, es turno del jugador 1
            socketio.emit('update_turn', {'current_turn':1}, room = room_id)
            game_state.current_player = 1
            game_state.p2_last_hand = hand_played.name
            return jsonify({"received": cards,"score": score,"hand_played": hand_played.name, "valid_cards": valid_cards})
        



@app.route('/discard', methods=['POST'])
def discard_cards():
    data = request.get_json()
    sid = data.get('sid') # Obtener el id del jugador
    cards = data.get('cards', [])
    logging.info('llego almetodo discard de api')
    logging.info(f'cartas: {cards}')


    room_id = sessions.get(sid)
    game_state = game_states.get(room_id)


    if sid == game_state.p1_sid:
        # El jugador 1 mando a llamar esta funcion
        handler = game_state.p1_hand_handler
    elif sid == game_state.p2_sid:
        # El jugador 2 mando a llamar esta funcion
        handler = game_state.p2_hand_handler

    # Eliminar cartas de la mano del jugador
    for card in cards:
        handler.remove_from_hand(card)

    return jsonify({"received": cards})



@app.route('/game_state')
def get_game_info():

    sid = request.args.get('sid')
    room_id = sessions.get(sid)
    game_state = game_states.get(room_id)


    print(f"{sid}, {room_id}, {game_state}")

    if sid == game_state.p1_sid:
        hand = game_state.p1_hand_handler.hand
        total = game_state.p1_score
        last_score = game_state.p1_last_score
        last_hand = game_state.p1_last_hand
        last_opponent_score = game_state.p2_last_score
    
    elif sid == game_state.p2_sid:
        hand = game_state.p2_hand_handler.hand
        total = game_state.p2_score
        last_score = game_state.p2_last_score
        last_hand = game_state.p2_last_hand
        last_opponent_score = game_state.p1_last_score

    return jsonify({
        "hand": hand, 
        "total":total,
        "last_score":last_score,
        "last_hand": last_hand,
        "last_opponent_score": last_opponent_score
    })




@app.route('/draw_cards')
def draw_cards():

    sid = request.args.get('sid') # Obtener el sid del jugador

    room_id = sessions.get(sid) # Obtener la sala del sid
    game_state = game_states.get(room_id) # Obtener el estado de la sala

    cards = []

    if sid == game_state.p1_sid:
        for i in range(8-len(game_state.p1_hand_handler.hand)):
            cards.append(game_state.p1_hand_handler.draw_card())
    
    elif sid == game_state.p2_sid:
        for i in range(8-len(game_state.p2_hand_handler.hand)):
            cards.append(game_state.p2_hand_handler.draw_card())
    
    return jsonify({"drawn_cards": cards})


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=80, debug=True, allow_unsafe_werkzeug=True)
