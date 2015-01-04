PM.UnicodeRenderer = PM.UnicodeRenderer || function() {
  var unicodeSuits = {
    hearts: '♥',
    spades: '♠',
    clubs: '♣',
    diamonds: '♦'
  };

  var render = this.render = function(card) {
      return card.jalCardValue.value + 
        unicodeSuits[card.jalCardValue.suit];
  };
};

