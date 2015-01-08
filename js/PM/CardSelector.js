PM.CardSelector = PM.CardSelector || function(board, onSelect) {
  var selectedCard;
  var getSelected = this.getSelected = function() {
    return [selectedCard];
  };

  var onCardUp = this.onCardUp = function(card, pointer) {
    console.log({
      event: 'release',
      card: card,
      pointer: pointer
    });
  };

  var onCardDown = this.onCardDown = function(card, pointer) {
    console.log(card.jalCardValue);
    console.log({
      what: 'card in direction down',
      card: board.cardInDirection(card, PM.Direction.Down)
    });
    if(selectedCard) {
      if(selectedCard === card) {
        selectedCard = null;
        return;
      }

      console.log('checking if selected card is adjacent');
      // if the card is adjacent to one already selected
      // then we perform the swap.
      if(board.isAdjacent(selectedCard, card)) {
        console.log('selected card is adjacent to this one');
        onSelect(selectedCard, card);
        selectedCard = null;
        return;
      }
    }
    console.log({
      event: 'select',
      card: card,
      pointer: pointer
    });
    selectedCard = card;
  }
};

