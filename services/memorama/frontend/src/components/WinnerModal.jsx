import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack,
} from "@chakra-ui/react";
import Confetti from "react-confetti";

function WinnerModal({
  isOpen,
  onClose,
  winner,
  onResetGame,
  onCreateNewGame,
}) {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Si no hay ganador, no mostrar el modal
  if (!winner) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign="center">Juego finalizado</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <Text fontSize="xl" fontWeight="bold">
              ¡{winner.name} ha ganado el juego!
            </Text>
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              recycle={false}
              numberOfPieces={200}
            />
          </VStack>
        </ModalBody>
        <ModalFooter justifyContent="center" gap={4}>
          <Button colorScheme="blue" onClick={onResetGame}>
            Reiniciar Juego
          </Button>
          <Button colorScheme="green" onClick={onCreateNewGame}>
            Crear Nuevo Juego
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default WinnerModal;
