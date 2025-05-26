// script.js

class Connect4Game {
    constructor() {
        this.ws = null;
        this.username = '';
        this.roomId = '';
        this.playerNumber = 0;
        this.board = Array(6).fill().map(() => Array(7).fill(0));
        this.currentTurn = 1;
        this.gameStatus = 'waiting';

        this.initializeElements();
        this.setupEventListeners();
        this.createBoard();
    }

    initializeElements() {
        // Pantallas
        this.loginScreen = document.getElementById('login-screen');
        this.gameScreen = document.getElementById('game-screen');
        
        // Elementos del formulario
        this.usernameInput = document.getElementById('username');
        this.createRoomBtn = document.getElementById('create-room');
        this.roomCodeInput = document.getElementById('room-code');
        this.joinRoomBtn = document.getElementById('join-room');
        
        // Elementos del juego
        this.roomIdDisplay = document.getElementById('room-id');
        this.currentTurnDisplay = document.getElementById('current-turn');
        this.statusMessage = document.getElementById('status-message');
        this.newGameBtn = document.getElementById('new-game');
        this.boardElement = document.getElementById('board');
    }

    setupEventListeners() {
        if (this.createRoomBtn) {
            this.createRoomBtn.addEventListener('click', this.handleCreateRoom.bind(this));
        }
        if (this.joinRoomBtn) {
            this.joinRoomBtn.addEventListener('click', this.handleJoinRoom.bind(this));
        }
        if (this.newGameBtn) {
            this.newGameBtn.addEventListener('click', this.handleNewGame.bind(this));
        }
    }

    createBoard() {
        this.boardElement.innerHTML = '';
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => this.handleCellClick(col));
                this.boardElement.appendChild(cell);
            }
        }
    }

    getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        return `${protocol}//${host}`;
    }

    connectWebSocket() {
        if (this.ws) {
            this.ws.close();
        }

        try {
            const wsUrl = this.getWebSocketUrl();
            console.log('Conectando a WebSocket:', wsUrl);
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket conectado');
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };

            this.ws.onerror = (error) => {
                console.error('Error de WebSocket:', error);
                this.showStatus('Error de conexión', 'error');
            };

            this.ws.onclose = () => {
                console.log('WebSocket desconectado');
                this.showStatus('Conexión perdida. Reconectando...', 'error');
                setTimeout(() => this.connectWebSocket(), 3000);
            };
        } catch (error) {
            console.error('Error al conectar WebSocket:', error);
            this.showStatus('Error de conexión', 'error');
        }
    }
    
    handleCreateRoom() {
        console.log('Intentando crear sala...');
        this.username = this.usernameInput.value.trim();
        if (!this.username) {
            this.showStatus('Por favor, ingresa un nombre de usuario', 'error');
            return;
        }

        // Desactivar el botón mientras se crea la sala
        this.createRoomBtn.disabled = true;
        this.createRoomBtn.textContent = 'Creando sala...';

        this.connectWebSocket();
        this.ws.onopen = () => {
            console.log('WebSocket conectado, enviando petición para crear sala...');
            this.ws.send(JSON.stringify({
                type: 'create_room',
                username: this.username
            }));
        };

        // Timeout de seguridad para reactivar el botón
        setTimeout(() => {
            this.createRoomBtn.disabled = false;
            this.createRoomBtn.textContent = 'Crear Sala';
        }, 5000);
    }

    handleJoinRoom() {
        this.username = this.usernameInput.value.trim();
        const roomId = this.roomCodeInput.value.trim();

        if (!this.username || !roomId) {
            this.showStatus('Por favor, ingresa un nombre de usuario y código de sala', 'error');
            return;
        }

        this.connectWebSocket();
        this.ws.onopen = () => {
            this.roomId = roomId;
            this.ws.send(JSON.stringify({
                type: 'join',
                username: this.username,
                roomId: roomId
            }));
        };
    }

    handleWebSocketMessage(data) {
        console.log('Mensaje recibido:', data);            switch (data.type) {
                case 'room_created':
                    this.roomId = data.roomId;
                    this.playerNumber = 1;
                    this.board = Array(6).fill().map(() => Array(7).fill(0)); // Reiniciar tablero
                    this.showGameScreen();
                    this.updateGameState(data.gameState);
                    this.showStatus('Esperando al oponente...', 'info');
                    console.log('Sala creada:', {
                        roomId: this.roomId,
                        playerNumber: this.playerNumber,
                        board: this.board
                    });
                    break;

            case 'game_start':
                console.log('Iniciando juego:', data.gameState);
                this.showGameScreen();
                this.playerNumber = this.playerNumber || 2; // Si no está establecido, es el jugador 2
                this.board = Array(6).fill().map(() => Array(7).fill(0)); // Reiniciar tablero
                this.updateGameState(data.gameState);
                this.showStatus('¡El juego ha comenzado!', 'info');
                this.newGameBtn.classList.add('hidden');
                console.log('Estado del juego después de iniciar:', {
                    playerNumber: this.playerNumber,
                    currentTurn: this.currentTurn,
                    gameStatus: this.gameStatus,
                    board: JSON.stringify(this.board)
                });
                break;

            case 'move':
                console.log('Movimiento recibido:', data.gameState);
                if (data.gameState) {
                    this.updateGameState(data.gameState);
                    if (data.gameState.currentTurn === this.playerNumber) {
                        this.showStatus('Tu turno', 'info');
                    } else {
                        this.showStatus('Turno del oponente', 'info');
                    }
                }
                break;

            case 'game_over':
                console.log('Juego terminado:', data);
                this.updateGameState(data.gameState);
                if (data.isDraw) {
                    this.showStatus('¡Empate!', 'info');
                } else if (data.winner === this.playerNumber) {
                    this.showStatus('¡Has ganado!', 'info');
                } else {
                    this.showStatus('¡Has perdido!', 'info');
                }
                this.newGameBtn.classList.remove('hidden');
                this.gameStatus = 'finished';
                break;

            case 'error':
                console.error('Error recibido:', data.message);
                this.showStatus(data.message, 'error');
                break;

            default:
                console.warn('Tipo de mensaje no manejado:', data.type);
        }
    }

    handleCellClick(column) {
        console.log('Click en columna:', {
            column,
            gameStatus: this.gameStatus,
            currentTurn: this.currentTurn,
            playerNumber: this.playerNumber
        });

        if (this.gameStatus !== 'playing') {
            this.showStatus('El juego no está activo', 'error');
            return;
        }

        if (this.currentTurn !== this.playerNumber) {
            this.showStatus(`No es tu turno. (Turno: ${this.currentTurn}, Tú eres: ${this.playerNumber})`, 'error');
            return;
        }

        // Validar que la columna no esté llena
        if (this.board[0][column] !== 0) {
            this.showStatus('Columna llena', 'error');
            return;
        }

        console.log(`Enviando movimiento: Jugador ${this.playerNumber}, Columna ${column}`);
        this.ws.send(JSON.stringify({
            type: 'move',
            column: column,
            player: this.playerNumber
        }));
    }

    handleNewGame() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('Solicitando nuevo juego');
            this.ws.send(JSON.stringify({
                type: 'new_game'
            }));

            this.showStatus('Iniciando nueva partida...', 'info');
            this.newGameBtn.classList.add('hidden');
        } else {
            console.error('WebSocket no está conectado');
            this.showStatus('Error de conexión. Recargando...', 'error');
            setTimeout(() => window.location.reload(), 2000);
        }
    }

    updateGameState(gameState) {
        if (!gameState) {
            console.warn('Estado de juego vacío');
            return;
        }

        const previousTurn = this.currentTurn;
        const previousBoard = JSON.stringify(this.board);
        console.log('Actualizando estado del juego:', {
            previousState: {
                board: previousBoard,
                turn: previousTurn,
                status: this.gameStatus,
                playerNumber: this.playerNumber
            },
            newState: gameState
        });
        
        if (Array.isArray(gameState.board)) {
            // Copia profunda del tablero
            this.board = gameState.board.map(row => [...row]);
            console.log('Nuevo estado del tablero:', JSON.stringify(this.board));
        }
        
        this.currentTurn = parseInt(gameState.currentTurn);
        this.gameStatus = gameState.status;
        
        this.updateBoard();
        this.updateTurnDisplay();

        if (gameState.status === 'playing') {
            this.newGameBtn.classList.add('hidden');
        }

        // Verificar si hay cambios en el tablero
        const currentBoard = JSON.stringify(this.board);
        console.log('Cambios en el tablero:', {
            prevBoard: previousBoard,
            newBoard: currentBoard,
            hasChanged: previousBoard !== currentBoard
        });

        // Log del estado después de la actualización
        console.log('Estado actualizado:', {
            currentTurn: this.currentTurn,
            gameStatus: this.gameStatus,
            playerNumber: this.playerNumber,
            isTurnChanged: previousTurn !== this.currentTurn,
            board: this.board
        });
    }

    updateBoard() {
        console.log('Actualizando tablero:', JSON.stringify(this.board));
        const cells = this.boardElement.getElementsByClassName('cell');
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const index = row * 7 + col;
                const cell = cells[index];
                const value = this.board[row][col];
                
                // Primero eliminar todas las clases de jugador
                cell.classList.remove('player1', 'player2');
                
                // Luego agregar la clase correspondiente si hay una ficha
                if (value === 1) {
                    cell.classList.add('player1');
                } else if (value === 2) {
                    cell.classList.add('player2');
                }
            }
        }
        
        // Log del estado del tablero después de la actualización
        const boardState = Array.from(cells).map(cell => {
            if (cell.classList.contains('player1')) return 1;
            if (cell.classList.contains('player2')) return 2;
            return 0;
        });
        console.log('Estado del tablero después de actualizar:', JSON.stringify(boardState));
    }

    updateTurnDisplay() {
        if (this.gameStatus === 'playing') {
            if (this.currentTurn === this.playerNumber) {
                this.currentTurnDisplay.textContent = 'Tu turno';
                this.currentTurnDisplay.className = 'turn-active';
            } else {
                this.currentTurnDisplay.textContent = 'Turno del oponente';
                this.currentTurnDisplay.className = '';
            }
        } else if (this.gameStatus === 'finished') {
            this.currentTurnDisplay.textContent = 'Juego terminado';
            this.currentTurnDisplay.className = '';
        } else {
            this.currentTurnDisplay.textContent = 'Esperando...';
            this.currentTurnDisplay.className = '';
        }
    }

    showGameScreen() {
        this.loginScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.roomIdDisplay.textContent = this.roomId;
    }

    showStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = type;
    }
}

// Inicializar el juego cuando se carga la página
window.addEventListener('load', () => {
    new Connect4Game();
});