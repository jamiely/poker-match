PM.CardSelectorDrag = function(board, onSelect) {
  var lastCard;
  var selectedCards = [];
  var getSelected = this.getSelected = function() {
    return selectedCards;
  };

  var onCardUp = this.onCardUp = function(card, pointer) {
    var copy = _.clone(selectedCards);
    resetSelected();
    console.log({
      what: "oncardup selected cards",
      cards: copy
    });
    onSelect(copy);
  };

  var onCardDown = this.onCardDown = function(card, pointer) {
    initSelected(card);
  };

  function resetSelected() {
    lastCard = null;
    selectedCards = [];
  }

  function initSelected(card) {
    lastCard = card;
    selectedCards = [card];
  }

  var onCardOver = this.onCardOver = function(card, pointer) {
    console.log(pointer.x);
    if(! pointer.isDown) {
      return;
    }
    if(! lastCard) {
      return;
    }
    if(selectedCards.indexOf(card) !== -1) {
      // cannot select a card twice
      console.log('card already selected');
      return;
    }

    if(board.isAdjacentOrDiagonal(lastCard, card)) {
      console.log('selected card is adjacent to this one');
      selectedCards.push(card);
      lastCard = card;
    } else {
      console.log('card over is not adjacent to last');
    }
  }
};

