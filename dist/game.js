// the main namespace. Stands for Poker Match
var PM = PM || {};


PM.App = PM.App || function(config) {
  var gb = new PM.GameBoard(config);
  var board = gb.board;
  var matcher = new PM.Matcher(board);
  var game = gb.game;
  var cardSelector = new PM.CardSelector(board, function(a, b) {
    cardSwapper.swap(a, b);
  });
  var cardFactory = new PM.CardFactory(gb, cardSelector);
  var renderer = new PM.Renderer(game, function() {
    return cardSelector.getSelected();
  });
  var cardSwapper = new PM.CardSwapper({
    gameBoard: gb,
    matcher: matcher,
    cardFactory: cardFactory
  });
  var gameState = { 
    preload: preload, 
    create: create,
    render: renderer.render
  };
  game.state.add('main', gameState);

  // accessible from outside
  this.run = function() {
    game.state.start('main');
  };

  function preload() {
    new PM.Preloader(game).preload();
  }

  function create() {
    spawnBoard();
  }

  // fill the screen with as many cards as possible
  function spawnBoard() {
    gb.board.saveCards(cardFactory.createInitialCards());
  }
};


PM.Board = PM.Board || function(boardSize) {
  var BOARD;

  var reset = this.reset = function () {
    BOARD = {};
  };

  var saveCards = this.saveCards = function(cards) {
    reset(); // this init needs to happen before cards are created.
    _.each(cards, saveBoardCoords);
  };

  // saves the coordinates of the passed card
  var saveBoardCoords = this.saveBoardCoords = function (c) {
    BOARD[c.jalBoardCoordinates.toString()] = c;
  };

  // returns the card at the passed point
  var cardAt = this.cardAt = function (pt) {
    return BOARD[pt.toString()];
  };

  var removeCard = this.removeCard = function (card) {
    // clear the board cache
    BOARD[card.jalBoardCoordinates.toString()] = null;
  };

  // dir is a point
  var cardInDirection = this.cardInDirection = function(c, dir) {
    var coord = PM.Direction.pointInDir(c.jalBoardCoordinates, dir);
    return cardAt(coord);
  };
  
  // Determine if two cards are adjacent to each other.
  var isAdjacent = this.isAdjacent = function(c1, c2) {
    var p1 = c1.jalBoardCoordinates, p2 = c2.jalBoardCoordinates;

    return (p1.x === p2.x && Math.abs(p1.y - p2.y) === 1) ||
      (p1.y === p2.y && Math.abs(p1.x - p2.x) === 1);
  };

  var ptInBounds = this.ptInBounds = function(pt) {
    return pt.x >= 0 && pt.x < boardSize.x &&
      pt.y >= 0 && pt.y < boardSize.y;
  };

  // reset the first time
  reset();
};


PM.BoardParser = PM.BoardParser || function() {
  // parses board in pipe delimited format.
  // "A♠|9♥|A♠|9♥|A♠"
  // "9♥|A♠|9♥|A♠|9♥"
  // "A♠|9♥|A♠|9♥|A♠"
  // "9♥|A♠|9♥|A♠|9♥"
  // "A♠|9♥|A♠|9♥|A♠"
  //♠
  //♥
  //♦
  //♣
  var cardParser = new PM.UnicodeParser();
  var parse = this.parse = function(str) {
    var lines = str.split('\n');
    var rows = _.map(lines, function(line) {
      var cols = line.split('|');
      return _.map(cols, function(cell) {
        return cardParser.parse(cell);
      });
    });
    if(rows.length === 0) return null;

    var cols = rows[0].length;
    var cards = [];
    for(var r = 0; r < rows.length; r++) {
      for(var c = 0; c < cols; c++) {
        cards.push({
          jalBoardCoordinates: new Phaser.Point(c, r),
          jalCardValue: rows[r][c]
        });
      }
    }

    var board = new PM.Board();
    board.saveCards(cards);

    return board;
  };
};


PM.CardFactory = PM.CardFactory || function(gameBoard, cardSelector) {
  var game = gameBoard.game;
  var board = gameBoard.board;
  var config = gameBoard.config;
  var cards;
  var cardBacks;
  var cardNameParser = new PM.CardNameParser();

  var killCard = this.killCard = function(card) {
    // clear the board cache
    gameBoard.board.removeCard(card);
    card.kill();
  };

  var createCardbackForCard = this.createCardbackForCard = function(card) {
    var back = cardBacks.create(card.x, card.y, 'cardBacks');
    back.frameName = "cardBack_green2.png";
    back.scale = _.clone(card.scale);
    back.scale.x = 0;
    return back;
  };

  // fill the screen with as many cards as possible
  var createInitialCards = this.createInitialCards = function() {
    cards = game.add.group();
    cardBacks = game.add.group();

    var cs = [];
    for (var i = 0; i < config.boardSize.x; i++)
    {
      for (var j = 0; j < config.boardSize.y; j++)
      {
        cs.push(createCard(i, j));
      }
    }

    return cs;
  }

  function randomizeCardColor(card) {
    card.frame = 
      game.rnd.integerInRange(0, 52);
  }

  // does not register card position in global board container.
  var createCard = this.createCard = function(i, j) {
    var card = cards.create(i * config.cardSizeSpaced.x,
                        j * config.cardSizeSpaced.y,
                        "cards");
    randomizeCardColor(card);
    card.jalCardValue = cardNameParser.parse(card._frame.name);
    card.name = card.jalCardValue.baseName;
    // we'll attach board coordinates directly to this sprite
    // for now for lack of knowledge of a better way to do it
    // using Phaser. It may be better to store this in a separate
    // hash.
    card.jalBoardCoordinates = new Phaser.Point(i, j);
    card.scale.setTo(config.cardScale, config.cardScale);
    card.inputEnabled = true;
    card.events.onInputDown.add(cardSelector.selectCard, this);
    card.events.onInputUp.add(cardSelector.releaseCard, this);

    return card;
  }

};


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
        name: s.toLowerCase(),
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


PM.CardSelector = PM.CardSelector || function(board, onSelect) {
  var selectedCard;
  var getSelected = this.getSelected = function() {
    return selectedCard;
  };

  var releaseCard = this.releaseCard = function(card, pointer) {
    console.log({
      event: 'release',
      card: card,
      pointer: pointer
    });
  };

  var selectCard = this.selectCard = function(card, pointer) {
    console.log(card.jalCardValue);
    console.log({
      what: 'card in direction down',
      card: board.cardInDirection(card, PM.Direction.Down)
    });
    if(selectedCard) {
      console.log('checking if selected card is adjacent');
      // if the card is adjacent to one already selected
      // then we perform the swap.
      if(board.isAdjacent(selectedCard, card)) {
        console.log('selected card is adjacent to this one');
        onSelect(selectedCard, card);
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
};


PM.CardSwapper = PM.CardSwapper || function(args) {
  var game = args.gameBoard.game;
  var board = args.gameBoard.board;
  var config = args.gameBoard.config;
  var matcher = args.matcher;
  var createCardbackForCard = args.cardFactory.createCardbackForCard;
  var killCard = args.cardFactory.killCard;
  var createCard = args.cardFactory.createCard;

  var swapInProgress = false;
  var cardsKilled = [];
  //
  // provides the x-y coordinate for passed board position.
  function ptForBoardAt(pos) {
    return new Phaser.Point(pos.x * config.cardSizeSpaced.x,
                            pos.y * config.cardSizeSpaced.y);
  }

  // TODO: should the swap have a shadow effect as one is lifted
  // over the other? We can scale the card larger as well to indicate
  // nearness.
  var swap = this.swap = _.bind(function(a, b) {
    // can't swap multiple cards at once.
    if(swapInProgress) {
      return;
    }

    var swapDuration = 100;
    console.log({
      event: 'swapping cards',
      a: a, b: b });
    swapInProgress = true;
    var easing = Phaser.Easing.Quadratic.Out;
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
          matches: matcher.matchFromCard(card)
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
      board.saveBoardCoords(a);
      board.saveBoardCoords(b);
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
      t.start();
    });
    console.log('swap in progress');
  }, this);

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
        cardsKilled.push({
          boardCoordinates: card.jalBoardCoordinates,
          cardValue: card.jalCardValue
        });
        game.add.tween(back).to({y: 1000}, 
                                500 * Math.random() + 500, 
                                Phaser.Easing.Linear.None).delay(500).start();
      });

      backTween.start();

      posChange.start();
    });

    return t;
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

  // drop the column from the passed starting point
  function dropColumnFromPt(pt, complete, newCardCreated) {
    complete = complete || function(){};

    console.log({
      what: 'dropColumnFromPt',
      pt: pt
    });

    var ptAbove = PM.Direction.pointInDir(pt, PM.Direction.Up);
    var above = board.cardAt(ptAbove);
    var continueDropping = board.ptInBounds(ptAbove);
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
        if(board.cardAt(ptAbove)) {
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
    var fallDelay = 0;
    var fallDuration = 100 + Math.random()*250;
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
      board.saveBoardCoords(above);
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

};




// Holds configuration with appropriate defaults
PM.Configuration = PM.Configuration || function() {
  this.cardSize = new Phaser.Point(140, 190);
  this.cardSpacing = new Phaser.Point(2, 2);
  this.boardSize = new Phaser.Point(10, 5);
  this.gameSize = new Phaser.Point(800, 600);
  // this is the amount of space for each cell
  this.boardSpacing = Phaser.Point.divide(this.gameSize, this.boardSize);
  // now we need the ratio of the spacing to the size of each card
  this.cardBoardRatio = Phaser.Point.divide(
    this.boardSpacing, 
    Phaser.Point.add(this.cardSize, this.cardSpacing));

  // take the lower of the two for the appropriate scale
  this.cardScale = Math.min(this.cardBoardRatio.x, this.cardBoardRatio.y);

  console.log(this.cardScale);
  this.cardSizeAdj = this.cardSize.multiply(this.cardScale, this.cardScale);
  this.cardSizeSpaced = Phaser.Point.add(this.cardSizeAdj, this.cardSpacing);

  this.element = 'game';
};

(function() {
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

  PM.Direction = PM.Direction || {
    Up: DIRECTION.UP,
    Down: DIRECTION.DOWN,
    Left: DIRECTION.LEFT,
    Right: DIRECTION. RIGHT,
    All: AXIS.HORIZONTAL.concat(AXIS.VERTICAL),
    pointInDir: function(pt, dir) {
      return Phaser.Point.add(pt, dir);
    }
  };

  PM.Axis = AXIS;
  PM.Axis.All = AXES;
})();

PM.GameBoard = PM.GameBoard || function(config) {
  this.config = config;
  this.board = new PM.Board(config.boardSize);
  this.game = new Phaser.Game(config.gameSize.x, 
                              config.gameSize.y, 
                              Phaser.CANVAS, 
                              config.element);
};


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



PM.Preloader = PM.Preloader || function(game) {
  this.preload = function() {
    return {
      cards: {
        loader: game.load.atlasXML(
          'cards', 
          'assets/sprites/playingCards.png', 
          'assets/sprites/playingCards.xml'),
          name: 'cards'
      },
      cardBacks: {
        loader: game.load.atlasXML(
          'cardBacks',
          'assets/sprites/playingCardBacks.png', 
          'assets/sprites/playingCardBacks.xml'),
          name: 'cardBacks'
      }
    };
  }
};


PM.Renderer = PM.Renderer || function(game, getSelectedCard) {
  var render = this.render = _.bind(function() {
    var c = getSelectedCard();
    if(c) {
      game.debug.spriteBounds(c, 'rgba(0, 0, 255, .2)');
    }
  }, this);
};


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

