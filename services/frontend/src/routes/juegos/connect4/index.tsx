import { useState, useEffect } from "react"
import { createFileRoute } from "@tanstack/react-router"
import Navbar from "@/components/Common/Navbar"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/juegos/connect4/")({
  component: Connect4,
})

function Connect4() {
  const { user: currentUser } = useAuth()
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [roomId, setRoomId] = useState("")
  const [joinRoomCode, setJoinRoomCode] = useState("")
  const [board, setBoard] = useState<number[][]>([])
  const [currentTurn, setCurrentTurn] = useState(1)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting')
  const [message, setMessage] = useState("")
  const [playerNumber, setPlayerNumber] = useState<1 | 2 | null>(null)

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8090')
    
    socket.onopen = () => {
      console.log('Conectado al servidor WebSocket')
      setWs(socket)
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('Mensaje recibido:', data) // Agregar log para depuración
      handleWebSocketMessage(data)
    }

    socket.onclose = () => {
      console.log('Desconectado del servidor WebSocket')
      setWs(null)
    }

    return () => {
      socket.close()
    }
  }, [])

  const handleWebSocketMessage = (data: any) => {
    console.log('Procesando mensaje:', data.type) // Agregar log para depuración
    switch (data.type) {
      case 'room_created':
        setRoomId(data.roomId)
        setBoard(data.gameState.board)
        setCurrentTurn(data.gameState.currentTurn)
        setPlayerNumber(1)
        setMessage('Sala creada. Esperando otro jugador...')
        break
      case 'join_success':
        setRoomId(data.roomId)
        setBoard(data.gameState.board)
        setCurrentTurn(data.gameState.currentTurn)
        setPlayerNumber(2)
        setMessage('Te has unido a la sala. El juego comenzará pronto...')
        break
      case 'game_start':
        setBoard(data.gameState.board)
        setCurrentTurn(data.gameState.currentTurn)
        setGameStatus('playing')
        setMessage('¡El juego ha comenzado!')
        break
      case 'move_success':
      case 'move':
        setBoard(data.gameState.board)
        setCurrentTurn(data.gameState.currentTurn)
        setMessage(data.gameState.currentTurn === playerNumber ? 'Tu turno' : 'Turno del oponente')
        break
      case 'invalid_move':
        setMessage('Movimiento inválido. Intenta de nuevo.')
        break
      case 'not_your_turn':
        setMessage('No es tu turno')
        break
      case 'game_over':
        setGameStatus('finished')
        if (data.isDraw) {
          setMessage('¡Empate!')
        } else {
          setMessage(data.winner === playerNumber ? '¡Has ganado!' : '¡Has perdido!')
        }
        break
      case 'error':
        setMessage(data.message)
        break
      case 'player_disconnected':
        setMessage('El otro jugador se ha desconectado')
        setGameStatus('finished')
        break
    }
  }

  const createRoom = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'create_room',
        username: currentUser?.user_id
      }))
    }
  }  

  const handleJoinRoom = (roomCode: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('Enviando solicitud para unirse a sala:', roomCode) // Agregar log para depuración
      ws.send(JSON.stringify({
        type: 'join',
        roomId: roomCode,
        username: currentUser?.user_id
      }))
    }
  }

  const handleMove = (column: number) => {
    if (
      ws && 
      ws.readyState === WebSocket.OPEN && 
      gameStatus === 'playing' && 
      currentTurn === playerNumber
    ) {
      ws.send(JSON.stringify({
        type: 'move',
        roomId,
        column,
        playerId: currentUser?.user_id
      }))
    }
  }

  const getColumnStyle = (colIndex: number) => {
    if (gameStatus !== 'playing' || currentTurn !== playerNumber) {
      return {}
    }

    return {
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#edf2f7'
      }
    }
  }

  return (
    <div style={{ height: '100vh', maxWidth: '960px', margin: '0 auto', padding: '16px' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>Conecta 4 - Multijugador</p>

        <p style={{ color: message.includes('error') ? 'red' : 'green' }}>
          {message}
        </p>

        {!roomId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                style={{ 
                  backgroundColor: '#3182ce', 
                  color: 'white', 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '4px',
                  flex: 1
                }}
                onClick={createRoom}
              >
                Crear Nueva Sala
              </button>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '8px',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Código de sala"
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value)}
                style={{ 
                  padding: '8px', 
                  flex: 1,
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0'
                }}
              />
              <button
                style={{ 
                  backgroundColor: '#38a169', 
                  color: 'white', 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '4px'
                }}
                onClick={() => handleJoinRoom(joinRoomCode)}
                disabled={!joinRoomCode}
              >
                Unirse a Sala
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f7fafc', 
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <p>Código de sala: <strong>{roomId}</strong></p>
                <p style={{ marginTop: '4px', fontSize: '14px' }}>
                  {playerNumber ? `Eres el Jugador ${playerNumber}` : 'Esperando...'}
                </p>
              </div>
              <div>
                <p>Turno del Jugador {currentTurn}</p>
                <p style={{ 
                  marginTop: '4px', 
                  color: currentTurn === playerNumber ? '#38a169' : '#718096',
                  fontSize: '14px'
                }}>
                  {currentTurn === playerNumber ? 'Tu turno' : 'Turno del oponente'}
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 50px)',
                gap: '4px',
                margin: '0 auto'
              }}
            >
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: cell === 0 ? '#e2e8f0' : cell === 1 ? '#f56565' : '#ecc94b',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: gameStatus === 'playing' && currentTurn === playerNumber ? 'pointer' : 'default',
                      opacity: gameStatus === 'playing' && currentTurn === playerNumber ? 1 : 0.8
                    }}
                    onClick={() => gameStatus === 'playing' && handleMove(colIndex)}
                  />
                ))
              )}
            </div>

            {gameStatus === 'finished' && (
              <button
                style={{ 
                  backgroundColor: '#3182ce', 
                  color: 'white', 
                  padding: '8px', 
                  border: 'none', 
                  borderRadius: '4px',
                  margin: '0 auto',
                  width: 'fit-content'
                }}
                onClick={() => ws?.send(JSON.stringify({ 
                  type: 'new_game',
                  roomId,
                  playerId: currentUser?.user_id
                }))}
              >
                Nueva Partida
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Connect4
