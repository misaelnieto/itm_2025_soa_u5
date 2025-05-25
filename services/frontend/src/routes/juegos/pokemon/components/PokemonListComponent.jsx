import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'

function PokemonListComponent({ handleNextStep, pokemon }) {
  const [pokemons, setPokemons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedPokemon, setSelectedPokemon] = useState(pokemon)
  useEffect(() => {
    const fetchPokemons = async () => {
      try {
        const response = await fetch('/api/pokemon-service/pokemons')
        // const response = await fetch('http://127.0.0.1:8083/api/pokemon-service/pokemons')

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        setPokemons(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching pokemon data:', error)
        setError(error.message)
        setLoading(false)
      }
    }
    fetchPokemons()
  }, [])
  const handlePokemonClick = (pokemon) => {
    setSelectedPokemon(pokemon)
    console.log('Pokemon clicked:', pokemon)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      borderRadius: '12px',
      marginTop: '20px',
      gap: '25px',
    }}>

      <h1 style={{ fontWeight: 'bold', fontSize: '32px' }}>Selecciona tu Pokémon</h1>
      {loading && <p>Cargando Pokémon...</p>}
      {error && <p>Error: {error}</p>}
      {!loading && !error && (
        <ul style={
          {
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }
        }>
          {pokemons.map((pokemon) => (
            <li key={pokemon._id}
              onClick={() => handlePokemonClick(pokemon)}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                e.currentTarget.style.transform = 'none';
              }} style={
                {
                  listStyle: 'none',
                  border: '1px solid #ccc',
                  borderRadius: '12px',
                  padding: '10px',
                  textAlign: 'center',
                  width: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  backgroundColor: selectedPokemon?._id === pokemon._id ? '#8cff94' : '#fff',
                }}>
              <h2>{pokemon.name}</h2>
              <img src={pokemon.image} alt={pokemon.name} />
              <p>Tipo: {pokemon.type.primary} {pokemon.type.secondary && `/${pokemon.type.secondary}`}</p>
              <p>HP: {pokemon.stats.hp}</p>
              <p>Ataque: {pokemon.stats.attack}</p>
              <p>Defensa: {pokemon.stats.defense}</p>
              <p>Ataque especial: {pokemon.stats.specialAttack}</p>
              <p>Defensa especial: {pokemon.stats.specialDefense}</p>
              <p>Velocidad: {pokemon.stats.speed}</p>
            </li>
          ))}
        </ul>
      )}
      {
        selectedPokemon && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              style={{
                padding: '10px 24px',
                fontSize: '18px',
                borderRadius: '8px',
                backgroundColor: '#1976d2',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background 0.2s'
              }}
              onClick={() => {
                  handleNextStep(selectedPokemon)
              }}
            >
              Seleccionar Pokemon
            </button>
          </div>
        )
      }
    </div>
  )
}

export default PokemonListComponent

export const Route = createFileRoute('/juegos/pokemon/components/PokemonListComponent')({
  component: PokemonListComponent
})
