import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/juegos/ajedrez/leaderboard')({
  component: () => <div>Hello /juegos/ajedrez/leaderboard!</div>
})