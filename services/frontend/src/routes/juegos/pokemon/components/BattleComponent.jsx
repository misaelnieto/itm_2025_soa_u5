import { useState, useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'

function BattleComponent({ handleNextStep, battleData, username, selectedPokemon }) {
  // Battle state
  const [gameState, setGameState] = useState({
    yourTurn: battleData?.yourTurn || false,
    battleLog: [],
    yourPokemon: null,
    opponentPokemon: null,
    currentHp: {
      your: 0,
      opponent: 0
    },
    maxHp: {
      your: 0,
      opponent: 0
    },
    winner: null,
    battleEnded: false
  });

  // Animation states
  const [animationState, setAnimationState] = useState({
    attackAnimation: false,
    damageAnimation: false,
    message: '',
    lastMove: null
  });

  // WebSocket reference
  const ws = useRef(null);
    // Set up players and their Pokémon based on the data received
  useEffect(() => {
    if (!battleData?.players || battleData.players.length !== 2) return;
    
    const yourPlayerIndex = battleData.players.findIndex(player => player.username === username);
    const opponentIndex = yourPlayerIndex === 0 ? 1 : 0;
    
    if (yourPlayerIndex === -1) return;
    
    const yourPlayer = battleData.players[yourPlayerIndex];
    const opponentPlayer = battleData.players[opponentIndex];
    
    // Set initial game state
    setGameState(prev => ({
      ...prev,
      yourPokemon: yourPlayer.pokemon,
      opponentPokemon: opponentPlayer.pokemon,
      yourTurn: battleData.yourTurn,
      currentHp: {
        your: yourPlayer.pokemon.stats?.hp || 100,
        opponent: opponentPlayer.pokemon.stats?.hp || 100
      },
      maxHp: {
        your: yourPlayer.pokemon.stats?.hp || 100,
        opponent: opponentPlayer.pokemon.stats?.hp || 100
      },
      battleLog: [
        {
          message: `¡La batalla entre ${yourPlayer.username} y ${opponentPlayer.username} ha comenzado!`,
          timestamp: new Date().toISOString(),
          type: 'info'
        }
      ]
    }));
  }, [battleData, username]);
  // WebSocket connection effect
  useEffect(() => {
    if (!battleData?.roomId) return;
    
    // Create WebSocket connection (reuse the same connection from match finding if possible)
    // const wsUrl = `ws://${window.location.hostname}:8084/ws`; // local
    const wsUrl = `ws://${window.location.hostname}:8083/ws`; // docker
    ws.current = new WebSocket(wsUrl);
    
    // Connection opened
    ws.current.onopen = () => {
      console.log('WebSocket connection established for battle');
      addBattleLog('Conexión establecida con el servidor', 'info');
      
      // Rejoin the battle room if needed
      if (battleData.roomId) {
        ws.current.send(JSON.stringify({
          type: 'join',
          username: username,
          pokemonId: selectedPokemon?._id,
          roomId: battleData.roomId
        }));
      }
    };
    
    // Listen for messages from server
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received battle message:', data);
        
        switch (data.type) {
          case 'moveResult':
            // Cuando nuestro movimiento ha sido procesado
            handleMoveResult(data, true);
            break;
            
          case 'opponentMove':
            // Cuando el oponente hace un movimiento
            handleMoveResult(data, false);
            break;
            
          case 'battleEnd':
            // Fin de la batalla
            handleBattleEnd(data);
            break;
            
          case 'opponentDisconnected':
            // Oponente desconectado
            addBattleLog(`${data.message}`, 'warning');
            setGameState(prev => ({
              ...prev,
              battleEnded: true,
              winner: username
            }));
            break;
            
          case 'error':
            addBattleLog(`Error: ${data.message}`, 'error');
            break;
            
          default:
            console.log('Mensaje de batalla no manejado:', data);
        }
      } catch (error) {
        console.error('Error al procesar mensaje de batalla:', error);
      }
    };
    
    // Handle WebSocket errors
    ws.current.onerror = (error) => {
      console.error('WebSocket error en batalla:', error);
      addBattleLog('Error de conexión con el servidor', 'error');
    };
    
    // Clean up on component unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [battleData, username]);

  // Add message to battle log
  const addBattleLog = (message, type = 'info') => {
    setGameState(prev => ({
      ...prev,
      battleLog: [
        ...prev.battleLog,
        {
          message,
          timestamp: new Date().toISOString(),
          type
        }
      ]
    }));
  };
  // Handle when a move is selected
  const handleMoveSelect = (moveName) => {
    console.log(gameState)
    if (!gameState.yourTurn || gameState.battleEnded) return;
    
    // Send move to server
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'move',
        move: moveName,
        roomId: battleData.roomId
      }));
      
      // Add to battle log
      addBattleLog(`${username} usa ${moveName}!`, 'attack');
      
      // Start attack animation
      setAnimationState(prev => ({
        ...prev,
        attackAnimation: true,
        lastMove: moveName
      }));
      
      // Reset animation after a delay
      setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          attackAnimation: false
        }));
      }, 1000);
    }
  };

  // Handle result of a move
  const handleMoveResult = (data, isYourMove) => {
    const { result, move } = data;
    
    // Update turn status
    setGameState(prev => ({
      ...prev,
      yourTurn: data.yourTurn
    }));
    
    // Add the result to battle log
    addBattleLog(result.message, isYourMove ? 'attack' : 'opponent');
    
    // Update HP values and show damage animation
    if (result.success && result.damage > 0) {
      if (isYourMove) {
        // Your attack hit opponent
        setGameState(prev => ({
          ...prev,
          currentHp: {
            ...prev.currentHp,
            opponent: Math.max(0, prev.currentHp.opponent - result.damage)
          }
        }));
        
        // Opponent damage animation
        setAnimationState(prev => ({
          ...prev,
          damageAnimation: true,
          message: result.effectiveness === 'super effective' ? '¡Es súper efectivo!' : 
                  result.effectiveness === 'not very effective' ? 'No es muy efectivo...' : ''
        }));
      } else {
        // Opponent attack hit you
        setGameState(prev => ({
          ...prev,
          currentHp: {
            ...prev.currentHp,
            your: Math.max(0, prev.currentHp.your - result.damage)
          }
        }));
        
        // Your damage animation
        setAnimationState(prev => ({
          ...prev,
          damageAnimation: true,
          message: result.effectiveness === 'super effective' ? '¡Es súper efectivo!' : 
                  result.effectiveness === 'not very effective' ? 'No es muy efectivo...' : ''
        }));
      }
      
      // Reset damage animation
      setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          damageAnimation: false,
          message: ''
        }));
      }, 1500);
    }
    
    // Handle battle end
    console.log(gameState.yourPokemon?.name);
    if (result.battleEnded) {
      addBattleLog(`¡${result.winner} ha ganado la batalla!`, 'info');
      setGameState(prev => ({
        ...prev,
        battleEnded: true,
        winner: result.winner === gameState.yourPokemon?.name ? username : null
      }));
    }
  };

  // Handle end of battle
  const handleBattleEnd = (data) => {
    addBattleLog(`¡${data.message}`, 'info');
    setGameState(prev => ({
      ...prev,
      battleEnded: true,
      winner: data.winner === gameState.yourPokemon?.name ? username : data.winner
    }));
  };

  // Return to selection
  const handleBackToSelection = () => {
    if (ws.current) {
      ws.current.close();
    }
    setGameState({
    yourTurn: battleData?.yourTurn || false,
    battleLog: [],
    yourPokemon: null,
    opponentPokemon: null,
    currentHp: {
      your: 0,
      opponent: 0
    },
    maxHp: {
      your: 0,
      opponent: 0
    },
    winner: null,
    battleEnded: false
  });
    handleNextStep && handleNextStep('selection');
  };

  // Calculate HP percentage for health bars
  const calculateHpPercentage = (current, max) => {
    return Math.max(0, Math.min(100, (current / max) * 100));
  };

  // Get color for HP bar
  const getHpColor = (percentage) => {
    if (percentage > 50) return '#4CAF50';
    if (percentage > 20) return '#FFC107';
    return '#F44336';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #3a75c4 0%, #f33a3a 100%)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      gap: '20px'
    }}>
      {/* Background elements */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        left: 0,
        top: 0,
        background: 'url(https://pokemonrevolution.net/forum/uploads/monthly_2021_03/DVMT-6OXcAE2rZY.jpg.afab972f972bd7fbd4253bc7aa1cf27f.jpg)',
        backgroundSize: 'cover',
        opacity: 0.3,
        zIndex: 0
      }}></div>
      
      {/* Battle title */}
      <div style={{
        textAlign: 'center',
        padding: '10px',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '8px',
        margin: '0 0 10px 0',
        zIndex: 1
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          Batalla Pokémon
        </h2>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
          {gameState.battleEnded
            ? `La batalla ha terminado. ${gameState.winner === username ? '¡Has ganado!' : '¡Has perdido!'}`
            : gameState.yourTurn
              ? '¡Es tu turno! Selecciona un movimiento'
              : 'Esperando el movimiento del oponente...'}
        </p>
      </div>

      {/* Battle arena */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
        zIndex: 1
      }}>
        {/* Opponent Pokemon */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '15px',
          borderRadius: '10px',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                Oponente: {gameState.opponentPokemon?.name}
              </p>
              
              {/* HP Bar */}
              <div style={{
                width: '100%',
                height: '20px',
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${calculateHpPercentage(gameState.currentHp.opponent, gameState.maxHp.opponent)}%`,
                  height: '100%',
                  background: getHpColor(calculateHpPercentage(gameState.currentHp.opponent, gameState.maxHp.opponent)),
                  borderRadius: '10px',
                  transition: 'width 0.5s ease-in-out',
                }}></div>
                <span style={{
                  position: 'absolute',
                  top: '0',
                  left: '5px',
                  color: 'white',
                  fontSize: '12px',
                  lineHeight: '20px'
                }}>
                  {gameState.currentHp.opponent} / {gameState.maxHp.opponent} HP
                </span>
              </div>
            </div>
              {/* Opponent Pokemon image */}
            <div style={{
              width: '100px',
              height: '100px',
              marginLeft: '20px',
              position: 'relative',
              animation: animationState.damageAnimation && !gameState.yourTurn
                ? 'shake 0.5s ease-in-out'
                : 'none'
            }}>
              {gameState.opponentPokemon?.image && (
                <img
                  src={gameState.opponentPokemon.image}
                  alt={gameState.opponentPokemon.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: gameState.currentHp.opponent <= 0 ? 'grayscale(100%)' : 'none'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Message area */}
        <div style={{
          textAlign: 'center',
          height: '30px',
          margin: '0',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#FFEB3B',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
        }}>
          {animationState.message}
        </div>

        {/* Your Pokemon */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '15px',
          borderRadius: '10px',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'row-reverse'
          }}>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                Tu Pokémon: {gameState.yourPokemon?.name}
              </p>
              
              {/* HP Bar */}
              <div style={{
                width: '100%',
                height: '20px',
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${calculateHpPercentage(gameState.currentHp.your, gameState.maxHp.your)}%`,
                  height: '100%',
                  background: getHpColor(calculateHpPercentage(gameState.currentHp.your, gameState.maxHp.your)),
                  borderRadius: '10px',
                  transition: 'width 0.5s ease-in-out',
                }}></div>
                <span style={{
                  position: 'absolute',
                  top: '0',
                  right: '5px',
                  color: 'white',
                  fontSize: '12px',
                  lineHeight: '20px'
                }}>
                  {gameState.currentHp.your} / {gameState.maxHp.your} HP
                </span>
              </div>
            </div>
              {/* Your Pokemon image */}
            <div style={{
              width: '120px',
              height: '120px',
              marginRight: '20px',
              position: 'relative',
              animation: animationState.attackAnimation
                ? 'attack 0.5s ease-in-out'
                : animationState.damageAnimation && gameState.yourTurn
                  ? 'shake 0.5s ease-in-out'
                  : 'none'
            }}>
              {gameState.yourPokemon?.image && (
                <img
                  src={gameState.yourPokemon.image}
                  alt={gameState.yourPokemon.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: gameState.currentHp.your <= 0 ? 'grayscale(100%)' : 'none'
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>      {/* Moves selection */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginTop: '20px',
        justifyContent: 'center',
        zIndex: 1
      }}>
        {gameState.yourPokemon?.moves?.map((move, index) => (
          <button
            key={index}
            onClick={() => handleMoveSelect(move.name)}
            disabled={!gameState.yourTurn || gameState.battleEnded}
            style={{
              padding: '12px 15px',
              border: 'none',
              borderRadius: '8px',
              background: getTypeColor(move.type),
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: gameState.yourTurn && !gameState.battleEnded ? 'pointer' : 'not-allowed',
              opacity: gameState.yourTurn && !gameState.battleEnded ? 1 : 0.6,
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
              minWidth: '120px',
              textAlign: 'center',
            }}
          >
            {move.name}
            <div style={{ fontSize: '12px', marginTop: '3px' }}>
              Tipo: {move.type}
            </div>
          </button>
        ))}
      </div>

      {/* Battle log */}
      <div style={{
        marginTop: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '8px',
        padding: '10px',
        maxHeight: '150px',
        overflowY: 'auto',
        zIndex: 1
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', paddingBottom: '5px' }}>
          Registro de Batalla
        </h3>
        <div style={{ fontSize: '14px' }}>
          {gameState.battleLog.map((log, index) => (
            <div key={index} style={{ 
              marginBottom: '5px', 
              padding: '3px 0',
              color: log.type === 'error' ? '#FF5252' : 
                     log.type === 'attack' ? '#8BC34A' : 
                     log.type === 'opponent' ? '#FF9800' : 
                     log.type === 'warning' ? '#FFC107' : 'white' 
            }}>
              {log.message}
            </div>
          ))}
        </div>
      </div>

      {/* Battle controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px',
        zIndex: 1
      }}>
        {gameState.battleEnded ? (
          <button
            onClick={handleBackToSelection}
            style={{
              padding: '12px 24px',
              background: '#1E88E5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease',
            }}
          >
            Volver a Selección
          </button>
        ) : (
          <div style={{
            padding: '10px',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            {gameState.yourTurn ? 
              '¡Selecciona un movimiento para atacar!' : 
              'Esperando el movimiento de tu oponente...'}
          </div>
        )}
      </div>      {/* CSS Animations */}
      <style>{`
        @keyframes attack {
          0% { transform: translateX(0); }
          50% { transform: translateX(-20px); }
          100% { transform: translateX(0); }
        }
        
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(5px); }
          50% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

// Helper function to get color based on Pokemon type
function getTypeColor(type) {
  const typeColors = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC'
  };

  return typeColors[type.toLowerCase()] || '#777777';
}

export default BattleComponent

export const Route = createFileRoute('/juegos/pokemon/components/BattleComponent')({
  component: BattleComponent
})
