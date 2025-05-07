import { createFileRoute } from '@tanstack/react-router'
import Navbar from "@/components/Common/Navbar"
import { Button, ButtonGroup, Container, Steps } from "@chakra-ui/react"
import { GameSessions } from "@/components/ui/game-sessions"
import { NoPlayers, OnlinePlayers, WaitingForPlayer } from "@/components/ui/game-players"
import { GameChessBoard } from "@/components/ui/game-chess-board"
export const Route = createFileRoute('/juegos/ajedrez/')({
  component: GameState
})

const steps = [
    {
      title: "Juegos activos",
      description: "Buscando partidas activas...",
    },
    {
      title: "Cargando partida",
      description: "Uniendose a la partida",
    },
    {
      title: "Juego en curso",
      description: "A jugar!",
    },
  ]

const sessions = [
  {
    id: "1",
    date: "2024-01-01",
  },
  {
    id: "2",
    date: "2024-01-02",
  },
  {
    id: "3",
    date: "2024-01-03",
  },
]

const players = [
  {
    id: "1",
    name: "John Doe",
    avatarUrl: "https://via.placeholder.com/150",
  },
  {
    id: "2",
    name: "Jane Doe",
    avatarUrl: "https://via.placeholder.com/150",
  },
  
]


function GameState () {
  return (
    <Container h="100vh">
        <Navbar />
        <Steps.Root defaultStep={1} count={3}>
        <Steps.List>
            {steps.map((step, index) => (
            <Steps.Item key={index} index={index} title={step.title}>
                <Steps.Indicator />
                <Steps.Title>{step.title}</Steps.Title>
                <Steps.Separator />
            </Steps.Item>
            ))}
        </Steps.List>

        <Steps.Content index={0}>
            <OnlinePlayers players={players} onInvitePlayer={() => {console.log("inviting player")}} />
            <NoPlayers />
            <GameSessions sessions={sessions} onJoinSession={() => {console.log("joining session")}} />
        </Steps.Content>
        <Steps.Content index={1}>
            <WaitingForPlayer player={players[0]} />
        </Steps.Content>
        <Steps.Content index={2}>
            <GameChessBoard />
        </Steps.Content>
        <Steps.CompletedContent>All steps are complete!</Steps.CompletedContent>

        <ButtonGroup size="sm" variant="outline">
            <Steps.PrevTrigger asChild>
            <Button>Prev</Button>
            </Steps.PrevTrigger>
            <Steps.NextTrigger asChild>
            <Button>Next</Button>
            </Steps.NextTrigger>
        </ButtonGroup>
        </Steps.Root>
    </Container>
  )
}


