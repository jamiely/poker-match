PM.MatchReconciler = PM.MatchReconciler || function() {

  var cardRenderer = new PM.UnicodeRenderer();

  // we will not add the card value and suit because we will assume that
  // no two cards can have the same coordinate at once.
  var cardHash = this.cardHash = function(card) {
    return card.jalBoardCoordinates.toString();
  };

  // a string hash that can be used to compare against other matches
  // to determine if they are the same.
  var matchHash = this.matchHash = function(m) {
    return m.matchType + '_' + _.map(m.match, cardHash).sort().join(',');
  };

  var matchDisplay = this.matchDisplay = function(m) {
    return m.matchType + '_' + _.map(m.match, cardRenderer.render).sort().join(',');
  };

  var matchesEqual = this.matchesEqual = function(a, b) {
    return matchHash(a) === matchHash(b);
  };

  var uniqueMatches = this.uniqueMatches = function(matches) {
    var cache = {};
    return _.filter(matches, function(m) {
      var key = matchHash(m);
      var exists = !! cache[key];
      cache[key] = m;
      return !exists;
    });
  };
};

