let deck;
let suits;
let ranks;
let availableIndices = []; // Move this outside the function
let selectedCardsTags = []; // Html tag containt the cards
let selectedCards = []; // String array containing the cards
let validPlayedCards = [];
let last_score;


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

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("play-hand-btn").addEventListener('click', () => {
        playHand();
    });
    document.getElementById("discard-cards-btn").addEventListener('click', () => {
        discardCards();
        drawCardsForP1();
    });
    last_score = window.score;  
    
    loadCards();
});

// Creates the initial player's hand
function loadCards() {
    // Initialize availableIndices once
    availableIndices = Array.from({ length: 52 }, (_, i) => i); // Reset deck to full state

    window.playerHand.forEach((card) =>{
        drawCard(card);
    });
}

// Removes a card from the deck and inserts it into the player's hand
function drawCard(card) {
    let card_container = document.getElementById('card-container');

    let cardHTML = `
        <div class="poker-card">
            <div card=${card} class="card">
                <div class="card-body" class="a1">
                    <h5 class="card-title">${card}</h5>
                </div>
            </div>
        </div>`;

    card_container.innerHTML += cardHTML; // Append new card

    document.querySelectorAll('.card').forEach(cardElement => {
        cardElement.addEventListener('click', () => {
            let cardTitle = cardElement.querySelector('.card-title');

            if (selectedCardsTags.includes(cardTitle)) {
                selectedCardsTags = selectedCardsTags.filter(c => c !== cardTitle);
                cardElement.querySelector('.card-body').classList.remove('selected');
            } else {
                if (selectedCardsTags.length < 5) {
                    selectedCardsTags.push(cardTitle);
                    cardElement.querySelector('.card-body').classList.add('selected');
                }
            }
        });
    });
}

async function  playHand() {
    if (selectedCardsTags.length > 0) {
        extractCardsToString();
        selectedCards.sort((a, b) => getCardRank(b) - getCardRank(a));

        await getScore(selectedCards);
        selectedCardsTags.forEach(selectedCard => {
            document.querySelectorAll('.poker-card').forEach(cardElement => {
                let cardTitle = cardElement.querySelector('.card-title').textContent.trim();
                if (cardTitle === selectedCard.textContent) {
                    cardElement.remove();
                }
            });
        });
        console.log(selectedCardsTags.length);
        await drawCardsForP1();
        console.log("termino draw");
        getGameState();
        console.log("termina gamestate");
        selectedCardsTags = [];
    }
}

// Gets Card Rank
function getCardRank(card) {
    let rank = card.slice(0, -1); // remove the last character (suit)
    return cardRank[rank] || 0;
}

// Gets Card Suit
function getCardSuit(card) {
    return card.slice(-1); // Get the last character
}

// Extracts the card string from the HTML tag
function extractCardsToString(){
    selectedCards = [];
    selectedCardsTags.forEach((tag) =>{
        selectedCards.push(tag.textContent);
    });
}

function getScore(playedCards){
    return fetch('/juegos/balatro/play_hand', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            cards: playedCards
        })
    })
    .then(response => response.json())
    .then(data => {
        // console.log("Hand Played:", data.hand_played);
        // console.log("Received:", data.received);
        // console.log("Score:", data.score);
        // console.log("Valid Cards:", data.valid_cards);
    })
    .catch(error => {
        console.error("Error:", error);
    });    
}

function drawCardsForP1() {
    return fetch('/juegos/balatro/p1_draw_cards')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            console.log(data);
            data.drawn_cards.forEach(drawCard); // <- draw each new card
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


function getGameState(){
    // Make a GET request
    fetch('/juegos/balatro/game_state')
    .then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
    })
    .then(data => {
    document.getElementById("player-score").textContent = data.total;
    document.getElementById("last-score").textContent = data.last_score;
    })
    .catch(error => {
    console.error('Error:', error);
    });
}

function discardCards(){
    if (selectedCardsTags.length > 0) {
        extractCardsToString();

        selectedCards.sort((a, b) => getCardRank(b) - getCardRank(a));

        selectedCardsTags.forEach(selectedCard => {
            document.querySelectorAll('.poker-card').forEach(cardElement => {
                let cardTitle = cardElement.querySelector('.card-title').textContent.trim();
                if (cardTitle === selectedCard.textContent) {
                    cardElement.remove();
                }
            });
        });
        discardInAPI(selectedCards);
        drawCardsForP1();
        selectedCardsTags = [];
    }
}

function discardInAPI(cards){
    fetch('/juegos/balatro/p1_discard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            cards: cards
        })
    })
    .then(response => response.json())
    .then(data => {

    })
    .catch(error => {
        console.error("Error:", error);
    });    
}