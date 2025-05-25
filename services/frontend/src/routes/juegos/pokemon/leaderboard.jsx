import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Text,
  Badge,
  Flex,
  Card,
  CardHeader,
  CardBody,
  Spinner,
  Image,
  Avatar,
  HStack,
  VStack,
  Progress,
  Icon,
  Center,
  Button,
} from '@chakra-ui/react';
import { FaTrophy, FaFire, FaUserNinja, FaChartLine } from 'react-icons/fa';
import { GiPokecog, GiBattleGear, GiTrophyCup } from 'react-icons/gi';

export const Route = createFileRoute('/juegos/pokemon/leaderboard')({
  component: Leaderboard
});

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data for development - replace with actual API call
  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true);
      try {
        // In a real app, replace this with your actual API call
        const response = await fetch('/api/pokemon-service/leaderboard')
        // const response = await fetch('http://127.0.0.1:8084/api/stats/leaderboard')
        const data = await response.json();

        // Add random avatars and additional mock data for visual variety
        const enhancedData = data.map((player, index) => ({
          ...player,
          rank: index + 1,
          avatarColor: index === 0 ? 'yellow.400' : index === 1 ? 'gray.400' : 'orange.400',
          badge: index === 0 ? 'Lider de Gimnasio' : index === 1 ? 'Maestro pokemon' : 'Entrenador pokemon',
          streakCount: Math.floor(Math.random() * 5),
          lastActive: '2h ago'
        }));

        setLeaderboardData(enhancedData);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Center h="500px">
        <VStack spacing={4}>
          <Spinner size="xl" color="red.500" thickness="4px" speed="0.65s" />
          <Text fontSize="lg">Loading Pokémon Trainers...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={6}>
      <Card.Root
        shadow="xl"
        rounded="lg"
        overflow="hidden"
        borderWidth="1px"
      >
        <CardHeader
          py={4}
          px={6}
          color="white"
          borderBottomWidth="1px"
        >
          <Flex justify="space-between" align="center">
            <Button variant="ghost" colorScheme="blue" size="sm" onClick={() => window.history.go(-1)}>
              <Icon as={GiBattleGear} w={4} h={4} />
              <Text ml={2}>Regresar</Text>
            </Button>
            <HStack>
              <Icon as={GiTrophyCup} w={8} h={8} />
              <Heading size="lg">Pokémon Trainers Leaderboard</Heading>
            </HStack>
            <Badge colorScheme="yellow" p={2} borderRadius="md" fontSize="sm">
              Temporada 2025
            </Badge>
          </Flex>
        </CardHeader>

        <CardBody p={0}>
          <Table.Root variant="simple" size="lg">
            <Table.Header >
              <Table.Row>
                <Table.ColumnHeader textAlign="center" width="80px">Rank</Table.ColumnHeader>
                <Table.ColumnHeader>Entrenador</Table.ColumnHeader>
                <Table.ColumnHeader isNumeric>Partidas ganadas</Table.ColumnHeader>
                <Table.ColumnHeader isNumeric>Partidas Perdidas</Table.ColumnHeader>
                <Table.ColumnHeader isNumeric>Partidas totales</Table.ColumnHeader>
                <Table.ColumnHeader isNumeric>Porcentaje</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {leaderboardData.map((player) => (
                <Table.Row
                  key={player.username}
                  transition="all 0.2s"
                >
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
                      <Avatar.Root
                        size="md"
                        name={player.username}
                        bg={player.avatarColor}
                        icon={<Icon as={GiPokecog} fontSize="1.5rem" />}
                      />
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
                      {player.winRate}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </CardBody>
      </Card.Root>
    </Box>
  );
}