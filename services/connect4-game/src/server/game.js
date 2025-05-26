// src/server/game.js

class GameLogic {
    constructor() {
        this.board = Array(6).fill().map(() => Array(7).fill(0));
        this.currentPlayer = 1;
    }

    makeMove(column) {
        // Encontrar la primera posición disponible en la columna
        for (let row = 5; row >= 0; row--) {
            if (this.board[row][column] === 0) {
                this.board[row][column] = this.currentPlayer;
                const hasWon = this.checkWin(row, column);
                const result = {
                    row,
                    column,
                    player: this.currentPlayer,
                    hasWon,
                    isDraw: !hasWon && this.checkDraw()
                };
                this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                return result;
            }
        }
        return null;
    }

    checkWin(row, col) {
        const directions = [
            [[0,1], [0,-1]],  // horizontal
            [[1,0], [-1,0]],  // vertical
            [[1,1], [-1,-1]], // diagonal principal
            [[1,-1], [-1,1]]  // diagonal secundaria
        ];
        
        const currentPlayer = this.board[row][col];
        
        for (const [dir1, dir2] of directions) {
            let count = 1;
            count += this.countInDirection(row, col, dir1[0], dir1[1], currentPlayer);
            count += this.countInDirection(row, col, dir2[0], dir2[1], currentPlayer);
            if (count >= 4) return true;
        }
        
        return false;
    }

    countInDirection(row, col, rowDir, colDir, player) {
        let count = 0;
        let currentRow = row + rowDir;
        let currentCol = col + colDir;
        
        while (
            currentRow >= 0 && currentRow < 6 &&
            currentCol >= 0 && currentCol < 7 &&
            this.board[currentRow][currentCol] === player
        ) {
            count++;
            currentRow += rowDir;
            currentCol += colDir;
        }
        
        return count;
    }

    checkDraw() {
        return this.board[0].every(cell => cell !== 0);
    }

    getBoard() {
        return this.board;
    }

    getCurrentPlayer() {
        return this.currentPlayer;
    }

    reset() {
        this.board = Array(6).fill().map(() => Array(7).fill(0));
        this.currentPlayer = 1;
    }
}

module.exports = GameLogic;