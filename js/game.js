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
  }

  function create() {
    spawnBoard();
  }

  // fill the screen with as many cards as possible
  function spawnBoard() {
    //BOARD_SIZE = new Phaser.Point(
      //Phaser.Math.floor(game.world.width / CARD_SIZE_SPACED.x),
      //Phaser.Math.floor(game.world.height / CARD_SIZE_SPACED.y));

    cards = game.add.group();

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
    function cardsMatch(a, b, dir) {
      if(!a || !b) return false;

      var av = a.jalCardValue,
          bv = b.jalCardValue;
      if( av.isWild || bv.isWild ) return true;
      if( av.suit === bv.suit ) return true;
      if( av.value === bv.value ) return true;

      return false;
    }
    function matchInDir(prev, dir) {
      depth ++;
      if(depth > 100) return [];

      if(prev === null) return [];

      var c = cardInDirection(prev, dir);
      console.log({
        what: 'matchInDir',
        prev: prev,
        dir: dir,
        next: c
      });
      if(c === null) return [];

      if(cardsMatch(prev, c, dir)) {
        return [c].concat(matchInDir(c, dir));
      }
      return [];
    }

    return [original].
      concat(matchInDir(original, DIRECTION.LEFT)).
      concat(matchInDir(original, DIRECTION.RIGHT));
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
      var matches = _.map([a, b], function(card) {
        return matchCards(card);
      });
      console.log({
        what: 'matches',
        matches: matches
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



