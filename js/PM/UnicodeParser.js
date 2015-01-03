PM.UnicodeParser = PM.UnicodeParser || function() {
  var USPADES = '♠',
    UHEARTS = '♥',
    UDIAMOND = '♦',
    UCLUB = '♣';

  var unicodeToSuits = {};
  unicodeToSuits[USPADES] = 'spades',
  unicodeToSuits[UHEARTS] = 'hearts',
  unicodeToSuits[UDIAMOND] = 'diamonds',
  unicodeToSuits[UCLUB] = 'clubs'

  var suitRegexes = _.map(_.keys(unicodeToSuits), function(k) {
    return {
      predicate: function(str) {
        return str.replace(k, '').length !== str.length;
      },
      name: unicodeToSuits[k],
      unicode: k,
      strip: function(str) {
        return str.replace(k, '');
      }
    };
  });

  var validValues = '2 3 4 5 6 7 8 9 10 J Q K A'.split(' ');

  // parses something like 4♠ or J
  this.parse = function(str) {
    var suitRE = _.find(suitRegexes, function(re) {
      return re.predicate(str);
    });

    if(! suitRE) {
      return {
        unknown: true,
        original: str
      };
    }

    var value = suitRE.strip(str);
    if(validValues.indexOf(value) === -1) {
      return {
        suit: suitRE.name,
        unknown: true,
        original: str,
        unrecognizedValue: value
      };
    }

    return {
      suit: suitRE.name,
      suitRE: suitRE,
      value: value,
      original: str
    };
  };
};

