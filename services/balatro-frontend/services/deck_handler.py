import random

class PlayerDeckHandler():
    def __init__(self):
        self.available_indices = list(range(52))
        self.deck = []
        self.hand = []

        self.create_deck()
        for i in range(8):
            self.draw_card()
    
    def create_deck(self):
        suits = ["H", "D", "C", "S"]  # Hearts, Diamonds, Clubs, Spades
        ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"]

        for suit in suits:
            for rank in ranks:
                self.deck.append(rank + suit)
        
        return self.deck

    def draw_card(self):
        card = self.get_random_card_from_deck()
        if card:
            self.hand.append(card)
        return card

    # Function to generate a unique random card index
    def get_random_card_from_deck(self):
        if not self.available_indices:  # No more cards left
            return None
        random_index = random.randint(0, len(self.available_indices) - 1)  # Get random index
        card_index = self.available_indices.pop(random_index)  # Remove and get the index
        return self.deck[card_index]
    
    def get_hand(self):
        return self.hand
    
    def remove_from_hand(self, card):
        if card in self.hand:
            self.hand.remove(card)