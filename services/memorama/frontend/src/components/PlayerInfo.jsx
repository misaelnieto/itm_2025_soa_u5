import React from "react";
import { Box, Text, Badge } from "@chakra-ui/react";

function PlayerInfo({ player, isCurrentPlayer, isMe }) {
  // Función para obtener un identificador único del jugador
  const getPlayerIdentifier = (id) => {
    if (typeof id === "string") {
      return id.slice(0, 4);
    }
    return String(id).padStart(4, "0");
  };

  const displayName =
    player.name || `Jugador ${getPlayerIdentifier(player.id)}`;

  return (
    <Box
      p={4}
      borderRadius="md"
      bg={isCurrentPlayer ? "blue.100" : "gray.100"}
      borderWidth={1}
      borderColor={isCurrentPlayer ? "blue.500" : "gray.200"}
      position="relative"
    >
      <Text fontWeight="bold">{displayName}</Text>
      {isMe && (
        <Badge colorScheme="green" position="absolute" top={2} right={2}>
          Tú
        </Badge>
      )}
      {isCurrentPlayer && (
        <Badge colorScheme="blue" position="absolute" bottom={0} right={2}>
          Turno actual
        </Badge>
      )}
    </Box>
  );
}

export default PlayerInfo;
