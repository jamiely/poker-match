PM.CardNameParser = PM.CardNameParser || function() {
  // given a card name, parses into values
  var parse = this.parse = function(name) {
    // strip the prefix "card" and the suffix ".png"
    var base = name.substr(4, name.length - 4 - 4);
    if(base === 'Joker') {
      return {
        isWild: true,
        fn: name,
        baseName: base
      };
    }

    var suits = _.map('Hearts Diamonds Clubs Spades'.split(' '), function(s) {
      return {
        name: s,
        suitRegExp: new RegExp('^' + s)
      };
    });
    var suit = _.find(suits, function(s) {
      return s.suitRegExp.test(base);
    });
    if(! suit) {
      console.log('no suit could be parsed for ' + name);
      return null;
    }

    var value = base.substr(suit.name.length);
    if(! value) {
      console.log('no value could be parsed for ' + name);
      return null;
    }

    return {
      suit: suit.name,
      value: value,
      fn: name,
      baseName: base
    };
  }
};

