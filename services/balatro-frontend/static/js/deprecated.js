function checkHand(playedCards) {
    if (playedCards.length < 1) {
        console.log("Please select at least one card.");
        return;
    }

    let ranks = playedCards.map(card => card.slice(0, -1)); // Extract rank
    let suits = playedCards.map(card => card.slice(-1)); // Extract suit

    let uniqueSuits = [...new Set(suits)];
    const rankCountMap = {};
    ranks.forEach(r => rankCountMap[r] = (rankCountMap[r] || 0) + 1);

    const sortedRanks = [...ranks].sort((a, b) => cardRank[b] - cardRank[a]);
    const getCardsByRanks = rankList => playedCards.filter(c => rankList.includes(c.slice(0, -1)));

    // Helper function to check for consecutive numbers (for straight)
    function isConsecutive(ranks) {
        let rankValues = ranks.map(rank => cardRank[rank]);
        rankValues.sort((a, b) => a - b);
        return rankValues.every((val, index) => index === 0 || val === rankValues[index - 1] + 1);
    }

    validPlayedCards = [];

    // Royal Flush
    if (uniqueSuits.length === 1 && sortedRanks[0] === 'A' && isConsecutive(sortedRanks)) {
        validPlayedCards = playedCards;
        console.log("Royal Flush:", validPlayedCards);
        return validPlayedCards;
    }

    // Straight Flush
    if (uniqueSuits.length === 1 && isConsecutive(sortedRanks)) {
        validPlayedCards = playedCards;
        console.log("Straight Flush:", validPlayedCards);
        return validPlayedCards;
    }

    // Four of a Kind
    const four = Object.entries(rankCountMap).find(([_, count]) => count === 4);
    if (four) {
        validPlayedCards = getCardsByRanks([four[0]]);
        console.log("Four of a Kind:", validPlayedCards);
        return validPlayedCards;
    }

    // Full House
    const three = Object.entries(rankCountMap).find(([_, count]) => count === 3);
    const pair = Object.entries(rankCountMap).find(([r, count]) => count === 2 && r !== three?.[0]);
    if (three && pair) {
        validPlayedCards = getCardsByRanks([three[0], pair[0]]);
        console.log("Full House:", validPlayedCards);
        return validPlayedCards;
    }

    // Flush
    if (uniqueSuits.length === 1) {
        validPlayedCards = playedCards;
        console.log("Flush:", validPlayedCards);
        return validPlayedCards;
    }

    // Straight
    if (isConsecutive(sortedRanks)) {
        validPlayedCards = playedCards;
        console.log("Straight:", validPlayedCards);
        return validPlayedCards;
    }

    // Three of a Kind
    if (three) {
        validPlayedCards = getCardsByRanks([three[0]]);
        console.log("Three of a Kind:", validPlayedCards);
        return validPlayedCards;
    }

    // Two Pair
    const pairs = Object.entries(rankCountMap).filter(([_, count]) => count === 2);
    if (pairs.length === 2) {
        validPlayedCards = getCardsByRanks(pairs.map(p => p[0]));
        console.log("Two Pair:", validPlayedCards);
        return validPlayedCards;
    }

    // One Pair
    if (pairs.length === 1) {
        validPlayedCards = getCardsByRanks([pairs[0][0]]);
        console.log("One Pair:", validPlayedCards);
        return validPlayedCards;
    }

    // High Card
    const high = sortedRanks[0];
    validPlayedCards = getCardsByRanks([high]);
    console.log("High Card:", validPlayedCards);
    return validPlayedCards;
}
