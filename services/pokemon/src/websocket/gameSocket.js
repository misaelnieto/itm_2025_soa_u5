// src/websocket/gameSocket.js
const WebSocket = require("ws");
const Match = require("../models/Match");
const Pokemon = require("../models/Pokemon");

let waitingPlayer = null;

function initGameSocket(server) {
  const wss = new WebSocket.Server({ server });
  console.log("🧩 WebSocket Server iniciado");

  wss.on("connection", (ws) => {
    console.log("🔌 Un jugador se conectó");

    // Asociar usuario con WebSocket
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        console.log(data)
        if (data.type === "join") {
          // Store the player's information
          ws.username = data.username;
          ws.pokemonId = data.pokemonId;

          // Clear any previous battle state
          ws.roomId = null;

          // If this player had an opponent, clean up that reference
          if (ws.opponent) {
            if (ws.opponent.readyState === WebSocket.OPEN) {
              ws.opponent.send(JSON.stringify({
                type: "opponentDisconnected",
                message: "Tu oponente ha salido de la partida."
              }));
            }
            ws.opponent.opponent = null;
            ws.opponent = null;
          }

          // Verificar que el pokemonId existe
          if (ws.pokemonId) {
            const pokemon = await Pokemon.findById(ws.pokemonId);
            if (!pokemon) {
              ws.send(JSON.stringify({
                type: "error",
                message: "El Pokémon seleccionado no existe"
              }));
              return;
            }
            ws.pokemon = pokemon;
          }

          // // If we're reconnecting to a specific room
          // if (data.roomId) {
          //   ws.roomId = data.roomId;
          //   console.log(`🔄 Jugador ${ws.username} intenta reconectar a la sala ${data.roomId}`);

          //   // Try to find the match
          //   const match = await Match.findOne({ roomId: data.roomId });
          //   if (match && match.status === 'active') {
          //     // Handle reconnection to existing match
          //     console.log(`✅ Reconexión exitosa a partida ${data.roomId}`);
          //   } else {
          //     // Match not found or already ended
          //     console.log(`❌ No se encontró la partida ${data.roomId} o ya terminó`);
          //     ws.send(JSON.stringify({
          //       type: "error",
          //       message: "La partida ya no existe o ha terminado"
          //     }));
          //     ws.roomId = null;
          //   }
          // }

          // Start matchmaking if we're not reconnecting to a specific room
          if (!ws.roomId) {
            handleMatchmaking(ws, wss);
          }
        } else if (data.type === "move") {
          await handlePlayerMove(ws, data);
        } else if (data.type === "selectPokemon") {
          // Manejar selección de Pokémon
          await handlePokemonSelection(ws, data);
        }
      } catch (error) {
        console.error("Error al procesar mensaje:", error);
        ws.send(JSON.stringify({
          type: "error",
          message: "Error al procesar el mensaje"
        }));
      }
    });

    ws.on("close", async () => {

      console.log("❌ Jugador desconectado");

      // Si el jugador estaba en una partida, marcarla como abandonada
      if (ws.roomId && ws.opponent) {
        try {
          await updateMatchOnDisconnect(ws);
        } catch (error) {
          console.error("Error al actualizar partida tras desconexión:", error);
        }
      }

      // Limpieza de jugador esperando
      if (waitingPlayer === ws) {
        waitingPlayer = null;
      }
    });
  });
}

function handleMatchmaking(ws, wss) {
  // If the player is reconnecting, clean up any previous state
  if (ws.roomId || ws.opponent) {
    console.log(`🔄 Jugador ${ws.username} está reconectando, limpiando estado anterior`);

    // Clean up opponent reference if it exists
    if (ws.opponent) {
      // Notify the opponent that we're leaving (if they're still connected)
      if (ws.opponent.readyState === WebSocket.OPEN) {
        ws.opponent.send(JSON.stringify({
          type: "opponentDisconnected",
          message: "Tu oponente ha iniciado una nueva partida."
        }));
      }

      // Remove the references between players
      ws.opponent.opponent = null;
      ws.opponent = null;
    }

    // Reset room ID
    ws.roomId = null;
  }

  // Clean up if this player was the waiting player
  if (waitingPlayer === ws) {
    waitingPlayer = null;
  }

  if (waitingPlayer) {
    const opponent = waitingPlayer;
    waitingPlayer = null;

    // Verificar que ambos jugadores tienen un Pokémon seleccionado
    if (!ws.pokemon || !opponent.pokemon) {
      const errorMessage = JSON.stringify({
        type: "error",
        message: "Ambos jugadores deben seleccionar un Pokémon"
      });

      if (!ws.pokemon) ws.send(errorMessage);
      if (!opponent.pokemon) opponent.send(errorMessage);

      // Devolver el jugador que tiene Pokémon a la lista de espera
      if (ws.pokemon) {
        waitingPlayer = ws;
        ws.send(JSON.stringify({ type: "waiting", message: "Esperando otro jugador..." }));
      } else if (opponent.pokemon) {
        waitingPlayer = opponent;
        opponent.send(JSON.stringify({ type: "waiting", message: "Esperando otro jugador..." }));
      }

      return;
    }

    const roomId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    ws.roomId = roomId;
    opponent.roomId = roomId;

    ws.opponent = opponent;
    opponent.opponent = ws;

    // Crear un nuevo objeto de partida en la base de datos
    createMatch(roomId, ws, opponent);

    // Enviar mensaje de inicio a ambos con información de los Pokémon
    const startMessage = JSON.stringify({
      type: "start",
      message: "¡Combate iniciado!",
      roomId,
      players: [
        { username: ws.username, pokemon: ws.pokemon },
        { username: opponent.username, pokemon: opponent.pokemon }
      ],
      yourTurn: true,
    });

    const opponentStartMessage = JSON.stringify({
      type: "start",
      message: "¡Combate iniciado!",
      roomId,
      players: [
        { username: opponent.username, pokemon: opponent.pokemon },
        { username: ws.username, pokemon: ws.pokemon }
      ],
      yourTurn: false,
    });

    ws.send(startMessage);
    opponent.send(opponentStartMessage);
  } else {
    waitingPlayer = ws;
    ws.send(JSON.stringify({ type: "waiting", message: "Esperando otro jugador..." }));
  }
}

async function handlePlayerMove(ws, data) {
  if (!ws.opponent || !ws.roomId) return;

  try {
    // Registrar el movimiento en la base de datos
    await recordMove(ws.roomId, ws.username, data.move);
    let match = await Match.findOne({ roomId: ws.roomId });

    // Calcular daño y efectos del movimiento
    const result = calculateMoveResult(ws.pokemon, ws.opponent.pokemon, data.move, match.players);    // Actualizar la salud actual del Pokémon del oponente
    const opponentPlayerIndex = match.players.findIndex(p => p.username === ws.opponent.username);
    if (opponentPlayerIndex !== -1) {
      // Calcular el nuevo HP y actualizarlo en la base de datos
      const currentHp = match.players[opponentPlayerIndex].pokemon[0].currentHp;
      const newHp = Math.max(0, currentHp - result.damage);
      await updatePokemonHp(ws.roomId, ws.opponent.username, newHp);
    }

    // Obtener la partida actualizada
    match = await Match.findOne({ roomId: ws.roomId });
    const updatedOpponentHp = match.players[opponentPlayerIndex].pokemon[0].currentHp;    // Mensaje para el jugador que hizo el movimiento
    const moveResultMessage = {
      type: "moveResult",
      move: data.move,
      result: result,
      yourTurn: false,
      opponentCurrentHp: updatedOpponentHp // Incluimos la salud actualizada
    };

    // Mensaje para el oponente
    const opponentMoveMessage = {
      type: "opponentMove",
      move: data.move,
      result: result,
      yourTurn: true,
      yourCurrentHp: updatedOpponentHp // Incluimos la salud actualizada
    };

    // Enviar mensajes a ambos jugadores
    ws.send(JSON.stringify(moveResultMessage));
    ws.opponent.send(JSON.stringify(opponentMoveMessage));

    // Verificar si la batalla ha terminado
    if (updatedOpponentHp <= 0) {
      // Usamos el username del jugador que hizo el movimiento ganador
      const winnerUsername = ws.username;
      await endBattle(ws.roomId, winnerUsername);

      // Enviar mensaje de fin de batalla a ambos jugadores
      const endMessage = JSON.stringify({
        type: "battleEnd",
        winner: winnerUsername,
        pokemonWinner: ws.pokemon.name, // Incluimos el nombre del Pokémon ganador por si se necesita
        message: `¡${winnerUsername} ha ganado la batalla con ${ws.pokemon.name}!`,
        status: 'completed'
      });

      ws.send(endMessage);
      ws.opponent.send(endMessage);
    }
  } catch (error) {
    console.error("Error al procesar movimiento:", error);
    ws.send(JSON.stringify({
      type: "error",
      message: "Error al procesar el movimiento"
    }));
  }
}

async function handlePokemonSelection(ws, data) {
  try {
    const pokemonId = data.pokemonId;

    // Buscar el Pokémon en la base de datos
    const pokemon = await Pokemon.findById(pokemonId);

    if (!pokemon) {
      ws.send(JSON.stringify({
        type: "error",
        message: "El Pokémon seleccionado no existe"
      }));
      return;
    }

    // Asignar el Pokémon al jugador
    ws.pokemon = pokemon;
    ws.pokemonId = pokemon._id;

    // Confirmar la selección
    ws.send(JSON.stringify({
      type: "pokemonSelected",
      pokemon: pokemon,
      message: `Has seleccionado a ${pokemon.name}`
    }));
  } catch (error) {
    console.error("Error al seleccionar Pokémon:", error);
    ws.send(JSON.stringify({
      type: "error",
      message: "Error al seleccionar el Pokémon"
    }));
  }
}

module.exports = { initGameSocket };

// Funciones auxiliares para la lógica del juego
async function createMatch(roomId, player1, player2) {
  try {
    // Preparar los datos de los jugadores con sus Pokemon
    const players = [
      {
        username: player1.username,
        pokemon: [
          {
            pokemonId: player1.pokemon._id,
            currentHp: player1.pokemon.stats.hp,
            moves: player1.pokemon.moves.map((move, index) => ({
              moveIndex: index,
              ppLeft: move.pp
            }))
          }
        ]
      },
      {
        username: player2.username,
        pokemon: [
          {
            pokemonId: player2.pokemon._id,
            currentHp: player2.pokemon.stats.hp,
            moves: player2.pokemon.moves.map((move, index) => ({
              moveIndex: index,
              ppLeft: move.pp
            }))
          }
        ]
      }
    ];

    // Crear un nuevo objeto de partida
    const match = new Match({
      roomId,
      players,
      status: 'active',
      currentTurn: player1.username, // El primer jugador comienza
      startedAt: new Date()
    });

    // Guardar en la base de datos
    await match.save();
    console.log(`💾 Partida creada con ID: ${match._id}`);

    return match;
  } catch (error) {
    console.error("Error al crear partida:", error);
    throw error;
  }
}

async function recordMove(roomId, username, moveName) {
  try {
    const match = await Match.findOne({ roomId });
    if (!match) throw new Error("Partida no encontrada");

    // Buscar el pokémon del jugador
    const playerIndex = match.players.findIndex(p => p.username === username);
    if (playerIndex === -1) throw new Error("Jugador no encontrado en la partida");

    // Obtener información completa del Pokémon
    const playerPokemon = await Pokemon.findById(match.players[playerIndex].pokemon[0].pokemonId);

    // Calcular contra quién va el movimiento (siempre será el otro jugador)
    const targetIndex = playerIndex === 0 ? 1 : 0;
    const targetUsername = match.players[targetIndex].username;

    // Registrar acción
    match.actions.push({
      player: username,
      move: moveName,
      target: targetUsername,
      timestamp: new Date()
    });

    // Actualizar turno actual
    match.currentTurn = targetUsername;

    // Guardar cambios
    await match.save();

    return match;
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    throw error;
  }
}

function calculateMoveResult(attackerPokemon, defenderPokemon, moveName, players) {
  // Buscar el movimiento en los movimientos del Pokémon atacante
  const move = attackerPokemon.moves.find(m => m.name === moveName);
  const currentHp = players.find(player => {
    return player.pokemon[0].pokemonId.toString() === defenderPokemon.id.toString();
  }).pokemon[0].currentHp;
  if (!move) {
    return {
      success: false,
      message: "Movimiento no encontrado",
      damage: 0
    };
  }

  // Calcular modificador de tipo (simplificado)
  let typeModifier = 1.0;
  if (isEffectiveAgainst(move.type, defenderPokemon.type.primary)) {
    typeModifier = 2.0;
  } else if (isNotEffectiveAgainst(move.type, defenderPokemon.type.primary)) {
    typeModifier = 0.5;
  }

  // Si hay tipo secundario, también calculamos su efecto
  if (defenderPokemon.type.secondary) {
    if (isEffectiveAgainst(move.type, defenderPokemon.type.secondary)) {
      typeModifier *= 2.0;
    } else if (isNotEffectiveAgainst(move.type, defenderPokemon.type.secondary)) {
      typeModifier *= 0.5;
    }
  }

  // Calcular daño básico (fórmula simplificada)
  const attackStat = move.type === "physical" ? attackerPokemon.stats.attack : attackerPokemon.stats.specialAttack;
  const defenseStat = move.type === "physical" ? defenderPokemon.stats.defense : defenderPokemon.stats.specialDefense;  // Fórmula de daño básica modificada para producir menos daño y alargar los combates
  // Dividimos por 200 en lugar de 150 y aplicamos un factor adicional de 0.75
  const baseDamage = Math.floor(
    ((2 * attackerPokemon.level / 5 + 2) * move.power * (attackStat / defenseStat) / 200) * 0.75 + 2
  );

  // Aplicar modificador de tipo
  let finalDamage = Math.floor(baseDamage * typeModifier);
  // Variación aleatoria (50-80%) para hacer más impredecible el daño y reducirlo aún más
  const randomFactor = (Math.random() * 30 + 50) / 100;
  finalDamage = Math.floor(finalDamage * randomFactor);

  // Determinar efectividad textual
  let effectiveness = "normal";
  if (typeModifier > 1.0) {
    effectiveness = "super effective";
  } else if (typeModifier < 1.0) {
    effectiveness = "not very effective";
  }

  // Verificar si el movimiento da en el blanco (accuracy check)
  const accuracyCheck = Math.random() * 100;
  if (accuracyCheck > move.accuracy) {
    return {
      success: false,
      message: "El movimiento falló",
      damage: 0,
      effectiveness: "missed"
    };
  }

  // Crear mensaje basado en la efectividad
  let message = `${attackerPokemon.name} usó ${moveName}`;
  if (effectiveness === "super effective") {
    message += ". ¡Es súper efectivo!";
  } else if (effectiveness === "not very effective") {
    message += ". No es muy efectivo...";
  }  // Calcular el nuevo HP después del daño
  const newHp = Math.max(0, currentHp - finalDamage);

  return {
    success: true,
    damage: finalDamage,
    message: message,
    effectiveness: effectiveness,
    newHp: newHp
  };
}

// Función para determinar efectividad de tipos (simplificada)
function isEffectiveAgainst(attackType, defenseType) {
  const effectivenessChart = {
    normal: [],
    fire: ["grass", "ice", "bug", "steel"],
    water: ["fire", "ground", "rock"],
    electric: ["water", "flying"],
    grass: ["water", "ground", "rock"],
    ice: ["grass", "ground", "flying", "dragon"],
    fighting: ["normal", "ice", "rock", "dark", "steel"],
    poison: ["grass", "fairy"],
    ground: ["fire", "electric", "poison", "rock", "steel"],
    flying: ["grass", "fighting", "bug"],
    psychic: ["fighting", "poison"],
    bug: ["grass", "psychic", "dark"],
    rock: ["fire", "ice", "flying", "bug"],
    ghost: ["psychic", "ghost"],
    dragon: ["dragon"],
    dark: ["psychic", "ghost"],
    steel: ["ice", "rock", "fairy"],
    fairy: ["fighting", "dragon", "dark"]
  };

  return effectivenessChart[attackType] && effectivenessChart[attackType].includes(defenseType);
}

function isNotEffectiveAgainst(attackType, defenseType) {
  const resistanceChart = {
    normal: ["rock", "steel"],
    fire: ["fire", "water", "rock", "dragon"],
    water: ["water", "grass", "dragon"],
    electric: ["electric", "grass", "dragon"],
    grass: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"],
    ice: ["fire", "water", "ice", "steel"],
    fighting: ["poison", "flying", "psychic", "bug", "fairy"],
    poison: ["poison", "ground", "rock", "ghost"],
    ground: ["grass", "bug"],
    flying: ["electric", "rock", "steel"],
    psychic: ["psychic", "steel"],
    bug: ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"],
    rock: ["fighting", "ground", "steel"],
    ghost: ["dark"],
    dragon: ["steel"],
    dark: ["fighting", "dark", "fairy"],
    steel: ["fire", "water", "electric", "steel"],
    fairy: ["fire", "poison", "steel"]
  };

  return resistanceChart[attackType] && resistanceChart[attackType].includes(defenseType);
}

async function endBattle(roomId, winnerName) {
  try {
    const match = await Match.findOne({ roomId });
    if (!match) throw new Error("Partida no encontrada");

    match.status = 'completed';
    match.winner = winnerName;
    match.endedAt = new Date();

    await match.save();
    console.log(`🏆 Partida ${roomId} terminada. Ganador: ${winnerName}`);

    return match;
  } catch (error) {
    console.error("Error al finalizar partida:", error);
    throw error;
  }
}

async function updateMatchOnDisconnect(ws) {
  try {
    const match = await Match.findOne({ roomId: ws.roomId });
    if (!match) return;

    // Si la partida ya está completada, no hacer nada
    if (match.status === 'completed') return;

    // Marcar como abandonada
    match.status = 'opponentDisconnected';

    // Si hay un oponente, declararlo ganador
    if (ws.opponent) {
      match.winner = ws.opponent.username;
      match.endedAt = new Date();
    }

    await match.save();
    console.log(`⚠️ Partida ${ws.roomId} abandonada por ${ws.username}`);
    // Notificar al oponente si sigue conectado
    if (ws.opponent && ws.opponent.readyState === WebSocket.OPEN) {
      ws.opponent.send(JSON.stringify({
        type: "battleEnd",
        message: `${ws.username} se ha desconectado. ¡Has ganado la partida!`,
        winner: ws.opponent.username,
        status: 'opponentDisconnected'
      }));
    }

    return match;
  } catch (error) {
    console.error("Error al actualizar partida abandonada:", error);
    throw error;
  }
}

// Función para actualizar la vida de un Pokémon en una partida
async function updatePokemonHp(roomId, username, newHp) {
  try {
    const match = await Match.findOne({ roomId });
    if (!match) throw new Error("Partida no encontrada");

    // Buscar el pokémon del jugador
    const playerIndex = match.players.findIndex(p => p.username === username);
    if (playerIndex === -1) throw new Error("Jugador no encontrado en la partida");

    // Actualizar la vida del Pokémon (no puede ser menor que 0)
    match.players[playerIndex].pokemon[0].currentHp = Math.max(0, newHp);

    // Guardar cambios
    await match.save();

    return match;
  } catch (error) {
    console.error("Error al actualizar la vida del Pokémon:", error);
    throw error;
  }
}
