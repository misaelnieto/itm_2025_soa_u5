import Navbar from "@/components/Common/Navbar"
import { useState, useRef, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button, Container, Steps, IconButton, Box } from "@chakra-ui/react"
import { Tooltip as ChakraTooltip } from "@chakra-ui/react"

import useAuth from "@/hooks/useAuth"
import PokemonListComponent from "./components/PokemonListComponent"
import FindingMatchComponent from "./components/FindingMatchComponent"
import BattleComponent from "./components/BattleComponent"
import backgroundMusic from "./assets/music/background-music.mp3"
import battleMusic from "./assets/music/pokemon-battle.mp3"

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

  const [musicState, setMusicState] = useState({
    playing: true,
    volume: 0.5,
    currentTrack: 'background'
  })

  const backgroundMusicRef = useRef(null);
  const battleMusicRef = useRef(null);

  const getCurrentMusicRef = () => {
    return musicState.currentTrack === 'background' ? backgroundMusicRef : battleMusicRef;
  };

  // Handle music toggle
  const toggleMusic = () => {
    const currentRef = getCurrentMusicRef();

    if (currentRef.current) {
      if (musicState.playing) {
        currentRef.current.pause();
      } else {
        currentRef.current.play().catch(error => {
          console.log('Play prevented:', error);
        });
      }

      setMusicState(prev => ({ ...prev, playing: !prev.playing }));
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setMusicState(prev => ({ ...prev, volume: newVolume }));

    // Update volume for both audio elements
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = newVolume;
    }

    if (battleMusicRef.current) {
      battleMusicRef.current.volume = newVolume;
    }
  };

  // Switch track based on game step
  useEffect(() => {
    if (backgroundMusicRef.current) backgroundMusicRef.current.pause();
    if (battleMusicRef.current) battleMusicRef.current.pause();

    const newTrack = currentStep === 2 ? 'battle' : 'background';
    const currentRef = newTrack === 'background' ? backgroundMusicRef : battleMusicRef;

    setMusicState(prev => ({ ...prev, currentTrack: newTrack }));

    if (musicState.playing && currentRef.current) {
      currentRef.current.volume = musicState.volume;
      currentRef.current.currentTime = 0; // Reset to beginning
      currentRef.current.play().catch(error => {
        console.log('Autoplay prevented:', error);
        setMusicState(prev => ({ ...prev, playing: false }));
      });
    }
  }, [currentStep]);

  useEffect(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = musicState.volume;

      if (musicState.playing && currentStep !== 2) {
        backgroundMusicRef.current.play().catch(error => {
          console.log('Autoplay prevented:', error);
          setMusicState(prev => ({ ...prev, playing: false }));
        });
      }
    }

    if (battleMusicRef.current) {
      battleMusicRef.current.volume = musicState.volume;
    }

    return () => {
      if (backgroundMusicRef.current) backgroundMusicRef.current.pause();
      if (battleMusicRef.current) battleMusicRef.current.pause();
    };
  }, []);

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

  return (
    <Container h='100vh'>
      <Navbar />
      {/* Audio Elements */}
      <audio
        ref={backgroundMusicRef}
        loop
        preload="auto"
        src={backgroundMusic}
        style={{ display: 'none' }}
      />
      <audio
        ref={battleMusicRef}
        loop
        preload="auto"
        src={battleMusic}
        style={{ display: 'none' }}
      />
      {/* Music Controls */}
      <Box
        position="fixed"
        bottom="5%"
        right="2%"
        zIndex={1000}
        display="flex"
        alignItems="center"
        bg="rgba(0, 0, 0, 0.6)"
        padding="5px 10px"
        borderRadius="20px"
        gap="10px"
      >
        <ChakraTooltip.Root label={musicState.playing ? "Pausar música" : "Reproducir música"}>
          <IconButton
            aria-label={musicState.playing ? "Pausar música" : "Reproducir música"}
            onClick={toggleMusic}
            size="sm"
            borderRadius="full"
            bg={musicState.playing ? "red.500" : "green.500"}
            _hover={{ bg: musicState.playing ? "red.600" : "green.600" }}
          >
            {musicState.playing ? '⏸' : '▶'}
          </IconButton>
        </ChakraTooltip.Root>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={musicState.volume}
          onChange={handleVolumeChange}
          style={{
            width: '80px',
            accentColor: '#3182CE'
          }}
        />
      </Box>

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
