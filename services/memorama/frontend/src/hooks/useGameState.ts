import { useState, useEffect, useCallback } from 'react'
import { CardType, GameStatus } from '../types/game'

// Símbolos para las cartas (emojis)
const CARD_SYMBOLS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐮', '🐷']

export const useGameState = () => {
    const [cards, setCards] = useState<CardType[]>([])
    const [flippedCards, setFlippedCards] = useState<number[]>([])
    const [matchedCards, setMatchedCards] = useState<string[]>([])
    const [score, setScore] = useState(0)
    const [gameStatus, setGameStatus] = useState<GameStatus>('waiting')

    // Función para crear un nuevo juego
    const startNewGame = useCallback(() => {
        // Crear un array con pares de símbolos
        const symbols = [...CARD_SYMBOLS].slice(0, 6) // Usar 6 símbolos (12 cartas en total)
        const cardPairs = [...symbols, ...symbols]

        // Barajar las cartas
        const shuffledCards = cardPairs
            .sort(() => Math.random() - 0.5)
            .map((symbol, index) => ({
                id: index,
                card_type: symbol,
                position: index
            }))

        setCards(shuffledCards)
        setFlippedCards([])
        setMatchedCards([])
        setScore(0)
        setGameStatus('in_progress')
    }, [])

    // Función para reiniciar el juego
    const resetGame = useCallback(() => {
        setFlippedCards([])
        setMatchedCards([])
        setScore(0)
        setGameStatus('waiting')
        setCards([])
    }, [])

    // Función para manejar el clic en una carta
    const handleCardClick = useCallback((card: CardType) => {
        // Si ya hay 2 cartas volteadas, no hacer nada
        if (flippedCards.length === 2) return

        // Si la carta ya está volteada, no hacer nada
        if (flippedCards.includes(card.id)) return

        // Si la carta ya está emparejada, no hacer nada
        if (matchedCards.includes(card.card_type)) return

        // Voltear la carta
        setFlippedCards(prev => [...prev, card.id])

        // Si es la primera carta, solo voltearla
        if (flippedCards.length === 0) return

        // Si es la segunda carta, comprobar si hay coincidencia
        const firstCardId = flippedCards[0]
        const firstCard = cards.find(c => c.id === firstCardId)!

        // Si hay coincidencia
        if (firstCard.card_type === card.card_type) {
            // Añadir a las cartas emparejadas
            setMatchedCards(prev => [...prev, card.card_type])
            // Incrementar la puntuación
            setScore(prev => prev + 10)
            // Limpiar las cartas volteadas
            setTimeout(() => {
                setFlippedCards([])
            }, 1000)
        } else {
            // Si no hay coincidencia, voltear las cartas de nuevo después de un tiempo
            setTimeout(() => {
                setFlippedCards([])
                // Decrementar la puntuación (mínimo 0)
                setScore(prev => Math.max(0, prev - 1))
            }, 1000)
        }
    }, [flippedCards, matchedCards, cards])

    // Comprobar si el juego ha terminado
    useEffect(() => {
        if (gameStatus === 'in_progress' && matchedCards.length > 0 && matchedCards.length === CARD_SYMBOLS.slice(0, 6).length) {
            setGameStatus('completed')
        }
    }, [matchedCards, gameStatus])

    return {
        cards,
        flippedCards,
        matchedCards,
        score,
        gameStatus,
        handleCardClick,
        startNewGame,
        resetGame
    }
}
