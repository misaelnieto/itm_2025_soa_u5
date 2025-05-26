class Room {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = [];
        this.gameState = null; // This will hold the current state of the game
    }

    addPlayer(player) {
        if (this.players.length < 2) {
            this.players.push(player);
            return true;
        }
        return false; // Room is full
    }

    removePlayer(playerId) {
        this.players = this.players.filter(player => player.id !== playerId);
    }

    startGame() {
        if (this.players.length === 2) {
            this.gameState = this.initializeGame();
        }
    }

    initializeGame() {
        // Initialize the game state (e.g., create a board)
        return {
            board: Array(6).fill(null).map(() => Array(7).fill(null)), // 6 rows, 7 columns
            currentPlayer: this.players[0],
            winner: null
        };
    }

    // Additional methods for game logic can be added here
}

module.exports = Room;