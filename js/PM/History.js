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

  var matchTypeScoreBase = {
    kind: 1000,
    straight: 1500,
    flush: 2000
  };
  var matchTypeScoreLengthBonus = {
    kind: 50,
    straight: 100,
    flush: 25
  };

  function scoreMatch(match) {
    var mt = match.matchType;
    var len = match.cards.length;
    return matchTypeScoreBase[mt] + len * matchTypeScoreLengthBonus[mt];
  }

  var score = 0;
  var getScore = this.getScore = function() {
    return score;
  };

  var remember = this.remember = function(match) {
    var san = sanitizeMatch(match);
    memory.push(san);
    score += scoreMatch(san);
    render();
  };

};

