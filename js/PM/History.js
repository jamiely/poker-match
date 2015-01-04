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
    return '<span class="' + card.jalCardValue.suit + '">' +
      card.jalCardValue.value + 
      unicodeSuits[card.jalCardValue.suit] +
      '</span>';
  }

  function sanitizeCard(card) {
    return {
      jalCardValue: card.jalCardValue,
      jalBoardCoordinates: card.jalBoardCoordinates,
      display: displayCard(card)
    };
  }

  function sanitizeMatch(m) {
    return {
      matchType: m.matchType,
      cards: _.map(m.match, sanitizeCard)
    };
  }

  function render() {
    var htmlStr = '<ul class="history">' +
      _.map(_.clone(memory).reverse(), function(item) {
        return '<li class="item">' + _.pluck(item.cards, 'display').join(',') + 
          ' (' + item.matchType + ')</li>';
      }).join('') +
      '</ul>';
    document.getElementById('history').innerHTML = htmlStr;
  }

  var remember = this.remember = function(match) {
    memory.push(sanitizeMatch(match));
    render();
  };
};

