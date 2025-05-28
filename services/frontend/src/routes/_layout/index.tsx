import GameCard from "@/components/ui/game-card"
import { Box, Container, Text } from "@chakra-ui/react"
import { Flex } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { FaChess } from "react-icons/fa"
import { FaBullseye } from "react-icons/fa";

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
            avatarSrc={FaBullseye}
            fallbackName="Picas y fijas"
            title="Picas y fijas"
            description="Juega una partida de picas y fijas contra otro usuario"
            gameRoute="/juegos/picas"
            leaderboardRoute="/juegos/picas/leaderboard.html"
          />
        </Flex>
      </Container>

    </Flex>
  )
}
