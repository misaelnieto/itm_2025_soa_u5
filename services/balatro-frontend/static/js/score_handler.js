const cardRank = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12,
  'K': 13, 'A': 14
};

const HandType = {
  ROYAL_FLUSH: 'ROYAL_FLUSH',
  STRAIGHT_FLUSH: 'STRAIGHT_FLUSH',
  FOUR_KIND: 'FOUR_KIND',
  FULL_HOUSE: 'FULL_HOUSE',
  FLUSH: 'FLUSH',
  STRAIGHT: 'STRAIGHT',
  THREE_KIND: 'THREE_KIND',
  TWO_PAIR: 'TWO_PAIR',
  PAIR: 'PAIR',
  HIGH: 'HIGH'
};

function checkHand(playedCards) {
  if (playedCards.length < 1) return;

  const ranks = playedCards.map(c => c.slice(0, -1));
  const suits = playedCards.map(c => c.slice(-1));
  const uniqueSuits = new Set(suits);

  const rankCountMap = {};
  for (let r of ranks) {
    rankCountMap[r] = (rankCountMap[r] || 0) + 1;
  }

  const sortedRanks = [...ranks].sort((a, b) => cardRank[b] - cardRank[a]);

  function getCardsByRanks(rankList) {
    return playedCards.filter(c => rankList.includes(c.slice(0, -1)));
  }

  function isConsecutive(rankList) {
    try {
      const values = rankList.map(r => cardRank[r]).sort((a, b) => a - b);
      for (let i = 1; i < values.length; i++) {
        if (values[i] !== values[i - 1] + 1) return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  let validPlayedCards = [];

  // Royal Flush
  if (playedCards.length >= 5 && uniqueSuits.size === 1 && sortedRanks[0] === 'A' && isConsecutive(sortedRanks)) {
    validPlayedCards = playedCards;
    return [HandType.ROYAL_FLUSH, validPlayedCards];
  }

  // Straight Flush
  if (playedCards.length >= 5 && uniqueSuits.size === 1 && isConsecutive(sortedRanks)) {
    validPlayedCards = playedCards;
    return [HandType.STRAIGHT_FLUSH, validPlayedCards];
  }

  // Four of a Kind
  const four = Object.entries(rankCountMap).find(([r, c]) => c === 4);
  if (four) {
    validPlayedCards = getCardsByRanks([four[0]]);
    return [HandType.FOUR_KIND, validPlayedCards];
  }

  const three = Object.entries(rankCountMap).find(([r, c]) => c === 3);
  const pair = Object.entries(rankCountMap).find(([r, c]) => c === 2 && (!three || r !== three[0]));

  // Full House
  if (three && pair) {
    validPlayedCards = getCardsByRanks([three[0], pair[0]]);
    return [HandType.FULL_HOUSE, validPlayedCards];
  }

  // Flush
  if (playedCards.length >= 5 && uniqueSuits.size === 1) {
    validPlayedCards = playedCards;
    return [HandType.FLUSH, validPlayedCards];
  }

  // Straight
  if (playedCards.length >= 5 && isConsecutive(sortedRanks)) {
    validPlayedCards = playedCards;
    return [HandType.STRAIGHT, validPlayedCards];
  }

  // Three of a Kind
  if (three) {
    validPlayedCards = getCardsByRanks([three[0]]);
    return [HandType.THREE_KIND, validPlayedCards];
  }

  // Two Pair
  const pairs = Object.entries(rankCountMap).filter(([r, c]) => c === 2);
  if (pairs.length === 2) {
    validPlayedCards = getCardsByRanks(pairs.map(p => p[0]));
    return [HandType.TWO_PAIR, validPlayedCards];
  }

  // One Pair
  if (pairs.length === 1) {
    validPlayedCards = getCardsByRanks([pairs[0][0]]);
    return [HandType.PAIR, validPlayedCards];
  }

  // High Card
  const high = sortedRanks[0];
  validPlayedCards = getCardsByRanks([high]);
  return [HandType.HIGH, validPlayedCards];
}

function scoreHand(playedCards) {
  const [handType, validPlayedCards] = checkHand(playedCards);
  let chips = 0;
  let multiplier = 0;

  switch (handType) {
    case HandType.ROYAL_FLUSH:
    case HandType.STRAIGHT_FLUSH:
      chips = 100;
      multiplier = 8;
      break;
    case HandType.FOUR_KIND:
      chips = 60;
      multiplier = 7;
      break;
    case HandType.FULL_HOUSE:
      chips = 40;
      multiplier = 4;
      break;
    case HandType.FLUSH:
      chips = 35;
      multiplier = 4;
      break;
    case HandType.STRAIGHT:
      chips = 30;
      multiplier = 4;
      break;
    case HandType.THREE_KIND:
      chips = 30;
      multiplier = 3;
      break;
    case HandType.TWO_PAIR:
      chips = 20;
      multiplier = 2;
      break;
    case HandType.PAIR:
      chips = 10;
      multiplier = 2;
      break;
    case HandType.HIGH:
      chips = 5;
      multiplier = 1;
      break;
  }

  for (let card of validPlayedCards) {
    let rankScore = cardRank[card.slice(0, -1)];
    if ([11, 12, 13].includes(rankScore)) rankScore = 10;
    if (rankScore === 14) rankScore = 11;
    chips += rankScore;
  }

  return [chips * multiplier, handType, validPlayedCards, chips, multiplier];
}

export { scoreHand };