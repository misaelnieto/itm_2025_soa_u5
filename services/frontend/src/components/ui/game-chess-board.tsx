import { Container, Text, Box } from "@chakra-ui/react";
import React from "react";
import { Chessboard } from "react-chessboard";

export const GameChessBoard: React.FC = () => {
  return (
    <Container maxW="container.md" py={4}>
      <Text mb={4}>Test</Text>
      <Box width="100%" maxW="600px" mx="auto">
        <Chessboard 
          id="chessboard"
          boardWidth={600}
          position="start"
          customBoardStyle={{
            borderRadius: "4px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)"
          }}
          customDarkSquareStyle={{
            backgroundColor: "rgb(13, 148, 136)"
          }}
          customLightSquareStyle={{
            backgroundColor: "rgb(237, 238, 209)"
          }}
        />
      </Box>
    </Container>
  );
};

