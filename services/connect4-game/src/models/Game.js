const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    player1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    },
    player2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    },
    winner: {
        type: Number,
        enum: [1, 2, null],
        default: null
    },
    isDraw: {
        type: Boolean,
        default: false
    },
    moves: [{
        player: Number,
        column: Number,
        row: Number,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['waiting', 'playing', 'finished'],
        default: 'waiting'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Game', gameSchema);