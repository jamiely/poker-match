(function(){

  var CARD_SIZE = new Phaser.Point(140, 190);
  var CARD_SPACING = new Phaser.Point(2, 2);
  var BOARD_SIZE = new Phaser.Point(10, 6);
  var GAME_SIZE = new Phaser.Point(800, 600);
  // this is the amount of space for each cell
  var BOARD_SPACING = Phaser.Point.divide(GAME_SIZE, BOARD_SIZE);
  // now we need the ratio of the spacing to the size of each card
  var CARD_BOARD_RATIO = Phaser.Point.divide(
    BOARD_SPACING, 
    Phaser.Point.add(CARD_SIZE, CARD_SPACING));
  // take the lower of the two for the appropriate scale
  var CARD_SCALE = Math.min(CARD_BOARD_RATIO.x, CARD_BOARD_RATIO.y);
  console.log(CARD_SCALE);
  var CARD_SIZE_ADJ = CARD_SIZE.multiply(CARD_SCALE, CARD_SCALE);
  var CARD_SIZE_SPACED = Phaser.Point.add(CARD_SIZE_ADJ, CARD_SPACING);
  var DIRECTION = {
    UP: new Phaser.Point(0, -1), // up
    DOWN: new Phaser.Point(0, 1), // down
    RIGHT: new Phaser.Point(1, 0), // right
    LEFT: new Phaser.Point(-1, 0)
  };
  var AXIS = {
    HORIZONTAL: [DIRECTION.LEFT, DIRECTION.RIGHT],
    VERTICAL: [DIRECTION.DOWN, DIRECTION.UP]
  };
  var AXES = [AXIS.HORIZONTAL, AXIS.VERTICAL];

  var cards;
  var cardBacks;
  var selectedCard;
  var swapInProgress = false;

  var BOARD = null;

  var cardsKilled = [];

  var game = new Phaser.Game(GAME_SIZE.x, GAME_SIZE.y, Phaser.CANVAS, 'game', { 
    preload: preload, 
    create: create,
    render: render
  });

  function preload() {
    game.load.atlasXML(
      'cards', 
      'assets/sprites/playingCards.png', 
      'assets/sprites/playingCards.xml');
    game.load.atlasXML(
      'cardBacks',
      'assets/sprites/playingCardBacks.png', 
      'assets/sprites/playingCardBacks.xml');
  }

  function create() {
    spawnBoard();
  }

  function createCardbackForCard(card) {
    var back = cardBacks.create(card.x, card.y, 'cardBacks');
    back.frameName = "cardBack_green2.png";
    back.scale = _.clone(card.scale);
    back.scale.x = 0;
    return back;
  }

  // does not register card position in global board container.
  function createCard(i, j) {
    var card = cards.create(i * CARD_SIZE_SPACED.x,
                        j * CARD_SIZE_SPACED.y,
                        "cards");
    randomizeCardColor(card);
    card.jalCardValue = parseCardName(card._frame.name);
    card.name = card.jalCardValue.baseName;
    // we'll attach board coordinates directly to this sprite
    // for now for lack of knowledge of a better way to do it
    // using Phaser. It may be better to store this in a separate
    // hash.
    card.jalBoardCoordinates = new Phaser.Point(i, j);
    card.scale.setTo(CARD_SCALE, CARD_SCALE);
    card.inputEnabled = true;
    card.events.onInputDown.add(selectCard, this);
    card.events.onInputUp.add(releaseCard, this);

    return card;
  }

  // fill the screen with as many cards as possible
  function spawnBoard() {
    //BOARD_SIZE = new Phaser.Point(
      //Phaser.Math.floor(game.world.width / CARD_SIZE_SPACED.x),
      //Phaser.Math.floor(game.world.height / CARD_SIZE_SPACED.y));

    cards = game.add.group();
    cardBacks = game.add.group();

    BOARD = {}; // this init needs to happen before cards are created.
    for (var i = 0; i < BOARD_SIZE.x; i++)
    {
      for (var j = 0; j < BOARD_SIZE.y; j++)
      {
        var card = createCard(i, j);
        saveBoardCoords(card);
      }
    }

  }

  // updates the board coordinates in the global registry.
  function saveBoardCoords(c) {
    BOARD[c.jalBoardCoordinates.toString()] = c;
  }

  function cardAt(pt) {
    return BOARD[pt.toString()];
  }

  function ptInDir(pt, dir) {
    return Phaser.Point.add(pt, dir);
  }

  // dir is a point
  function cardInDirection(c, dir) {
    var coord = ptInDir(c.jalBoardCoordinates, dir);
    console.log({
      what: 'cardInDirection coord',
      coord: coord
    });
    return cardAt(coord);
  }

  // Use to return a group of cards that match
  function matchCards(original) {
    var depth = 0;
    console.log({
      what: 'matchCards',
      original: original
    });
    var MATCH = {
      WILD: 'wild',
      FLUSH: 'flush',
      KIND: 'kind'
    };
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
    // it's easier if we build up the matches along
    // with the type as we discover.
    // @param matches contains the matches so far
    function matchInDir(prev, dir, matches) {
      depth ++;
      if(depth > 100) return matches;

      if(prev === null) return matches;

      var c = cardInDirection(prev, dir);
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

    function getBaseMatches() {
      return _.map([MATCH.FLUSH, MATCH.KIND], function(mt) {
        return {
          matchType: mt,
          match: [original]
        }
      });
    };

    function matchAcceptable(m) {
      var len = m.match.length;

      if(m.matchType === MATCH.KIND && len > 1) return true;
      if(m.matchType === MATCH.FLUSH && len > 2) return true;

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

    // merges the passed matches by match type, making sure not to
    // double-count the original.
    function mergeMatches(original, all) {
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

      var merge = mergeMatch(original);

      return [_.reduce(kinds, merge)].concat(
        [_.reduce(flushes, merge)]);
    }

    // finds all the matches in the passed directions, and
    // merges them together by match type.
    function mergedMatchesInDirections(dirs) {
      return _.reduce(dirs, function(mem, dir) {
        return mem.concat(matchInDir(original, dir, getBaseMatches()));
      }, []);
    }

    var merged = _.reduce(AXES, function(mem, axis) {
      return mem.concat(mergedMatchesInDirections(axis));
    }, []);

    console.log({
      what: 'merged',
      merged: merged
    });

    return _.filter(merged, matchAcceptable);
  }

  // Determine if two cards are adjacent to each other.
  function isAdjacent(c1, c2) {
    var p1 = c1.jalBoardCoordinates, p2 = c2.jalBoardCoordinates;

    return (p1.x === p2.x && Math.abs(p1.y - p2.y) === 1) ||
      (p1.y === p2.y && Math.abs(p1.x - p2.x) === 1);
  }

  // TODO: should the swap have a shadow effect as one is lifted
  // over the other? We can scale the card larger as well to indicate
  // nearness.
  function swapCards(a, b) {
    // can't swap multiple cards at once.
    if(swapInProgress) {
      return;
    }

    var swapDuration = 250;
    console.log({
      event: 'swapping cards',
      a: a, b: b });
    swapInProgress = true;
    var easing = Phaser.Easing.Linear.None;
    function addTween(c1, c2) {
      return game.add.tween(c1).
        to( { x: c2.x, y: c2.y }, swapDuration, easing);
    }
    var tweens = [
      addTween(a, b),
      addTween(b, a)
    ];
    var tweenCountLeft = tweens.length;
    function tryMatches() {
      var matches = _.filter(_.map([a, b], function(card) {
        return {
          card: card,
          matches: matchCards(card)
        };
      }), function(m) {
        return m.matches && m.matches.length > 0;
      });
      console.log({
        what: 'matches',
        matches: matches
      });

      _.each(matches, function(m) {
        _.each(m.matches, disappearMatch);
      });
    }
    function swapCoordinates() {
      // swap the coordinates of the cards
      var tmpCoords = a.jalBoardCoordinates;
      a.jalBoardCoordinates = b.jalBoardCoordinates;
      b.jalBoardCoordinates = tmpCoords;
      saveBoardCoords(a);
      saveBoardCoords(b);
    }
    function onComplete() {
      tweenCountLeft --;
      if(tweenCountLeft === 0) {
        swapCoordinates();
        swapInProgress = false;
        console.log('swap complete');
        tryMatches();
      }
    }
    _.each(tweens, function(t) {
      t.onComplete.add(onComplete);
    });
    _.each(tweens, function(t) {
      t.start();
    });
    console.log('swap in progress');
  }

  function selectCard(card, pointer) {
    console.log(parseCardName(card._frame.name));
    console.log({
      what: 'card in direction down',
      card: cardInDirection(card, DIRECTION.DOWN)
    });
    if(selectedCard) {
      console.log('checking if selected card is adjacent');
      // if the card is adjacent to one already selected
      // then we perform the swap.
      if(isAdjacent(selectedCard, card)) {
        console.log('selected card is adjacent to this one');
        swapCards(selectedCard, card);
        selectedCard = null;
        return;
      }
    }
    console.log({
      event: 'select',
      card: card,
      pointer: pointer
    });
    selectedCard = card;
  }

  // Use to make a card flip. Returns a tween that you
  // can use for chaining.
  function flipCard(card) {
    var duration = 300 + Math.random() * 300,
      easing = Phaser.Easing.Linear.None;
    var origX = card.x;
    var origWidth = card.width;

    //card.anchor.setTo(.5, card.anchor.y);
    var posChange = game.add.tween(card).to({
      x: origX + origWidth
    }, duration, easing);

    var originalScale = card.scale.x;
    var halfScale = originalScale / 2.0;
    
    var firstHalf = game.add.tween(card.scale).to({ 
      x: - halfScale, 
      y: card.scale.y 
    }, 
      duration / 2, 
      easing);

    var t = firstHalf.to({
      x: - originalScale,
      y: card.scale.y},
      duration / 2,
      easing);

    t.onStart.add(function() {
      var back = createCardbackForCard(card);
      back.x = origX + origWidth / 2.0;
      game.add.tween(back.scale).to({
        x: originalScale,
        y: back.scale.y
      }, duration/2, easing).start();
      var backTween = game.add.tween(back).to({
        x: origX
      }, duration/2, easing);

      // withdraw card
      backTween.onComplete.addOnce(function() {
        killCard(card);
        game.add.tween(back).to({y: 1000}, 
                                500 * Math.random() + 500, 
                                Phaser.Easing.Linear.None).delay(500).start();
      });

      backTween.start();

      posChange.start();
    });

    return t;
  }

  function ptInBounds(pt) {
    return pt.x >= 0 && pt.x < BOARD_SIZE.x &&
      pt.y >= 0 && pt.y < BOARD_SIZE.y;
  }

  // drop the column from the passed starting point
  function dropColumnFromPt(pt, complete, newCardCreated) {
    complete = complete || function(){};

    console.log({
      what: 'dropColumnFromPt',
      pt: pt
    });


    var ptAbove = ptInDir(pt, DIRECTION.UP);
    var above = cardAt(ptAbove);
    var continueDropping = ptInBounds(ptAbove);
    if(! above) {
      if(continueDropping) {
        // dropping doesn't complete yet, so we have
        // to wait.
        console.log('recursively drop column');
        dropColumnFromPt(ptAbove, function() {
          // try again once this is complete.
          dropColumnFromPt(pt, complete, newCardCreated);
        }, newCardCreated);
        return;
      } else {
        if(cardAt(ptAbove)) {
          throw {
            pt: pt,
            ptAbove: ptAbove,
            message: 'there shouldnt be a card registered at a point out of bounds'
          };
        }
        if(newCardCreated) {
          throw {
            pt: pt,
            ptAbove: ptAbove,
            message: 'We shouldnt get here because a new card has already been created'
          };
        }
        above = createCard(ptAbove.x, ptAbove.y);
        console.log('create a new card to drop');
        newCardCreated = true;
      }
    }

    // set some properties so we know the card is
    // dropping
    above.dropping = {
      newBoardCoordinates: pt
    };
    above.inputEnabled = false;

    // perform the actual drop now. we want to tween
    // the card's position to the one below it.
    //
    var newLocation = ptForBoardAt(pt);
    var fallDelay = 250;
    var fallDuration = 250 + Math.random()*250;
    // TODO: change easing to bounce.
    var easing = Phaser.Easing.Bounce.Out;
    var tween = game.add.tween(above).to({
      x: newLocation.x,
      y: newLocation.y},
      fallDuration,
      easing).delay(fallDelay);
    tween.onComplete.add(function() {
      above.jalBoardCoordinates = pt;
      above.inputEnabled = true;
      saveBoardCoords(above);
      // clear the metadata on this
      delete above.dropping;
      //complete();
      // move this outside the on completion once
      // we resolve some more of the problems.
      if(continueDropping) {
        console.log('continue dropping');
        dropColumnFromPt(ptAbove, complete, newCardCreated);
      } else {
        complete();
      }
    });
    tween.start();

  }

  // provides the x-y coordinate for passed board position.
  function ptForBoardAt(pos) {
    return new Phaser.Point(pos.x * CARD_SIZE_SPACED.x,
                            pos.y * CARD_SIZE_SPACED.y);
  }

  function dropCards() {
    console.log('dropping cards');
    var cols = {};

    // find the lowest point in each col
    _.each(cardsKilled, function(k) {
      var c = k.boardCoordinates.x;
      if(!cols[c] || 
         (cols[c] && cols[c].y < k.boardCoordinates.y)) {
        cols[c] = k.boardCoordinates;
      }
    });
    _.each(_.values(cols), function(coords) {
      dropColumnFromPt(coords);
    });
    cardsKilled = [];
  }

  function killCard(card) {
    // clear the board cache
    BOARD[card.jalBoardCoordinates.toString()] = null;
    cardsKilled.push({
      boardCoordinates: card.jalBoardCoordinates,
      cardValue: card.jalCardValue
    });
    card.kill();
  }

  // Use to remove a match
  function disappearMatch(match) {
    var count = match.match.length;
    function onMatchDisappearComplete() {
      count --;
      if(count > 0) {
        return;
      }

      // drop all the cards
      dropCards();
    }
    _.each(match.match, function(card) {
      var t = flipCard(card)
      t.onComplete.add(onMatchDisappearComplete);
      t.start();
    });
  }

  function releaseCard(card, pointer) {
    console.log({
      event: 'release',
      card: card,
      pointer: pointer
    });
  }

  // given a card name, parses into values
  function parseCardName(name) {
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

  function randomizeCardColor(card) {
    card.frame = 
      game.rnd.integerInRange(0, 52);
  }

  function render() {
    if(selectedCard) {
      game.debug.spriteBounds(selectedCard, 'rgba(0, 0, 255, .2)');
    }
  }
})();



