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

  var cards;
  var cardBacks;
  var selectedCard;
  var swapInProgress = false;

  var BOARD = null;

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

  // fill the screen with as many cards as possible
  function spawnBoard() {
    //BOARD_SIZE = new Phaser.Point(
      //Phaser.Math.floor(game.world.width / CARD_SIZE_SPACED.x),
      //Phaser.Math.floor(game.world.height / CARD_SIZE_SPACED.y));

    cards = game.add.group();
    cardBacks = game.add.group();

    for (var i = 0; i < BOARD_SIZE.x; i++)
    {
      for (var j = 0; j < BOARD_SIZE.y; j++)
      {
        var card = cards.create(i * CARD_SIZE_SPACED.x, 
                                j * CARD_SIZE_SPACED.y, 
                                "cards");
        card.name = 'card' + i.toString() + 'x' + j.toString();
        // we'll attach board coordinates directly to this sprite
        // for now for lack of knowledge of a better way to do it
        // using Phaser. It may be better to store this in a separate
        // hash.
        card.jalBoardCoordinates = new Phaser.Point(i, j);
        card.scale.setTo(CARD_SCALE, CARD_SCALE);
        card.inputEnabled = true;
        card.events.onInputDown.add(selectCard, this);
        card.events.onInputUp.add(releaseCard, this);
        randomizeCardColor(card);
        card.jalCardValue = parseCardName(card._frame.name);
        setCardPos(card, i, j); // each card has a position on the board
      }
    }

    BOARD = {};
    cards.forEachAlive(saveBoardCoords);
  }

  function saveBoardCoords(c) {
    var i = c.jalBoardCoordinates.toString();
    BOARD[i] = c;
  }

  var DIRECTION = {
    UP: new Phaser.Point(0, -1), // up
    DOWN: new Phaser.Point(0, 1), // down
    RIGHT: new Phaser.Point(1, 0), // right
    LEFT: new Phaser.Point(-1, 0)
  };

  // dir is a point
  function cardInDirection(c, dir) {
    var coord = Phaser.Point.add(c.jalBoardCoordinates, dir);
    console.log({
      what: 'cardInDirection coord',
      coord: coord
    });
    return BOARD[coord.toString()];
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

    var merged = mergeMatches(
        original,
        matchInDir(original, DIRECTION.LEFT, getBaseMatches()).concat(
        matchInDir(original, DIRECTION.RIGHT, getBaseMatches()))
      );

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
    var duration = 1000,
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
        card.kill();
        game.add.tween(back).to({y: 1000}, 
                                1000, 
                                Phaser.Easing.Linear.None).delay(500).start();
      });

      backTween.start();

      posChange.start();
    });

    return t;
  }

  // Use to remove a match
  function disappearMatch(match) {
    _.each(match.match, function(card) {
      flipCard(card).start();
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

  // set the position on the board for a card
  function setCardPos(card, posX, posY) {
    card.posX = posX;
    card.posY = posY;
    card.id = calcCardId(posX, posY);
  }

  // the gem id is used by getGem() to find specific gems in the group
  // each position on the board has a unique id
  function calcCardId(posX, posY) {
    return posX + posY * BOARD_SIZE.x;
  }

  function render() {
    if(selectedCard) {
      game.debug.spriteBounds(selectedCard, 'rgba(0, 0, 255, .2)');
    }
  }
})();



