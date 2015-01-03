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
    if(m.matchType === MATCH.FLUSH && len > 4) return true;
    if(m.matchType === MATCH.STRAIGHT && len > 2) return true;

    //console.log({
      //what: 'matchAcceptable unacceptable',
      //m: m
    //});

    return false;
  }

  function mergeUnion(orig, a, b) {
    return function (a, b) {
      if(a.matchType !== b.matchType) throw 'cannot merge matches with different match types';

      return {
        matchType: a.matchType,
        match: _.without(a.match.concat(b.match), orig).concat([orig])
      };
    };
  }

  function validCardPredicate(a, b) {
    return a && b && a.jalCardValue && b.jalCardValue;
  }

  function kindPredicate(a, b) {
    return validCardPredicate(a, b) && 
      a.jalCardValue.value === b.jalCardValue.value;
  }

  function flushPredicate(a, b) {
    return validCardPredicate(a, b) && 
      a.jalCardValue.suit === b.jalCardValue.suit;
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
      container(MATCH.FLUSH, function(dir){ return flushPredicate}),
      container(MATCH.KIND, function(dir) { return kindPredicate}),
      // this only goes backwards
      container(MATCH.STRAIGHT, function(dir) {
        // capture this value for the next iteration
        var nextValue = getNextStraightValue(nextStraightValues[dir.toString()], dir);
        nextStraightValues[dir.toString()] = nextValue;
        return function(a, b) {
          //console.log({
            //what: 'straight predicate',
            //nextValue: nextValue,
            //aCV: a.jalCardValue,
            //aBC: a.jalBoardCoordinates,
            //bCV: b.jalCardValue,
            //bBC: b.jalBoardCoordinates,
            //dir: dir,
            //nextStraightValues: nextStraightValues,
            //originalCV: original.jalCardValue,
            //originalBC: original.jalBoardCoordinates
          //});
          return validCardPredicate(a, b) && 
            nextValue !== null &&
            b.jalCardValue.value === nextValue;
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

    //console.log({
      //what: 'mergeMatches',
      //all: all,
      //kinds: kinds,
      //flushes: flushes
    //});

    var merge = mergeUnion(anchor);

    var results = _.map(_.keys(parts), function(matchType) {
      var reduced = _.reduce(parts[matchType], merge);
      return reduced;
    });


    return results;
  }

  // finds all the matches in the passed directions, and
  // merges them together by match type.
  function mergedMatchesInDirections(anchor, dirs) {
    var matches = _.reduce(dirs, function(mem, dir) {
      var matches = matchInDir(anchor, dir, getBaseMatches(anchor));
      
      return mem.concat(matches);
    }, []);
    var straights = _.filter(matches, function(m){
      return m.matchType === MATCH.STRAIGHT;
    });

    return mergeMatches(anchor, matches);
  }

  // Use to return a group of cards that match
  var matchFromCard = this.matchFromCard = function(original) {
    //console.log({
      //what: 'matchCards',
      //original: original
    //});

    var merged = _.reduce(PM.Axis.All, function(mem, axis) {
      return mem.concat(mergedMatchesInDirections(original,axis));
    }, []);

    //console.log({
      //what: 'merged',
      //merged: merged
    //});

    return _.filter(merged, matchAcceptable);
  }

};


