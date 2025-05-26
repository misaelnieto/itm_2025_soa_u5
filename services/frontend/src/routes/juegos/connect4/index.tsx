import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Box, Button, ButtonGroup, Container, Steps } from "@chakra-ui/react"
import Navbar from "@/components/Common/Navbar"
import useAuth from "@/hooks/useAuth"

const steps = [
  {
    title: "Salas disponibles",
    description: "Buscando partidas activas...",
  },
  {
    title: "Cargando partida",
    description: "Uniéndose a la partida",
  },
  {
    title: "Juego en curso",
    description: "¡A jugar!",
  },
]

function Connect4() {
  const { user: currentUser } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  return (
    <Container h="100vh" maxW="container.lg">
      <Navbar />      <iframe 
        src="/api/connect4-service"
        style={{
          width: "100%",
          height: "calc(100vh - 100px)",
          border: "none",
          borderRadius: "8px",
          marginTop: "1rem",
          backgroundColor: "white",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          aspectRatio: "4/3"
        }}
      />
    </Container>
  )
}

export const Route = createFileRoute("/juegos/connect4/")({
  component: Connect4,
})
