from enum import Enum


card_rank = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12,
    'K': 13, 'A': 14
}

class HandType(Enum):
    ROYAL_FLUSH = 1
    STRAIGHT_FLUSH = 2
    FOUR_KIND = 3
    FULL_HOUSE = 4
    FLUSH = 5
    STRAIGHT = 6
    THREE_KIND = 7
    TWO_PAIR = 8
    PAIR = 9
    HIGH = 10

def check_hand(played_cards):
    if len(played_cards) < 1:
        return
     # Obtains the rank of the card (A,2,3,...)
    ranks = [card[:-1] for card in played_cards]
    # Obtains the suit of the card (Diamonds, Clubs, ...)
    suits = [card[-1] for card in played_cards] 
    # checks if the hand only contains cards with a single suit
    unique_suits = set(suits) 

    rank_count_map = {}
    for r in ranks:
        rank_count_map[r] = rank_count_map.get(r, 0) + 1

    sorted_ranks = sorted(ranks, key=lambda r: card_rank[r], reverse=True)
    def get_cards_by_ranks(rank_list):
        return [c for c in played_cards if c[:-1] in rank_list]

    def is_consecutive(ranks_to_check):
        try:
            values = sorted(card_rank[r] for r in ranks_to_check)
            return all(values[i] == values[i-1] + 1 for i in range(1, len(values)))
        except KeyError:
            return False

    valid_played_cards = []

    # Royal Flush
    if len(unique_suits) == 1 and sorted_ranks[0] == 'A' and is_consecutive(sorted_ranks):
        valid_played_cards = played_cards
        print("Royal Flush:", valid_played_cards)
        return HandType.ROYAL_FLUSH, valid_played_cards

    # Straight Flush
    if len(unique_suits) == 1 and is_consecutive(sorted_ranks):
        valid_played_cards = played_cards
        print("Straight Flush:", valid_played_cards)
        return HandType.STRAIGHT_FLUSH, valid_played_cards

    # Four of a Kind
    four = next(((r, c) for r, c in rank_count_map.items() if c == 4), None)
    if four:
        valid_played_cards = get_cards_by_ranks([four[0]])
        print("Four of a Kind:", valid_played_cards)
        return HandType.FOUR_KIND, valid_played_cards

    # Verifies wether the hand contains three of a kind and a pair (used in 3 hand types)
    three = next(((r, c) for r, c in rank_count_map.items() if c == 3), None)
    pair = next(((r, c) for r, c in rank_count_map.items() if c == 2 and (not three or r != three[0])), None)
    # Full House
    if three and pair:
        valid_played_cards = get_cards_by_ranks([three[0], pair[0]])
        print("Full House:", valid_played_cards)
        return HandType.FULL_HOUSE, valid_played_cards

    # Flush
    if len(unique_suits) == 1:
        valid_played_cards = played_cards
        print("Flush:", valid_played_cards)
        return HandType.FLUSH, valid_played_cards

    # Straight
    if is_consecutive(sorted_ranks):
        valid_played_cards = played_cards
        print("Straight:", valid_played_cards)
        return HandType.STRAIGHT, valid_played_cards

    # Three of a Kind
    if three:
        valid_played_cards = get_cards_by_ranks([three[0]])
        print("Three of a Kind:", valid_played_cards)
        return HandType.THREE_KIND, valid_played_cards

    # Two Pair
    pairs = [(r, c) for r, c in rank_count_map.items() if c == 2]
    if len(pairs) == 2:
        valid_played_cards = get_cards_by_ranks([p[0] for p in pairs])
        print("Two Pair:", valid_played_cards)
        return HandType.TWO_PAIR, valid_played_cards

    # One Pair
    if len(pairs) == 1:
        valid_played_cards = get_cards_by_ranks([pairs[0][0]])
        print("One Pair:", valid_played_cards)
        return HandType.PAIR, valid_played_cards

    # High Card
    high = sorted_ranks[0]
    valid_played_cards = get_cards_by_ranks([high])
    
    return  HandType.HIGH, valid_played_cards

def score_hand(played_hands):
    hand_type, valid_played_hands = check_hand(played_hands)
    chips = 0
    multiplier = 0

    if hand_type == HandType.ROYAL_FLUSH:
        chips = 100
        multiplier = 8
    elif hand_type == HandType.STRAIGHT_FLUSH:
        chips = 100
        multiplier = 8
    elif hand_type == HandType.FOUR_KIND:
        chips = 60
        multiplier = 7
    elif hand_type == HandType.FULL_HOUSE:
        chips = 40
        multiplier = 4
    elif hand_type == HandType.FLUSH:
        chips = 35
        multiplier = 4
    elif hand_type == HandType.STRAIGHT:
        chips = 30
        multiplier = 4
    elif hand_type == HandType.THREE_KIND:
        chips = 30
        multiplier = 3
    elif hand_type == HandType.TWO_PAIR:
        chips = 20
        multiplier = 2
    elif hand_type == HandType.PAIR:
        chips = 10
        multiplier = 2
    elif hand_type == HandType.HIGH:
        chips = 5
        multiplier = 1

    for card in valid_played_hands:
        rank_score = card_rank[card[:-1]]

        # Adjusts the chips if it's Jack, Queen or King
        if rank_score in [11,12,13]:
            rank_score = 10

        # Adjusts the chips if it's an Ace
        if rank_score == 14:
            rank_score = 11

        chips = chips + rank_score
    return chips * multiplier, hand_type, valid_played_hands

