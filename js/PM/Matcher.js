PM.Matcher = PM.Matcher || function(board) {
  var MATCH = {
    WILD: 'wild',
    FLUSH: 'flush',
    STRAIGHT: 'straight',
    KIND: 'kind'
  };

  function matchAcceptable(m) {
    var len = m.match.length;

    if(m.matchType === MATCH.KIND && len > 2) return true;
    if(m.matchType === MATCH.FLUSH && len > 3) return true;

    console.log({
      what: 'matchAcceptable unacceptable',
      m: m
    });

    return false;
  }

  function mergeMatch(orig) {
    return function (a, b) {
      if(a.matchType !== b.matchType) throw 'cannot merge matches with different match types';

      return {
        matchType: a.matchType,
        match: _.without(a.match.concat(b.match), orig).concat(orig)
      };
    };
  }

  function getBaseMatches(original) {
    return _.map([MATCH.FLUSH, MATCH.KIND], function(mt) {
      return {
        matchType: mt,
        match: [original]
      }
    });
  };

  // it's easier if we build up the matches along
  // with the type as we discover.
  // @param matches contains the matches so far
  function matchInDir(prev, dir, matches) {
    if(prev === null) return matches;

    var c = board.cardInDirection(prev, dir);
    console.log({
      what: 'matchInDir',
      prev: prev,
      dir: dir,
      next: c
    });
    if(c === null) return matches;

    // if the cards match, we need to know how they match
    // and add it to the corresponding match group
    var matchTypes = cardsMatch(prev, c, dir);
    if(matchTypes) {
      // we want to augment the passed matches
      // with the card, depending on how they match
      _.each(matches, function(match) {
        _.each(matchTypes, function(mt) {
          if(mt !== match.matchType && 
             mt.matchType !== MATCH.WILD) {
            return;
          }

          match.match.push(c);
        });
      });
      return matchInDir(c, dir, matches);
    }
    return matches;
  }
  //
  // returns false if the cards dont match in anyway. Otherwise,
  // returns an array containing the ways in which they match.
  function cardsMatch(a, b, dir) {
    if(!a || !b) return false;

    var av = a.jalCardValue,
    bv = b.jalCardValue;

    if( av.isWild || bv.isWild ) return [MATCH.WILD];

    var matchTypes = [];
    if( av.suit === bv.suit ) {
      matchTypes.push(MATCH.FLUSH);
    }

    if( av.value === bv.value ) {
      matchTypes.push(MATCH.KIND);
    }

    return matchTypes.length === 0 ? false : matchTypes;
  }
  // merges the passed matches by match type, making sure not to
  // double-count the anchor.
  function mergeMatches(anchor, all) {
    var parts = _.partition(all, function(m) {
      return m.matchType === MATCH.KIND
    }),
    kinds = parts[0],
    flushes = parts[1];

    console.log({
      what: 'mergeMatches',
      all: all,
      kinds: kinds,
      flushes: flushes
    });

    var merge = mergeMatch(anchor);

    return [_.reduce(kinds, merge)].concat(
      [_.reduce(flushes, merge)]);
  }

  // finds all the matches in the passed directions, and
  // merges them together by match type.
  function mergedMatchesInDirections(anchor, dirs) {
    var matches = _.reduce(dirs, function(mem, dir) {
      var matches = matchInDir(anchor, dir, getBaseMatches(anchor));
      return mem.concat(matches);
    }, []);

    return mergeMatches(anchor, matches);
  }

  // Use to return a group of cards that match
  var matchFromCard = this.matchFromCard = function(original) {
    console.log({
      what: 'matchCards',
      original: original
    });

    var merged = _.reduce(PM.Axis.All, function(mem, axis) {
      return mem.concat(mergedMatchesInDirections(original,axis));
    }, []);

    console.log({
      what: 'merged',
      merged: merged
    });

    return _.filter(merged, matchAcceptable);
  }

};


