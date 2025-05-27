import React from "react";
import { Button, Flex, Text, HStack, Badge } from "@chakra-ui/react";

function GameControls({
  gameStatus,
  isMyTurn,
  onStartGame,
  onResetGame,
  onCreateGame,
}) {
  return (
    <Flex direction="column" gap={4} align="center">
      <HStack gap={4}>
        <Badge colorScheme="purple" p={2} fontSize="md">
          Estado:{" "}
          {gameStatus === "waiting"
            ? "Esperando"
            : gameStatus === "in_progress"
            ? "En progreso"
            : "Completado"}
        </Badge>

        {gameStatus === "in_progress" && (
          <Badge colorScheme={isMyTurn ? "green" : "red"} p={2} fontSize="md">
            {isMyTurn ? "Tu turno" : "Turno del oponente"}
          </Badge>
        )}
      </HStack>

      <HStack gap={4} mt={2}>
        {gameStatus === "waiting" ? (
          <>
            <Button colorScheme="green" onClick={onStartGame}>
              Iniciar Juego
            </Button>
          </>
        ) : (
          <>
            <Button colorScheme="blue" onClick={onStartGame}>
              Nuevo Juego
            </Button>
            <Button colorScheme="red" variant="outline" onClick={onResetGame}>
              Reiniciar
            </Button>
          </>
        )}
      </HStack>
    </Flex>
  );
}

export default GameControls;
