import Navbar from "@/components/Common/Navbar"
import { GameCard } from "@/components/ui/game-card"
import { Box, Container, Text } from "@chakra-ui/react"
import { Flex } from "@chakra-ui/react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { FaChess } from "react-icons/fa"

import useAuth, { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/juegos/")({
  component: GamesDashboard,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function GamesDashboard() {
  const { user: currentUser } = useAuth()

  return (
    <Flex direction="column" h="100vh">
      <Navbar />
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
        </Flex>
      </Container>
    </Flex>
  )
}
