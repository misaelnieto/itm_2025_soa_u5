import GameCard from "@/components/ui/game-card"
import { Box, Container, Text } from "@chakra-ui/react"
import { Flex } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { FaBowlingBall, FaChess } from "react-icons/fa"
import { IoGameController } from "react-icons/io5"

import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function Dashboard() {
  const { user: currentUser } = useAuth()

  return (
    <Flex direction="column" h="100vh">
      <Container maxW="full" centerContent>
        <Box pt={12} m={4}>
          <Text fontSize="2xl" truncate maxW="sm">
            Hola, {currentUser?.user_id} 👋🏼
          </Text>
          <Text>Estos son los juegos disponibles!</Text>
        </Box>
        <Flex gap="4" wrap="wrap" maxW="500px">
          <GameCard
            avatarSrc={FaChess}
            fallbackName="Ajedrez"
            title="Ajedrez"
            description="Juega una partida de ajedrez contra los demás usarios."
            gameRoute="/juegos/ajedrez"
            leaderboardRoute="/juegos/ajedrez/leaderboard"
          />          
          <GameCard            
            avatarSrc={IoGameController}
            fallbackName="Connect4"
            title="Connect 4"            
            description="Juega al clásico juego de Conecta 4 contra otros jugadores."
            gameRoute="/juegos/connect4"
            leaderboardRoute="/juegos/connect4/leaderboard"
          />
        </Flex>
      </Container>

    </Flex>
  )
}
