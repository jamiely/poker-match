// keeps track of play history
PM.History = PM.History || function() {
  var memory = [];
  var unicodeSuits = {
    hearts: '♥',
    spades: '♠',
    clubs: '♣',
    diamonds: '♦'
  };

  function displayCard(card) {
    return card.jalCardValue.value + unicodeSuits[card.jalCardValue.suit];
  }

  function santizeCard(card) {
    return {
      jalCardValue: card.jalCardValue,
      jalBoardCoordinates: card.jalBoardCoordinates,
      display: displayCard(card)
    };
  }

  function render() {
    var htmlStr = '<ul class="history">' +
      _.map(memory.reverse(), function(item) {
        return '<li class="item">' + _.pluck(item, 'display').join(',') + '</li>';
      }).join('') +
      '</ul>';
    document.getElementById('history').innerHTML = htmlStr;
  }

  var remember = this.remember = function(cards) {
    cards = _.map(cards, santizeCard);
    console.log({
      what: 'added to memory',
      cards: cards
    });
    memory.push(cards);
    render();
  };
};

