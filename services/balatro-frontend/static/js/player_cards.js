import { scoreHand } from './score_handler.js';

let socket;
let userName = null;
let sortBy = 'rank'; // Default sort by rank

const token = localStorage.getItem('access_token');

function fetchUserName(){
    fetch('http://itm-soa.io/api/usuarios/test-token', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
    .then(response => response.json())
    .then(data => {
        console.log(data);
        userName = data.user_id;

        socket = io('localhost:8088', {
            path: '/juegos/balatro-backend/socket.io',
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            forceNew: true,
            upgrade: true,
            rememberUpgrade: true,
            autoConnect: true,
            auth: {
                name: userName
            }
        });

        socket.on('connect', () => {
            console.log("Connected! My SID:", socket.id);
            console.log("Transport:", socket.io.engine.transport.name);
        });

        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            console.error('Error details:', {
                message: error.message,
                description: error.description,
                type: error.type,
                context: error
            });
        });

        socket.on('connect_timeout', (timeout) => {
            console.error('Connection timeout:', timeout);
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
            console.log('Reconnection attempt:', attemptNumber);
        });

        socket.on('reconnect_failed', () => {
            console.error('Failed to reconnect');
        });

        socket.on('connect', () => {
            sid = socket.id;
            console.log("Mi SID: " + sid);
        });

        socket.on('update_turn', (data) => {
            opponent.textContent = `It's player ${data.current_turn}'s turn`;
        });
        socket.on('game_over', (data) => {
            let leaderboard = document.getElementById('leaderboard-button-img');
            leaderboard.hidden = false;
            if (data.win == 0) {
                image_final.src = lose;
            }

            if (data.win == 1) {
                image_final.src = win;
            }

            if (data.win == 2) {
                image_final.src = tie;
            }

            h2_final.textContent = data.score;

            final.style.display = 'inline-block';

            leaderboard.style.display = 'flex';
        });
        socket.on('matched', (data) => {

        window.playerHand = data.player_hand;
        window.last_score = window.score;


        loadingScreen.remove();
        console.log(`Matched!! loading the room ${data.room}`);
        // Before loading cards, we should wait for someone

        loadCards();
    });
        // Now socket has the correct auth from the start
    })
    .catch(error => console.error('Error:', error));


}


let sid = null;
let turn = 1;
let proceed_playHand = false;
let win = "https://media.istockphoto.com/id/1447471637/video/you-win-glitch-4k-video-animation-footage-pixel-message-design-glitch-effect.jpg?s=640x640&k=20&c=JGgJOzzgHAWu33tEMYl-yghunxslgkdZGDHbqCB8KNA=";
let lose = "https://motionarray.imgix.net/motion-array-3081970-Ib6GvahUCf-high_0014.jpg?w=660&q=60&fit=max&auto=format"
let tie = "https://media.tenor.com/wyfhYqF1tJIAAAAe/mark-wahlberg-wahlberg.png";


let loadingScreen = document.getElementsByClassName('loadingScreen')[0];
let opponent = document.getElementsByClassName('opponent')[0];
let stop_notification = document.getElementsByClassName('stop')[0];
let final = document.getElementsByClassName('game_over')[0];
let image_final = document.getElementsByClassName('final-i')[0];
let h2_final = document.getElementsByClassName('final-h2')[0];
let leaderboard = document.getElementsByClassName('leaderboard-button')[0];


let availableIndices = []; 
let selectedCardsTags = []; 
let selectedCards = [];


const cardRank = {
    'A': 14,
    'K': 13,
    'Q': 12,
    'J': 11,
    'T': 10,
    '9': 9,
    '8': 8,
    '7': 7,
    '6': 6,
    '5': 5,
    '4': 4,
    '3': 3,
    '2': 2
};


// This functions is running at the beggin
document.addEventListener('DOMContentLoaded', function () {
    setupSortButtons();
    document.getElementById("play-hand-btn").addEventListener('click', async () => {
        await playHand();
    });
    document.getElementById("discard-cards-btn").addEventListener('click', async () => {
        await discardCards();
        //await drawCardsForP1();
    });

    document.getElementById("player-name").textContent = userName;
    window.playerHand = null;
    window.score = 0;
    window.last_score = 0

    fetchUserName();
    addDiscardCounter();
    resetDiscards();

});

// Generic sort function
function sortCards(cards, sortBy) {
    if (sortBy === 'rank') {
        return cards.slice().sort((a, b) => getCardRank(b) - getCardRank(a));
    } else if (sortBy === 'suit') {
        return cards.slice().sort((a, b) => {
            const suitA = a.slice(-1);
            const suitB = b.slice(-1);
            if (suitA === suitB) {
                return getCardRank(b) - getCardRank(a);
            }
            return suitA.localeCompare(suitB);
        });
    }
    return cards;
}

// Creates the initial player's hand
function loadCards() {
    // Initialize availableIndices once
    availableIndices = Array.from({ length: 52 }, (_, i) => i); // Reset deck to full state
    document.getElementById('card-container').innerHTML = '';
    const sortedHand = sortCards(window.playerHand, sortBy);
    sortedHand.forEach((card) => {
        paintCard(card);
    });
}

// Just draw cards
function paintCard(card) {
    let card_container = document.getElementById('card-container');

    let cardHTML = `
        <div class="poker-card">
        <div
            card="${card}"
            class="card"
            style="
            background: url('/juegos/balatro/static/img/${card}.png') no-repeat center/cover">
            <div class="card-body a1">
            <h5 class="card-title invisible-text">${card}</h5>
            </div>
        </div>
        </div>`;

    card_container.innerHTML += cardHTML; // Append new card

    document.querySelectorAll('.card').forEach(cardElement => {
        cardElement.addEventListener('click', () => {
            let cardTitle = cardElement.querySelector('.card-title');
            let pokerCard = cardElement.closest('.poker-card');

            if (selectedCardsTags.includes(cardTitle)) {
                selectedCardsTags = selectedCardsTags.filter(c => c !== cardTitle);
                pokerCard.classList.remove('selected');
            } else {
                if (selectedCardsTags.length < 5) {
                    selectedCardsTags.push(cardTitle);
                    pokerCard.classList.add('selected');
                }
            }

            // Calculate and print score every time a card is selected
            let selected = selectedCardsTags.map(tag => tag.textContent);
            if(selected.length > 0) {
                const [score, handType, validPlayedCards, chips, multiplier] = scoreHand(selected);
                document.getElementById("score-value").textContent = score;
                document.getElementById("hand-type").textContent = handType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
                document.getElementById("chips-value").textContent = chips;
                document.getElementById("multiplier-value").textContent = multiplier;
                console.log(`Selected hand: ${selected.join(', ')} | Type: ${handType} | Score: ${score} | Chips: ${chips} | Multiplier: ${multiplier}`);
            } else {
                ClearScoreSection();
                console.log('No cards selected');
            }
        });
    });
}

function ClearScoreSection() {
    document.getElementById("score-value").textContent = '';
    document.getElementById("hand-type").textContent = '';
    document.getElementById("chips-value").textContent = '';
    document.getElementById("multiplier-value").textContent = '';
}

async function playHand() {
    if (selectedCardsTags.length > 0) {
        extractCardsToString();
        selectedCards.sort((a, b) => getCardRank(b) - getCardRank(a));
        await getScore(selectedCards);
        if (proceed_playHand == true) {
            // Remove played cards from playerHand
            window.playerHand = window.playerHand.filter(card => !selectedCards.includes(card));
            selectedCardsTags.forEach(selectedCard => {
                document.querySelectorAll('.poker-card').forEach(cardElement => {
                    let cardTitle = cardElement.querySelector('.card-title').textContent.trim();
                    if (cardTitle === selectedCard.textContent) {
                        cardElement.remove();
                    }
                });
            });

            console.log(selectedCardsTags.length);

            // Aqui deberia de dibujar 3 cartas random
            await drawCardsForP1();


            console.log("termino draw");
            getGameState();
            console.log("termina gamestate");
            ClearScoreSection();
            // The selected cars shouldnt be selected in the next turn
            selectedCardsTags = [];
            selectedCards = [];
        }
        else {
            // Levantar un mensaje diciendo que no es tu turno
            stop_notification.style.display = 'inline-block';

            setTimeout(() => {
                stop_notification.style.display = 'none';
            }, 1500);
        }
    }
}

// Gets Card Rank
function getCardRank(card) {
    let rank = card.slice(0, -1); // remove the last character (suit)
    return cardRank[rank] || 0;
}

// Extracts the card string from the HTML tag
function extractCardsToString() {
    selectedCards = [];
    selectedCardsTags.forEach((tag) => {
        selectedCards.push(tag.textContent);
    });
}

async function getScore(playedCards) {
    return fetch('/juegos/balatro-backend/play_hand', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sid: sid,
            cards: playedCards
        })
    })
        .then(response => response.json())
        .then(function(data) {

            if (data.message) {
                console.log(data.message);
                proceed_playHand = false;   // The player can't do anything
            }
            else {
                proceed_playHand = true;
            }

        })
        .catch(error => {
            console.error("Error:", error);
        });
}

async function drawCardsForP1() {
    console.log("Se sacan cartas");
    return fetch(`/juegos/balatro-backend/draw_cards?sid=${sid}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            console.log("Cartas regresadas" + data.drawn_cards);
            // Add new cards to playerHand
            window.playerHand = window.playerHand.concat(data.drawn_cards);
            // Resort and redraw the hand
            loadCards();
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


function getGameState() {
    // Make a GET request
    fetch(`/juegos/balatro-backend/game_state?sid=${sid}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById("player-score").textContent = data.total;
            document.getElementById("last-score").textContent = data.last_score;
            document.getElementById("last-hand").textContent = data.last_hand;
            document.getElementById("last-opponent-score").textContent = data.last_opponent_score;

        })
        .catch(error => {
            console.error('Error:', error);
        });
}

let discardCount = 0;
const maxDiscards = 3;

function updateDiscardUI() {
    const discardBtn = document.getElementById('discard-cards-btn');
    const counter = document.getElementById('discard-counter');
    const left = maxDiscards - discardCount;
    if (counter) {
        counter.textContent = `Discards left: ${left}`;
    }
    if (discardBtn) {
        if (left <= 0) {
            discardBtn.disabled = true;
            discardBtn.style.opacity = 0.5;
            discardBtn.style.cursor = 'not-allowed';
        } else {
            discardBtn.disabled = false;
            discardBtn.style.opacity = 1;
            discardBtn.style.cursor = 'pointer';
        }
    }
}

function resetDiscards() {
    discardCount = 0;
    updateDiscardUI();
}

function addDiscardCounter() {
    let container = document.getElementById('score-container');
    if (container && !document.getElementById('discard-counter')) {
        let counter = document.createElement('div');
        counter.id = 'discard-counter';
        counter.style.marginTop = '10px';
        counter.style.fontSize = '1.1rem';
        counter.style.color = '#fff';
        container.appendChild(counter);
    }
    updateDiscardUI();
}

async function discardCards() {
    if (selectedCardsTags.length > 0 && discardCount < maxDiscards) {
        extractCardsToString();
        selectedCards.sort((a, b) => getCardRank(b) - getCardRank(a));
        // Remove discarded cards from playerHand
        window.playerHand = window.playerHand.filter(card => !selectedCards.includes(card));
        selectedCardsTags.forEach(selectedCard => {
            document.querySelectorAll('.poker-card').forEach(cardElement => {
                let cardTitle = cardElement.querySelector('.card-title').textContent.trim();
                if (cardTitle === selectedCard.textContent) {
                    cardElement.remove();
                }
            });
        });
        await discardInAPI(selectedCards);
        await drawCardsForP1();
        ClearScoreSection();
        selectedCardsTags = [];
        selectedCards = [];
        discardCount++;
        updateDiscardUI();
    }
}

async function discardInAPI(cards) {
    try {
        const response = await fetch(`/juegos/balatro-backend/discard`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sid: sid,
                cards: cards
            })
        });

        const data = await response.json();
    } catch (error) {
        console.error("Error:", error);
    }
}

// Add event listeners for sorting buttons
function setupSortButtons() {
    const rankBtn = document.getElementById('ranks-btn');
    const suitBtn = document.getElementById('suits-btn');
    if (rankBtn) {
        rankBtn.addEventListener('click', () => {
            sortBy = 'rank';
            loadCards();
        });
    }
    if (suitBtn) {
        suitBtn.addEventListener('click', () => {
            sortBy = 'suit';
            loadCards();
        });
    }
}



