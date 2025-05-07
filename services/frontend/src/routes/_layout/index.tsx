import { Box, Container, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { Flex } from "@chakra-ui/react"
import GameCard from "@/components/Dashboard/GameCard";
import { FaChess } from "react-icons/fa";

import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function Dashboard() {
  const { user: currentUser } = useAuth()

  return (
    <>
      <Container maxW="full">
        <Box pt={12} m={4}>
          <Text fontSize="2xl" truncate maxW="sm">
            Hola, {currentUser?.full_name || currentUser?.email} 👋🏼
          </Text>
          <Text>Estos son los juegos disponibles!</Text>
        </Box>
      </Container>

      <Flex gap="4" wrap="wrap" maxW="500px">
        <GameCard
            avatarSrc={FaChess}
            fallbackName="Ajedrez"
            title="Ajedrez"
            description="Juega una partida de ajedrez contra los demás usarios."
          />
      </Flex>
    </>
  )
}
