PM.Matcher = PM.Matcher || function(board, config) {
  config = config || {};

  var MATCH = {
    WILD: 'wild',
    FLUSH: 'flush',
    STRAIGHT: 'straight',
    KIND: 'kind'
  };
  var debug = false;
  var reconciler = new PM.MatchReconciler();
  var minimumFlushLength = config.minimumFlushLength || 5;

  function log(what) {
    if(! debug) return;
    console.log(what);
  }

  function prettyMatch(m) {
    m._matchHash = reconciler.matchDisplay(m);
    return m;
  }

  function matchAcceptable(m) {
    var len = m.match.length;

    if(m.matchType === MATCH.KIND && len > 2) return true;
    if(m.matchType === MATCH.FLUSH && len >= minimumFlushLength) return true;
    if(m.matchType === MATCH.STRAIGHT && len > 2) return true;

    //console.log({
      //what: 'matchAcceptable unacceptable',
      //m: m
    //});

    return false;
  }

  // returns distinct cards based on location
  function distinctCards(cards) {
    var cache = {};
    _.each(cards, function(c) {
      var key = c.jalBoardCoordinates.toString();
      if(cache[key]) return;

      cache[key] = c;
    });
    return _.values(cache);
  }

  function mergeUnion(orig) {
    return function (a, b) {
      if(a.matchType !== b.matchType) {
        throw 'cannot merge matches with different match types';
      }

      return {
        matchType: a.matchType,
        match: distinctCards(_.flatten([a.match,b.match,[orig]]))
      };
    };
  }

  function validCardPredicate(a, b) {
    return a && b && a.jalCardValue && b.jalCardValue;
  }

  function kindPredicate(orig) {
    return function (a, b) {
      return validCardPredicate(a, b) && 
        orig.jalCardValue.value == a.jalCardValue.value &&
        a.jalCardValue.value === b.jalCardValue.value;
    };
  }

  function flushPredicate(orig) {
    return function (a, b) {
      return validCardPredicate(a, b) && 
        orig.jalCardValue.suit == a.jalCardValue.suit &&
        a.jalCardValue.suit === b.jalCardValue.suit;
    };
  }

  var straightOrder = '2 3 4 5 6 7 8 9 10 J Q K A'.split(' ');
  function isStraightIncDir(dir) {
    return dir === PM.Direction.Right || dir === PM.Direction.Down;
  }
  function getNextStraightValue(v, dir) {
    var i = straightOrder.indexOf(v);
    if(i === -1) return null;

    if(isStraightIncDir(dir)) i++;
    else i--;

    return i >= 0 || i < straightOrder.length ? straightOrder[i] : null;
  }

  function getBaseMatches(original) {
    function container(ty, nextPredicate) {
      return {
        matchType: ty,
        match: [original],
        nextPredicate: nextPredicate
      };
    }
    // close over the original value
    var nextStraightValues = _.reduce(PM.Direction.All, function(mem, dir) {
      mem[dir.toString()] = original.jalCardValue.value;
      return mem;
    }, {});
    return [
      container(MATCH.FLUSH, function(dir) { 
        return flushPredicate(original); 
      }),
      container(MATCH.KIND, function(dir) { 
        return kindPredicate(original);
      }),
      // this only goes backwards
      container(MATCH.STRAIGHT, function(dir) {
        // capture this value for the next iteration
        var nextValue = getNextStraightValue(nextStraightValues[dir.toString()], dir);
        nextStraightValues[dir.toString()] = nextValue;
        return function(a, b) {
          var result = validCardPredicate(a, b) && 
            nextValue !== null &&
            b.jalCardValue.value === nextValue;

          if(!result) {
            // invalidate this predicate
            nextStraightValues[dir.toString()] = null;
          }

          return result;
        };
      })
    ];
  };

  // it's easier if we build up the matches along
  // with the type as we discover.
  // @param matches contains the matches so far
  function matchInDir(prev, dir, matches) {
    if(prev === null) return matches;

    var c = board.cardInDirection(prev, dir);
    //console.log({
      //what: 'matchInDir',
      //prev: prev,
      //dir: dir,
      //next: c
    //});
    if(c === null) return matches;

    var anyMatches = false;
    _.each(matches, function(match) {
      var pred = match.nextPredicate(dir);
      if(pred(prev, c)) {
        anyMatches = true;
        match.match.push(c);
      }
    });

    if(anyMatches) {
      return matchInDir(c, dir, matches);
    }

    return matches;
  }
  // merges the passed matches by match type, making sure not to
  // double-count the anchor.
  function mergeMatches(anchor, all) {
    var parts = _.groupBy(all, function(m) {
      return m.matchType;
    });

    var merge = mergeUnion(anchor);

    var results = _.map(_.keys(parts), function(matchType) {
      var reduced = _.reduce(parts[matchType], merge);
      return reduced;
    });

    log({
      what: 'mergeMatches',
      all: all,
      parts: parts,
      merge: merge,
      results: _.map(results, prettyMatch)
    });


    return results;
  }

  function makeMatchCardsDistinct(m) {
    m.match = distinctCards(m.match);
    return m;
  }

  // finds all the matches in the passed directions, and
  // merges them together by match type.
  function mergedMatchesInDirections(anchor, dirs) {
    var matches = _.reduce(dirs, function(mem, dir) {
      var matches = matchInDir(anchor, dir, getBaseMatches(anchor));
      log({
        what: 'mergedMatchesInDirections matchInDir',
        dir: dir,
        anchor: anchor,
        matches: _.map(matches, prettyMatch)
      });
      matches = _.map(matches, makeMatchCardsDistinct);
      log({
        what: 'mergedMatchesInDirections makeMatchCardsDistinct',
        matches: _.map(matches, prettyMatch)
      });
      return mem.concat(matches);
    }, []);
    var straights = _.filter(matches, function(m){
      return m.matchType === MATCH.STRAIGHT;
    });
    log({
      what: 'mergedMatchesInDirections',
      straights: straights,
      allMatches: _.map(matches, prettyMatch),
      anchor: anchor,
      dirs: dirs
    });

    return mergeMatches(anchor, matches);
  }

  // Use to return a group of cards that match
  var matchFromCard = this.matchFromCard = function(original) {
    log({
      what: 'matchCards',
      original: original
    });

    var merged = _.reduce(PM.Axis.All, function(mem, axis) {
      var m = mergedMatchesInDirections(original,axis);
      log({
        what: 'merged reduced mergedMatchesInDirections',
        matches: _.map(m, prettyMatch)
      });
      return mem.concat(m);
    }, []);

    log({
      what: 'merged',
      merged: _.map(merged, prettyMatch)
    });

    return _.filter(merged, matchAcceptable);
  }

};


