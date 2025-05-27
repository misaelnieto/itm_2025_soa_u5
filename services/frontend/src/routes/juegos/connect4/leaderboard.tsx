import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import {
  Box,
  Center,
} from "@chakra-ui/react"

export const Route = createFileRoute("/juegos/connect4/leaderboard")({
  component: Leaderboard,
})

type Player = {
  username: string
  wins: number
  losses: number
  matches: number
  winRate: string
  streakCount?: number
  rank: number
  avatarColor: string
  badge: string
}

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  console.log(leaderboardData);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/connect4-service/leaderboard")
        const data = await response.json()
        
        const enhancedData = data.map((player: any, index: any) => ({
          ...player,
          rank: index + 1,
          avatarColor: index === 0 ? "yellow.400" : index === 1 ? "gray.400" : "orange.400",
          badge: index === 0 ? "Campeón" : index === 1 ? "Subcampeón" : "Retador"
        }))

        setLeaderboardData(enhancedData)
      } catch (error) {
        console.error("Error fetching leaderboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Center h="500px">
        {/* <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" speed="0.65s" />
          <Text fontSize="lg">Cargando tabla de posiciones...</Text>
        </VStack> */}
      </Center>
    )
  }

  return (
    <Box p={6}>
      {/* <Card.Root shadow="xl" rounded="lg" overflow="hidden" borderWidth="1px">
        <CardHeader py={4} px={6} color="white" borderBottomWidth="1px">
          <Flex justify="space-between" align="center">
            <Button variant="ghost" colorScheme="blue" size="sm" onClick={() => window.history.go(-1)}>
              <Icon as={GiBattleGear} w={4} h={4} />
              <Text ml={2}>Regresar</Text>
            </Button>
            <HStack>
              <Icon as={GiTrophyCup} w={8} h={8} />
              <Heading size="lg">Tabla de Posiciones - Connect4</Heading>
            </HStack>
            <Badge colorScheme="yellow" p={2} borderRadius="md" fontSize="sm">
              Temporada 2025
            </Badge>
          </Flex>
        </CardHeader>

        <CardBody p={0}>
          <Table.Root variant="simple" size="lg">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader textAlign="center" width="80px">Rank</Table.ColumnHeader>
                <Table.ColumnHeader>Jugador</Table.ColumnHeader>
                <Table.ColumnHeader>Partidas ganadas</Table.ColumnHeader>
                <Table.ColumnHeader>Partidas Perdidas</Table.ColumnHeader>
                <Table.ColumnHeader>Partidas totales</Table.ColumnHeader>
                <Table.ColumnHeader>Porcentaje</Table.ColumnHeader>
                <Table.ColumnHeader>Rachas</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {leaderboardData.map((player) => (
                <Table.Row key={player.username}>
                  <Table.Cell textAlign="center">
                    {player.rank === 1 ? (
                      <Icon as={FaTrophy} color="yellow.400" w={6} h={6} />
                    ) : player.rank === 2 ? (
                      <Icon as={FaTrophy} color="gray.400" w={6} h={6} />
                    ) : player.rank === 3 ? (
                      <Icon as={FaTrophy} color="orange.400" w={6} h={6} />
                    ) : (
                      <Text fontWeight="bold">{player.rank}</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <HStack spacing={3}>
                      <Avatar.Root size="md" bg={player.avatarColor} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="md">
                          {player.username}
                        </Text>
                        <Badge size="sm" colorScheme={player.rank === 1 ? "yellow" : "blue"}>
                          {player.badge}
                        </Badge>
                      </VStack>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell isNumeric fontWeight="bold" color="green.500">
                    {player.wins}
                  </Table.Cell>
                  <Table.Cell isNumeric fontWeight="bold" color="red.500">
                    {player.losses}
                  </Table.Cell>
                  <Table.Cell isNumeric fontWeight="bold">
                    {player.matches}
                  </Table.Cell>
                  <Table.Cell isNumeric>
                    <Badge
                      colorScheme={
                        parseFloat(player.winRate) > 60 ? "green" :
                        parseFloat(player.winRate) > 40 ? "blue" : "red"
                      }
                      p={2}
                      borderRadius="md"
                      fontSize="sm"
                    >
                      {player.winRate}%
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <VStack spacing={2} align="start">
                      <Progress.Root
                        value={parseFloat(player.winRate)}
                        colorScheme={
                          parseFloat(player.winRate) > 60 ? "green" :
                          parseFloat(player.winRate) > 40 ? "blue" : "red"
                        }
                        size="sm"
                        width="100%"
                        borderRadius="md"
                      />
                      <HStack spacing={2}>
                        <Icon as={FaFire} color="orange.500" />
                        <Text fontSize="xs" color="gray.500">
                          {player.streakCount || 0} Racha
                        </Text>
                      </HStack>
                    </VStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </CardBody>
      </Card.Root> */}
    </Box>
  )
}
