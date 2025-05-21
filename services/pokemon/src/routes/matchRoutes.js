// src/routes/matchRoutes.js
const express = require('express');
const Match = require('../models/Match');

const router = express.Router();

// Obtener estadísticas generales (leaderboard)
router.get('/leaderboard', async (req, res) => {
  try {
    // Obtener partidas completadas
    const completedMatches = await Match.find({ status: 'completed' });
    
    // Calcular estadísticas por jugador
    const playerStats = {};
    
    completedMatches.forEach(match => {
      // Procesar al ganador
      if (match.winner) {
        if (!playerStats[match.winner]) {
          playerStats[match.winner] = { wins: 0, losses: 0, matches: 0 };
        }
        playerStats[match.winner].wins += 1;
      }
      
      // Procesar a todos los jugadores de la partida
      match.players.forEach(player => {
        const username = player.username;
        
        if (!playerStats[username]) {
          playerStats[username] = { wins: 0, losses: 0, matches: 0 };
        }
        
        // Si no es el ganador y la partida tiene un ganador, es una derrota
        if (match.winner && username !== match.winner) {
          playerStats[username].losses += 1;
        }
        
        // Incrementar el total de partidas jugadas
        if (!playerStats[username].matches) {
          playerStats[username].matches = 0;
        }
        playerStats[username].matches += 1;
      });    });
    
    // Convertir a array para ordenar
    const leaderboard = Object.entries(playerStats).map(([username, stats]) => ({
      username,
      ...stats,
      winRate: stats.matches > 0 ? (stats.wins / stats.matches * 100).toFixed(2) + '%' : '0%'
    }));
    
    // Ordenar por número de victorias (descendente) y luego por win rate
    leaderboard.sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins; // Primero por victorias
      }
      // Si tienen las mismas victorias, ordenar por porcentaje
      const aRate = parseFloat(a.winRate);
      const bRate = parseFloat(b.winRate);
      return bRate - aRate;
    });
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
