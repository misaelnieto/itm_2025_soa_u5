

let socket = io('localhost:8088', {
    path: '/juegos/balatro-backend/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    forceNew: true,
    upgrade: true,
    rememberUpgrade: true,
    autoConnect: true
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

let sid = null;
// ... existing code ...
let turn = 1;
let proceed_playHand = false;
let win = "https://media.istockphoto.com/id/1447471637/video/you-win-glitch-4k-video-animation-footage-pixel-message-design-glitch-effect.jpg?s=640x640&k=20&c=JGgJOzzgHAWu33tEMYl-yghunxslgkdZGDHbqCB8KNA=";
let lose = "https://motionarray.imgix.net/motion-array-3081970-Ib6GvahUCf-high_0014.jpg?w=660&q=60&fit=max&auto=format"
let tie = "https://media.tenor.com/wyfhYqF1tJIAAAAe/mark-wahlberg-wahlberg.png";

socket.on('connect',()=>{
    sid = socket.id;
    console.log("Mi SID: "+sid);
});



let loadingScreen = document.getElementsByClassName('loadingScreen')[0];
let opponent = document.getElementsByClassName('opponent')[0];
let stop_notification = document.getElementsByClassName('stop')[0];
let final = document.getElementsByClassName('game_over')[0];
let image_final = document.getElementsByClassName('final-i')[0];
let h2_final = document.getElementsByClassName('final-h2')[0];


socket.on('update_turn', (data)=>{
    opponent.textContent = `It's player ${data.current_turn}'s turn`;
});



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


// This functions is running at the beggin
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("play-hand-btn").addEventListener('click', async () => {
        await playHand();
    });
    document.getElementById("discard-cards-btn").addEventListener('click', async () => {
        await discardCards();
        await drawCardsForP1();
    });

    
    window.playerHand = null;
    window.score = 0;
    window.last_score = 0

    socket.on('matched', (data)=>{

        window.playerHand = data.player_hand;
        window.last_score = window.score;  
        

        loadingScreen.remove();
        console.log(`Matched!! loading the room ${data.room}`);
        // Before loading cards, we should wait for someone

        loadCards();
    });
    
});

// Creates the initial player's hand
function loadCards() {
    // Initialize availableIndices once
    availableIndices = Array.from({ length: 52 }, (_, i) => i); // Reset deck to full state

    window.playerHand.forEach((card) =>{
        drawCard(card);
    });
}

// Just draw cards
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

        // Parses selectCards as an string
        extractCardsToString();

        // Orders the card by the biggest rank to the smallets rank
        // Example:  A A J 9 9 7 3 
        selectedCards.sort((a, b) => getCardRank(b) - getCardRank(a));
        

        
        await getScore(selectedCards);

        // At the moment, the cards werent taken off from the player's hand, so
        // if there's not the player's turn, nothing can happend

        if(proceed_playHand==true){

            // This part of the code verify all the selected cards and then remove that ones.
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
            await getGameState();
            console.log("termina gamestate");
        }
        else{
            // Levantar un mensaje diciendo que no es tu turno
            stop_notification.style.display = 'inline-block';

            setTimeout(()=>{
                stop_notification.style.display = 'none';
            },1500);
        }



        // The selected cars shouldnt be selected in the next turn
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

async function getScore(playedCards){
    return fetch('/juegos/balatro-backend/play_hand', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sid:sid,
            cards: playedCards
        })
    })
    .then(response => response.json())
    .then(data => {

        if(data.message){
            console.log(data.message);
            proceed_playHand = false;   // The player can't do anything
        }
        else{
            // console.log("Hand Played:", data.hand_played);
            // console.log("Received:", data.received);
            // console.log("Score:", data.score);
            // console.log("Valid Cards:", data.valid_cards);

            console.log('Si era tu turno weeee');
            // Esto no aplica a los dos jugadores, solo al jugador actual, por eso no se pone en un socket
            proceed_playHand = true; 
        }
        
    })
    .catch(error => {
        console.error("Error:", error);
    });    
}

async function drawCardsForP1() {
    return fetch(`/juegos/balatro-backend/draw_cards?sid=${sid}`)
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
    })
    .catch(error => {
    console.error('Error:', error);
    });
}

async function discardCards(){
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
        await drawCardsForP1();
        selectedCardsTags = [];
    }
}

function discardInAPI(cards){
    fetch(`/juegos/balatro-backend/discard`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sid: sid,
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



socket.on('game_over',(data)=>{
    
    if(data.win == 0){
        image_final.src = lose;
    }
    
    if(data.win== 1){
        image_final.src = win;
    }

    if(data.win==2){
        image_final.src = tie;
    }

    h2_final.textContent = data.score;

    final.style.display = 'inline-block';

});