import Navbar from "@/components/Common/Navbar"
import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button, ButtonGroup, Container, Steps } from "@chakra-ui/react"
import useAuth from "@/hooks/useAuth"
import PokemonListComponent from "./components/PokemonListComponent"
import FindingMatchComponent from "./components/FindingMatchComponent"
import BattleComponent from "./components/BattleComponent"

const steps = [
  {
    title: "Selecciona tu pokemon",
    description: "",
  },
  {
    title: "Buscando oponente",
    description: "Esperando a que otro jugador se una",
  },
  {
    title: "Juego en curso",
    description: "A jugar!",
  },
]


function Pokemon() {
  const { user, logout } = useAuth()
  const [selectedPokemon, setSelectedPokemon] = useState(null)
  const [isLookingForMatch, setIsLookingForMatch] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [battleData, setBattleData] = useState(null)

  // Handle step transitions
  const handleNextStep = (step, data) => {
    if (step === 'battle' && data) {
      console.log(step, data)
      setBattleData(data)
      setCurrentStep(2) // Move to battle step
    } else if (step === 'selection') {
      setBattleData(null)
      setSelectedPokemon(null)
      setCurrentStep(0) // Back to selection step
    }
    setIsLookingForMatch(false)
  }

  console.log(user)
  return (
    <Container h='100vh'>
      <Navbar />
      <Steps.Root count={3} colorPalette={"blue"} step={currentStep}>
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
          <PokemonListComponent
            handleNextStep={(pokemon) => {
              setSelectedPokemon(pokemon)
            }}
            pokemon={selectedPokemon}
          />
          {selectedPokemon && (
            <Button
              colorScheme="blue"
              onClick={() => {
                setCurrentStep(1)
                setIsLookingForMatch(true)
              }}
            >
              Siguiente
            </Button>)}
        </Steps.Content>
        <Steps.Content index={1}>
          <FindingMatchComponent
            selectedPokemon={selectedPokemon}
            username={user?.user_id}
            isLookingForMatch={isLookingForMatch}
            handleNextStep={handleNextStep}
          />
          <Steps.PrevTrigger>
            <Button
              color="gray"
              onClick={() => {
                setCurrentStep(0)
                setIsLookingForMatch(false)
              }}
            >
              Cancelar
            </Button>
          </Steps.PrevTrigger>
        </Steps.Content>
        <Steps.Content index={2}>
          <BattleComponent
            selectedPokemon={selectedPokemon}
            battleData={battleData}
            username={user?.user_id}
            handleNextStep={handleNextStep}
          />
          <Steps.PrevTrigger>
            <Button
              color="gray"
              onClick={() => {
                setIsLookingForMatch(false)
              }}
            >
              Cancelar
            </Button>
          </Steps.PrevTrigger>
        </Steps.Content>
      </Steps.Root>
    </Container>
  )
}

export const Route = createFileRoute('/juegos/pokemon/')({
  component: Pokemon
})
