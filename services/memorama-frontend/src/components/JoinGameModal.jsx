import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";

function JoinGameModal({ isOpen, onJoin }) {
  const [playerName, setPlayerName] = useState("");
  const [gameId, setGameId] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const handleCreateGame = (e) => {
    e.preventDefault();
    if (!playerName || playerName.trim() === "") {
      return;
    }
    onJoin(null, playerName.trim());
    setPlayerName("");
  };

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (
      !playerName ||
      playerName.trim() === "" ||
      !gameId ||
      gameId.trim() === ""
    ) {
      return;
    }
    onJoin(gameId.trim(), playerName.trim());
    setPlayerName("");
    setGameId("");
  };

  return (
    isOpen && (
      <main>
        <Tabs onChange={(index) => setActiveTab(index)}>
          <TabList>
            <Tab>Crear Juego</Tab>
            <Tab>Unirse a Juego</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Tu Nombre</FormLabel>
                  <Input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Ingresa tu nombre"
                    autoFocus
                  />
                </FormControl>
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Tu Nombre</FormLabel>
                  <Input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Ingresa tu nombre"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>ID del Juego</FormLabel>
                  <Input
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    placeholder="Ingresa el ID del juego"
                  />
                </FormControl>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
        {activeTab === 0 ? (
          <Button colorScheme="blue" onClick={handleCreateGame}>
            Crear Juego
          </Button>
        ) : (
          <Button colorScheme="blue" onClick={handleJoinGame}>
            Unirse al Juego
          </Button>
        )}
      </main>
    )
  );
}

export default JoinGameModal;
