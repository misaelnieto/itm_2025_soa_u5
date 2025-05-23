import React from "react";
import { Box } from "@chakra-ui/react";

function Card({ card, isFlipped, isMatched, onClick, isMyTurn }) {
  // Si la carta está emparejada, siempre mostrarla volteada
  const shouldShowContent = isFlipped || isMatched;

  return (
    <Box
      position="relative"
      width="100%"
      height="150px"
      cursor={isMyTurn && !isMatched ? "pointer" : "not-allowed"}
      onClick={isMyTurn && !isMatched ? onClick : undefined}
      opacity={isMyTurn || isMatched ? 1 : 0.6}
      transition="all 0.3s ease"
      _hover={{
        transform: isMyTurn && !isMatched ? "scale(1.05)" : "none",
        boxShadow: isMyTurn && !isMatched ? "lg" : "none",
      }}
    >
      <Box
        position="absolute"
        width="100%"
        height="100%"
        transform={shouldShowContent ? "rotateY(180deg)" : "rotateY(0deg)"}
        transformStyle="preserve-3d"
        transition="transform 0.6s"
        style={{
          perspective: "1000px",
        }}
      >
        {/* Frente de la carta (pregunta) */}
        <Box
          position="absolute"
          width="100%"
          height="100%"
          backfaceVisibility="hidden"
          backgroundColor="blue.500"
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="4xl"
          color="white"
          boxShadow="md"
          zIndex={shouldShowContent ? 1 : 2}
        >
          ?
        </Box>

        {/* Reverso de la carta (emoji) */}
        <Box
          position="absolute"
          width="100%"
          height="100%"
          backfaceVisibility="hidden"
          backgroundColor={isMatched ? "green.100" : "white"}
          border={isMatched ? "2px solid" : "none"}
          borderColor={isMatched ? "green.500" : "transparent"}
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="4xl"
          transform="rotateY(180deg)"
          boxShadow="md"
          zIndex={shouldShowContent ? 2 : 1}
        >
          {card.card_type}
        </Box>
      </Box>
    </Box>
  );
}

export default Card;
