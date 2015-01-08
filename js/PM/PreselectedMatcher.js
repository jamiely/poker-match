// Use to match cards which have been preselected. That is,
// to determine if a group of cards is some type of match.
PM.PreselectedMatcher = function() {
  // we need a base matcher for some of the functions

  var getMatches = this.getMatches = function(cards) {
    console.log('isMatch');
    var baseMatcher = new PM.Matcher();
    if(! cards) return false;
    if(! cards.length) return false;
    if(cards.length < 2) return false;

    // get the first card to be a base
    var firstCard = cards[0]; 
    var lastCard = firstCard;
    var matches = baseMatcher.getBaseMatches(firstCard);

    console.log({
      what: 'isMatch',
      firstCard: firstCard,
      baseMatches: matches
    });

    for(var i = 1; i < cards.length; i ++) {
      card = cards[i];
      matches = _.filter(matches, function(m) {
        // always assume we are going right. The direction is embedded
        // in the order of the cards.
        var predicate = m.nextPredicate(PM.Direction.Right);
        var result = predicate(lastCard, card);

        console.log({
          what: 'isMatch iteration',
          m: m,
          result: result
        });

        return result;
      });

      // with the matches we have left, add the current card
      _.each(matches, function(m) {
        m.match.push(card);
      });

      lastCard = card;
    }

    var acceptable = _.filter(matches, baseMatcher.matchAcceptable);

    console.log({
      what: 'isMatch filter loop',
      matches: matches,
      acceptableMatches: acceptable
    });

    return acceptable;
  };
};

