export type GameStatus = 'waiting' | 'in_progress' | 'completed';

export interface CardType {
    id: number;
    card_type: string;
    position: number;
}

export interface Player {
    id: number;
    name: string;
    score: number;
}

export interface Game {
    id: number;
    name: string;
    status: GameStatus;
    current_player?: number;
    winner?: number;
    players: Player[];
    cards: CardType[];
}
