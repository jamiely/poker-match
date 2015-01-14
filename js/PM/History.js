// keeps track of play history
PM.History = PM.History || function() {
  var countsByType = {};
  var countsByValue = {};
  var countsBySuit = {};
  var countsByCard = {};

  var memory = [];
  var unicodeSuits = {
    hearts: '♥',
    spades: '♠',
    clubs: '♣',
    diamonds: '♦'
  };

  function displayCardSimple(card) {
    return card.jalCardValue.value + 
      unicodeSuits[card.jalCardValue.suit];
  }

  function displayCard(card) {
    return '<span class="' + card.jalCardValue.suit + '">' +
      displayCardSimple(card) +
      '</span>';
  }

  function sanitizeCard(card) {
    return {
      jalCardValue: card.jalCardValue,
      jalBoardCoordinates: card.jalBoardCoordinates,
      display: displayCard(card),
      displaySimple: displayCardSimple(card)
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

  this.getStatistics = function() {
    return {
      countsByType: countsByType,
      countsByCard: countsByCard,
      countsBySuit: countsBySuit,
      countsByValue: countsByValue,
      score: score,
      // same as matches
      moves: memory.length
    };
  };

  function track(match) {
    countsByType[match.matchType] = (countsByType[match.matchType] || 0) + 1;
    _.each(match.cards, function(c) {
      countsByCard[c.displaySimple] = (countsByCard[c.displaySimple] || 0) + 1;
      var cv = c.jalCardValue;
      countsBySuit[cv.suit] = (countsBySuit[cv.suit] || 0) + 1;
      countsByValue[cv.value] = (countsByValue[cv.value] || 0) + 1;
    });
  }

  var remember = this.remember = function(match) {
    var san = sanitizeMatch(match);
    track(san);
    memory.push(san);
    score += scoreMatch(san);
    render();
  };

};

