import { useState, useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'

function FindingMatchComponent({ handleNextStep, selectedPokemon, username, isLookingForMatch }) {
  const [dots, setDots] = useState('.');
  const [searchTime, setSearchTime] = useState(0);
  const [pokemonRotation, setPokemonRotation] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Buscando Partida');
  const [connectionError, setConnectionError] = useState(null);
  const [matchFound, setMatchFound] = useState(false);
  
  // WebSocket reference
  const ws = useRef(null);

  // Effect for the loading dots animation
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '.');
    }, 500);
    
    return () => clearInterval(dotsInterval);
  }, []);

  // Effect for counting search time
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timeInterval);
  }, []);

  // Effect for rotating Pokeball
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setPokemonRotation(prev => (prev + 5) % 360);
    }, 50);
    
    return () => clearInterval(rotationInterval);
  }, []);

  // WebSocket connection effect
  useEffect(() => {
    // Create WebSocket connection
    if (!isLookingForMatch) return;
    const wsUrl = `ws://${window.location.hostname}:8083/ws`; // docker
    // const wsUrl = `ws://${window.location.hostname}:8084/ws`; // local
    ws.current = new WebSocket(wsUrl);
    
    // Connection opened
    ws.current.onopen = () => {
      console.log('WebSocket connection established');
        console.log(username, selectedPokemon);
      // Send join message with username and selected Pokemon
      if (username && selectedPokemon) {
        ws.current.send(JSON.stringify({
          type: 'join',
          username: username,
          pokemonId: selectedPokemon._id
        }));
      } else {
        setConnectionError('Falta información de usuario o Pokémon seleccionado');
      }
    };
    
    // Listen for messages from server
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        switch (data.type) {
          case 'waiting':
            setStatusMessage('Esperando otro jugador...');
            break;
            
          case 'start':
            setStatusMessage('¡Partida encontrada!');
            setMatchFound(true);
            
            // Wait a moment before proceeding to the game
            setTimeout(() => {
              handleNextStep && handleNextStep('battle', {
                roomId: data.roomId,
                players: data.players,
                yourTurn: data.yourTurn,
                socket: ws.current,
              });
            }, 1500);
            break;
            
          case 'error':
            setConnectionError(data.message);
            break;
            
          default:
            console.log('Mensaje no manejado:', data);
        }
      } catch (error) {
        console.error('Error al procesar mensaje:', error);
      }
    };
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionError('Error de conexión con el servidor');
    };
    
    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [handleNextStep, selectedPokemon, username, isLookingForMatch]);

  // Cancel search and go back function
  const cancelSearch = () => {
    // Close WebSocket connection
    if (ws.current) {
      ws.current.close();
    }
    
    // Go back to selection step
    handleNextStep && handleNextStep('selection');
  };
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      borderRadius: '12px',
      marginTop: '20px',
      gap: '25px',
      background: 'linear-gradient(135deg, #3a75c4 0%, #f33a3a 100%)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      width: '90%',
      maxWidth: '100%',
      color: 'white',
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background animated circles */}
      <div style={{
        position: 'absolute',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        top: '-50px',
        left: '-50px',
        zIndex: 0,
      }}></div>
      <div style={{
        position: 'absolute',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        bottom: '-30px',
        right: '20px',
        zIndex: 0,
      }}></div>

      {/* Pokeball animation */}
      <div style={{
        transform: `rotate(${pokemonRotation}deg)`,
        marginBottom: '20px',
        zIndex: 1,
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: matchFound 
            ? 'linear-gradient(to bottom, #4caf50 0%, #4caf50 50%, white 50%, white 100%)'
            : 'linear-gradient(to bottom, #f33a3a 0%, #f33a3a 50%, white 50%, white 100%)',
          position: 'relative',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{
            position: 'absolute',
            width: '30px',
            height: '30px',
            background: 'white',
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 0 8px #222, 0 0 0 10px white',
          }}></div>
        </div>
      </div>

      {/* Title with glass effect */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(8px)',
        padding: '15px 30px',
        borderRadius: '8px',
        textAlign: 'center',
        zIndex: 1,
      }}>
        <h2 style={{ 
          margin: '0',
          fontSize: '28px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          {statusMessage}{!matchFound ? dots : ''}
        </h2>
        <p style={{ 
          margin: '10px 0 0',
          fontSize: '16px',
          opacity: 0.9
        }}>
          Tiempo de búsqueda: {Math.floor(searchTime / 60)}:{(searchTime % 60).toString().padStart(2, '0')}
        </p>
        
        {/* Connection error message */}
        {connectionError && (
          <p style={{ 
            margin: '10px 0 0',
            fontSize: '16px',
            color: '#ffcccc',
            fontWeight: 'bold'
          }}>
            Error: {connectionError}
          </p>
        )}
      </div>

      {/* Players needed indicator */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '15px',
        borderRadius: '8px',
        width: '80%',
        zIndex: 1,
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
          {matchFound ? 'Jugadores conectados' : 'Esperando jugadores...'}
        </p>
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
        }}>
          {[1, 2].map((player) => (
            <div key={player} style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: (player === 1 || matchFound) ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}>
              <div style={{
                fontSize: '20px',
                color: '#333',
                fontWeight: 'bold',
              }}>
                {player}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Pokémon info if available */}
      {selectedPokemon && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '15px',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '80%',
          zIndex: 1,
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
            Tu Pokémon seleccionado
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            {selectedPokemon.image && (
              <img 
                src={selectedPokemon.image} 
                alt={selectedPokemon.name}
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'contain',
                }}
              />
            )}
            <div>
              <p style={{ 
                margin: '0',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                {selectedPokemon.name}
              </p>
              <p style={{ 
                margin: '5px 0 0',
                fontSize: '14px',
                opacity: 0.9
              }}>
                Tipo: {selectedPokemon.type.primary}
                {selectedPokemon.type.secondary && ` / ${selectedPokemon.type.secondary}`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={{
        background: 'rgba(0, 0, 0, 0.15)',
        padding: '12px',
        borderRadius: '8px',
        textAlign: 'center',
        marginTop: '10px',
        zIndex: 1,
        width: '80%',
      }}>
        <p style={{ 
          margin: '0',
          fontSize: '14px',
          fontStyle: 'italic'
        }}>
          Tip: Los Pokémon de tipo agua son efectivos contra los de tipo fuego.
        </p>
      </div>
    </div>
  )
}

export default FindingMatchComponent

export const Route = createFileRoute('/juegos/pokemon/components/FindingMatchComponent')({
  component: FindingMatchComponent
})
