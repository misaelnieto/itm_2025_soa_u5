import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/juegos/pokemon/leaderboard')({
  component: () => <div>Hello /juegos/pokemon/leaderboard!</div>
})