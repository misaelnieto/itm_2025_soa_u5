import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  useToast,
} from "@chakra-ui/react";
import Card from "./components/Card.jsx";
import GameControls from "./components/GameControls.jsx";
import PlayerInfo from "./components/PlayerInfo.jsx";
import JoinGameModal from "./components/JoinGameModal.jsx";
import WinnerModal from "./components/WinnerModal.jsx";

// Símbolos para las cartas (emojis)
const CARD_SYMBOLS = [
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐨",
  "🦁",
  "🐮",
  "🐷",
];

function App() {
  // Estado del juego
  const [gameId, setGameId] = useState(null);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [gameStatus, setGameStatus] = useState("waiting"); // waiting, in_progress, completed
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(true);
  const [socket, setSocket] = useState(null);
  const [winner, setWinner] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const toast = useToast();

  // Conectar al WebSocket cuando se monta el componente
  useEffect(() => {
    // Usar la URL correcta para el WebSocket
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.hostname}:8083/ws`;
    console.log("Conectando a WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Conectado al servidor WebSocket");
      setSocket(ws);
      toast({
        title: "Conexión establecida",
        description: "Conectado al servidor de juego",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    };

    ws.onmessage = (event) => {
      console.log("Mensaje recibido:", event.data);
      try {
        const data = JSON.parse(event.data);
        handleSocketMessage(data);
      } catch (error) {
        console.error("Error al procesar mensaje:", error);
      }
    };

    ws.onclose = () => {
      console.log("Desconectado del servidor WebSocket");
      toast({
        title: "Desconectado",
        description: "Se perdió la conexión con el servidor",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    };

    ws.onerror = (error) => {
      console.error("Error en WebSocket:", error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar al servidor",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    };

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [toast]);

  // Función para obtener un identificador único del jugador
  const getPlayerIdentifier = (id) => {
    if (typeof id === "string") {
      return id.slice(0, 4);
    }
    return String(id).padStart(4, "0");
  };

  // Función para asegurar que no haya jugadores duplicados
  const ensureUniquePlayers = (players) => {
    const uniquePlayers = new Map();
    players.forEach((player) => {
      if (!uniquePlayers.has(player.id)) {
        uniquePlayers.set(player.id, player);
      }
    });
    return Array.from(uniquePlayers.values());
  };

  // Manejar mensajes del WebSocket
  const handleSocketMessage = (data) => {
    console.log("Procesando mensaje:", data);

    switch (data.type) {
      case "game_created":
        // Cuando se crea un juego, guardar el ID del juego y del jugador
        setGameId(data.game_id);
        setPlayerId(data.player_id);
        // Asegurarnos de que el nombre del creador se use correctamente
        const creatorName =
          data.player_name && data.player_name.trim() !== ""
            ? data.player_name
            : `Jugador ${getPlayerIdentifier(data.player_id)}`;
        setPlayerName(creatorName);
        // Agregar el jugador a la lista de jugadores
        setPlayers([
          {
            id: data.player_id,
            name: creatorName,
          },
        ]);
        toast({
          title: "Juego creado",
          description: `ID del juego: ${data.game_id}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        break;

      case "game_joined":
        // Cuando se une a un juego, guardar el ID del juego y del jugador
        setGameId(data.game_id);
        setPlayerId(data.player_id);
        // Asegurarnos de que el nombre del jugador que se une se use correctamente
        const joinerName =
          data.player_name && data.player_name.trim() !== ""
            ? data.player_name
            : `Jugador ${getPlayerIdentifier(data.player_id)}`;
        setPlayerName(joinerName);
        // Agregar el jugador a la lista de jugadores
        setPlayers((prevPlayers) => {
          const newPlayers = [
            ...prevPlayers,
            {
              id: data.player_id,
              name: joinerName,
            },
          ];
          return ensureUniquePlayers(newPlayers);
        });
        toast({
          title: "Unido al juego",
          description: `ID del juego: ${data.game_id}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        break;

      case "player_joined":
        // Agregar el nuevo jugador a la lista
        const newPlayer = {
          ...data.player,
          name:
            data.player.name && data.player.name.trim() !== ""
              ? data.player.name
              : `Jugador ${getPlayerIdentifier(data.player.id)}`,
        };
        setPlayers((prevPlayers) => {
          const updatedPlayers = [...prevPlayers, newPlayer];
          return ensureUniquePlayers(updatedPlayers);
        });
        toast({
          title: "Jugador unido",
          description: `${newPlayer.name} se ha unido al juego`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        break;

      case "game_state":
        // Asegurarnos de que los jugadores tengan nombres y no haya duplicados
        if (data.game.players) {
          const updatedPlayers = data.game.players.map((player) => ({
            ...player,
            name:
              player.name && player.name.trim() !== ""
                ? player.name
                : `Jugador ${getPlayerIdentifier(player.id)}`,
          }));
          setPlayers(ensureUniquePlayers(updatedPlayers));
        }
        updateGameState(data.game);
        break;

      case "player_turn":
        setCurrentPlayer(data.player.id);
        toast({
          title: "Turno",
          description: `Es el turno de ${data.player.name}`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        break;

      case "match_found":
        toast({
          title: "¡Coincidencia!",
          description: `${data.player.name} encontró una coincidencia`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        break;

      case "game_over":
        if (data.winner) {
          // Asegurarnos de que el ganador tenga un nombre
          const winnerWithName = {
            ...data.winner,
            name:
              data.winner.name && data.winner.name.trim() !== ""
                ? data.winner.name
                : `Jugador ${getPlayerIdentifier(data.winner.id)}`,
          };
          setWinner(winnerWithName);
          setShowWinnerModal(true);
          toast({
            title: "Juego terminado",
            description: `${winnerWithName.name} ha ganado el juego`,
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        }
        break;

      case "error":
        toast({
          title: "Error",
          description: data.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        break;

      default:
        console.log("Mensaje desconocido:", data);
    }
  };

  // Actualizar el estado del juego con datos del servidor
  const updateGameState = (game) => {
    console.log("Actualizando estado del juego:", game);
    setGameId(game.id);
    setCards(game.cards || []);
    setPlayers(game.players || []);
    setCurrentPlayer(game.current_player);
    setGameStatus(game.status);

    // Actualizar cartas volteadas y emparejadas
    if (game.cards && game.cards.length > 0) {
      // Solo mostrar cartas que están reveladas o emparejadas
      const revealed = game.cards
        .filter((card) => card.status === "revealed")
        .map((card) => card.id);
      const matched = game.cards
        .filter((card) => card.status === "matched")
        .map((card) => card.id);

      setFlippedCards(revealed);
      setMatchedCards(matched);
    } else {
      // Si no hay cartas, limpiar los estados
      setFlippedCards([]);
      setMatchedCards([]);
    }
  };

  // Crear un nuevo juego
  const createNewGame = () => {
    if (!socket) {
      toast({
        title: "Error",
        description: "No hay conexión con el servidor",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const message = JSON.stringify({
      action: "create_game",
      name: `Juego de ${playerName}`,
      player_name: playerName,
    });

    console.log("Enviando mensaje:", message);
    socket.send(message);
  };

  // Unirse a un juego existente
  const handleJoinGame = (gameId, playerName) => {
    if (gameId) {
      // Unirse a un juego existente
      socket.send(
        JSON.stringify({
          action: "join_game",
          game_id: parseInt(gameId),
          name: playerName,
        })
      );
    } else {
      // Crear un nuevo juego
      socket.send(
        JSON.stringify({
          action: "create_game",
          name: `Juego de ${playerName}`,
          player_name: playerName,
        })
      );
    }
    setIsJoinModalOpen(false);
  };

  // Iniciar el juego
  const startGame = () => {
    if (!socket || !gameId) {
      toast({
        title: "Error",
        description:
          "No hay conexión con el servidor o no se ha creado un juego",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const message = JSON.stringify({
      action: "start_game",
      game_id: gameId,
    });

    console.log("Enviando mensaje:", message);
    socket.send(message);
  };

  // Manejar clic en una carta
  const handleCardClick = (card) => {
    // Solo permitir clic si es el turno del jugador actual
    if (currentPlayer !== playerId || gameStatus !== "in_progress") {
      if (currentPlayer !== playerId) {
        toast({
          title: "No es tu turno",
          status: "warning",
          duration: 2000,
          isClosable: true,
        });
      }
      return;
    }

    // No permitir clic en cartas ya volteadas o emparejadas
    if (flippedCards.includes(card.id) || matchedCards.includes(card.id))
      return;

    // No permitir voltear más de 2 cartas a la vez
    if (flippedCards.length === 2) return;

    if (!socket || !gameId) return;

    const message = JSON.stringify({
      action: "flip_card",
      game_id: gameId,
      card_id: card.id,
    });

    console.log("Enviando mensaje:", message);
    socket.send(message);
  };

  // Reiniciar el juego
  const resetGame = () => {
    if (!socket || !gameId) return;

    const message = JSON.stringify({
      action: "reset_game",
      game_id: gameId,
    });

    console.log("Enviando mensaje:", message);
    socket.send(message);
  };

  // Determinar si es el turno del jugador actual
  const isMyTurn = currentPlayer === playerId;

  return (
    <Container maxW="container.xl">
      <Box textAlign="center" py={8}>
        <Heading as="h1" size="2xl" mb={6}>
          Memorama - Juego de Memoria
        </Heading>

        {gameId && (
          <Text mb={4} fontWeight="bold">
            ID del Juego: {gameId} {playerId && `- Tu ID: ${playerId}`}
          </Text>
        )}

        {/* Información de los jugadores */}
        {players.length > 0 && (
          <Flex justify="space-around" mb={6}>
            {players.map((player) => (
              <PlayerInfo
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === currentPlayer}
                isMe={player.id === playerId}
              />
            ))}
          </Flex>
        )}

        {/* Controles del juego */}
        <GameControls
          gameStatus={gameStatus}
          isMyTurn={isMyTurn}
          onStartGame={startGame}
          onResetGame={resetGame}
          onCreateGame={createNewGame}
        />

        {/* Tablero de juego */}
        {gameStatus !== "waiting" && cards.length > 0 && (
          <Grid
            templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
            gap={4}
            mt={8}
          >
            {cards.map((card) => (
              <Card
                key={card.id}
                card={card}
                isFlipped={flippedCards.includes(card.id)}
                isMatched={matchedCards.includes(card.id)}
                onClick={() => handleCardClick(card)}
                isMyTurn={isMyTurn}
              />
            ))}
          </Grid>
        )}
      </Box>

      {/* Modal para unirse a un juego */}
      <JoinGameModal isOpen={isJoinModalOpen} onJoin={handleJoinGame} />

      {/* Vista previa del tablero tapado en el lobby */}
      {gameStatus === "waiting" && (
        <Box mt={8} textAlign="center">
          <Grid
            templateColumns={{
              base: "repeat(2, 100px)",
              md: "repeat(4, 280px)",
            }}
            gap={3}
            justifyContent="center"
            width="fit-content"
            margin="0 auto"
          >
            {Array.from({ length: 16 }).map((_, idx) => (
              <Card
                key={idx}
                card={{ id: idx, card_type: "?" }}
                isFlipped={false}
                isMatched={false}
                onClick={null}
                isMyTurn={false}
              />
            ))}
          </Grid>
        </Box>
      )}

      {/* Modal de victoria */}
      {winner && (
        <WinnerModal
          isOpen={showWinnerModal}
          onClose={() => {
            setShowWinnerModal(false);
            setWinner(null);
          }}
          winner={winner}
          onResetGame={() => {
            setShowWinnerModal(false);
            setWinner(null);
            resetGame();
          }}
          onCreateNewGame={() => {
            setShowWinnerModal(false);
            setWinner(null);
            setIsJoinModalOpen(true);
          }}
        />
      )}
    </Container>
  );
}

export default App;
