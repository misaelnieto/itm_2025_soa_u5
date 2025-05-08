import {
  Avatar,
  Button,
  EmptyState,
  HStack,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import type React from "react"

export const NoPlayers: React.FC = () => {
  return (
    <EmptyState.Root>
      <EmptyState.Content>
        <EmptyState.Indicator>
          <Spinner
            size="xl"
            color="green.300"
            borderWidth="4px"
            animationDuration="1.5s"
          />
        </EmptyState.Indicator>
        <VStack textAlign="center">
          <EmptyState.Title>
            No hay jugadores para esta partida
          </EmptyState.Title>
          <EmptyState.Description>
            Por favor, espera a que otro jugador se una a la partida.
          </EmptyState.Description>
        </VStack>
      </EmptyState.Content>
    </EmptyState.Root>
  )
}

export const WaitingForPlayer: React.FC<{ player: Player }> = ({ player }) => {
  return (
    <EmptyState.Root>
      <EmptyState.Content>
        <EmptyState.Indicator>
          <Spinner
            size="xl"
            color="green.300"
            borderWidth="4px"
            animationDuration="1.5s"
          />
        </EmptyState.Indicator>
        <VStack textAlign="center">
          <EmptyState.Title>Esperando a tu contrincante</EmptyState.Title>
          <VStack>
            <HStack justify="center">
              <Avatar.Root>
                <Avatar.Image src={player.avatarUrl} />
                <Avatar.Fallback>{player.name.charAt(0)}</Avatar.Fallback>
              </Avatar.Root>
              <Text>{player.name}</Text>
            </HStack>
            <Text>
              Por favor, espera a que {player.name} se una a la partida.
            </Text>
          </VStack>
        </VStack>
      </EmptyState.Content>
    </EmptyState.Root>
  )
}

export interface Player {
  id: string
  name: string
  avatarUrl?: string
}

interface OnlinePlayersProps {
  players: Player[]
  onInvitePlayer: (playerId: string) => void
}

export const OnlinePlayers: React.FC<OnlinePlayersProps> = ({
  players,
  onInvitePlayer,
}) => {
  return (
    <Stack gap={4}>
      {players.map((player) => (
        <HStack
          key={player.id}
          gap={4}
          p={2}
          borderWidth="1px"
          borderRadius="md"
        >
          <Avatar.Root>
            <Avatar.Image src={player.avatarUrl} />
            <Avatar.Fallback>{player.name.charAt(0)}</Avatar.Fallback>
          </Avatar.Root>
          <Stack gap={0}>
            <Text fontWeight="medium">{player.name}</Text>
          </Stack>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={() => onInvitePlayer(player.id)}
          >
            Invitar
          </Button>
        </HStack>
      ))}
    </Stack>
  )
}
