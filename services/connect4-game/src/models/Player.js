const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    isOnline: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    gamesPlayed: {
        type: Number,
        default: 0
    },
    wins: {
        type: Number,
        default: 0
    },
    losses: {
        type: Number,
        default: 0
    },
    draws: {
        type: Number,
        default: 0
    },
    lastPlayed: {
        type: Date,
        default: Date.now
    }
});

playerSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;