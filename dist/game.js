// the main namespace. Stands for Poker Match
var PM = PM || {};


PM.App = PM.App || function(config) {
  var game = new Phaser.Game(config.gameSize.x, 
                              config.gameSize.y, 
                              Phaser.CANVAS, 
                              config.element);
  var gb = new PM.GameBoard(game, config);
  game.state.add('score-attack', new PM.GameStates.ScoreAttack(gb));
  game.state.add('playing', new PM.GameStates.Playing(gb));
  game.state.add('main-menu', new PM.GameStates.MainMenu(game));

  var run = this.run = function() {
    game.state.start('main-menu');
  };
};


PM.Board = PM.Board || function(boardSize) {
  var BOARD;

  var reset = this.reset = function () {
    BOARD = {};
  };

  var getCards = this.getCards = function() {
    return _.values(BOARD);
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

  var Dir = PM.Direction;

  var Diagonal = {
    NE: new Phaser.Point(Dir.Right.x, Dir.Up.y),
    SE: new Phaser.Point(Dir.Right.x, Dir.Down.y),
    SW: new Phaser.Point(Dir.Left.x, Dir.Down.y),
    NW: new Phaser.Point(Dir.Left.x, Dir.Up.y)
  };
  Diagonal.All = _.values(Diagonal);

  console.log(Diagonal);

  var isAdjacentOrDiagonal = this.isAdjacentOrDiagonal = function(c1, c2) {
    if(isAdjacent(c1, c2)) return true;
    var p1 = c1.jalBoardCoordinates, p2 = c2.jalBoardCoordinates;

    return _.some(Diagonal.All, function(diag) {
      return Phaser.Point.add(p1, diag).equals(p2);
    });
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


PM.ButtonFactory = function(game) {
  var uiAtlasName = 'ui';

  this.preload = function() {
    game.load.atlasXML(
      uiAtlasName, 
      'assets/sprites/blueSheet.png', 
      'assets/sprites/blueSheet.xml');
  };

  var newButton = this.newButton = function (strText, clickHandler) {
    var group = game.add.group();

    var style = { 
      font: "20px Arial", 
      fill: "#EEEEEE", 
      align: "center" 
    };
    var text = game.add.text(100, 100, strText, style);
    text.anchor.setTo(0.5, 0.5);
    var button = game.add.button(
      100, 
      100, 
      uiAtlasName, 
      clickHandler, 
      this,
      'blue_button03.png',
      'blue_button03.png',
      'blue_button03.png',
      'blue_button03.png');
    button.anchor.setTo(0.5, 0.5);

    group.addChild(button);
    group.addChild(text);

    return group;
  }
};


PM.CardFactory = PM.CardFactory || function(gameBoard, cardSelector) {
  var game = gameBoard.game;
  var board = gameBoard.board;
  var config = gameBoard.config;
  var cards;
  var cardBacks;
  var cardNameParser = new PM.CardNameParser();
  var allowJokers = false;

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
    if(!allowJokers &&
       card.frameName == 'cardJoker.png') {
      randomizeCardColor(card);
    }
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
    var padding = config.cardPadding;
    card.hitArea = new Phaser.Rectangle(padding.x, padding.y, 
                                        card.width - 2*padding.x, card.height-2*padding.y);
    card.scale.setTo(config.cardScale, config.cardScale);
    card.inputEnabled = true;

    if(cardSelector.onCardDown) {
      card.events.onInputDown.add(cardSelector.onCardDown, this);
    }
    if(cardSelector.onCardUp) {
      card.events.onInputUp.add(cardSelector.onCardUp, this);
    }
    if(cardSelector.onCardOver) {
      card.events.onInputOver.add(cardSelector.onCardOver, this);
    }

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
    return [selectedCard];
  };

  var onCardUp = this.onCardUp = function(card, pointer) {
    console.log({
      event: 'release',
      card: card,
      pointer: pointer
    });
  };

  var onCardDown = this.onCardDown = function(card, pointer) {
    console.log(card.jalCardValue);
    console.log({
      what: 'card in direction down',
      card: board.cardInDirection(card, PM.Direction.Down)
    });
    if(selectedCard) {
      if(selectedCard === card) {
        selectedCard = null;
        return;
      }

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


PM.CardSelectorDrag = function(board, onSelect) {
  var lastCard;
  var selectedCards = [];
  var getSelected = this.getSelected = function() {
    return selectedCards;
  };

  var onCardUp = this.onCardUp = function(card, pointer) {
    var copy = _.clone(selectedCards);
    resetSelected();
    console.log({
      what: "oncardup selected cards",
      cards: copy
    });
    onSelect(copy);
  };

  var onCardDown = this.onCardDown = function(card, pointer) {
    initSelected(card);
  };

  function resetSelected() {
    lastCard = null;
    selectedCards = [];
  }

  function initSelected(card) {
    lastCard = card;
    selectedCards = [card];
  }

  var onCardOver = this.onCardOver = function(card, pointer) {
    console.log(card);
    console.log(card.hitArea);
    if(! pointer.isDown) {
      return;
    }
    if(! lastCard) {
      return;
    }

    // undo last selection by going back over the card
    if(selectedCards.length > 1 && 
       selectedCards[selectedCards.length - 2] === card) {
      selectedCards.pop();
      lastCard = selectedCards[selectedCards.length - 1];
      return;
    }

    if(selectedCards.indexOf(card) !== -1) {
      // cannot select a card twice
      console.log('card already selected');
      return;
    }

    if(board.isAdjacentOrDiagonal(lastCard, card)) {
      console.log('selected card is adjacent to this one');
      selectedCards.push(card);
      lastCard = card;
    } else {
      console.log('card over is not adjacent to last');
    }
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
  var debug = false;
  var shouldContinue = true;

  var stop = this.stop = function() {
    shouldContinue = false;
  };

  function log(what) {
    if(! debug) return;

    console.log(what);
  }

  var signalCardGroupDropped = this.signalCardGroupDropped = new Phaser.Signal();
  var signalMatchFound = this.signalMatchFound = new Phaser.Signal();

  var swapInProgress = false;
  var cardsKilled = [];
  //
  // provides the x-y coordinate for passed board position.
  function ptForBoardAt(pos) {
    return new Phaser.Point(pos.x * config.cardSizeSpaced.x,
                            pos.y * config.cardSizeSpaced.y);
  }

  var tryMatches = this.tryMatches = function(cards) {
    //var matches = _.filter(_.map(cards, function(card) {
      //return {
        //card: card,
        //matches: matcher.matchFromCard(card)
      //};
    //}), function(m) {
      //return m.matches && m.matches.length > 0;
    //});

    var matches = matcher.getMatches(cards);

    //matches = _.filter(matches, function(m) {
      //return m.matches && m.matches.length > 0;
    //});

    //var allMatches = _.reduce(matches, function(memo, m) {
      //return memo.concat(m.matches);
    //}, []);

    //var unique = new PM.MatchReconciler().uniqueMatches(allMatches);
    var unique = matches;

    console.log({
      what: 'tryMatches',
      matches: matches,
      //allMatches: allMatches,
      uniqueMatches: unique
    });

    _.each(unique, function(m) {
      signalMatchFound.dispatch(m);
      disappearMatch(m);
    });
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
    function swapCoordinates() {
      // swap the coordinates of the cards
      var tmpCoords = a.jalBoardCoordinates;
      a.jalBoardCoordinates = b.jalBoardCoordinates;
      b.jalBoardCoordinates = tmpCoords;
      board.saveBoardCoords(a);
      board.saveBoardCoords(b);
    }
    var tweenCountLeft = tweens.length;
    function onComplete() {
      tweenCountLeft --;
      if(tweenCountLeft === 0) {
        swapCoordinates();
        swapInProgress = false;
        console.log('swap complete');
        tryMatches([a, b]);
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
          jalBoardCoordinates: card.jalBoardCoordinates,
          jalCardValue: card.jalCardValue
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

    var cardsKilledCopy = _.clone(cardsKilled);

    // find the lowest point in each col
    _.each(cardsKilled, function(k) {
      var c = k.jalBoardCoordinates.x;
      if(!cols[c] || 
         (cols[c] && cols[c].y < k.jalBoardCoordinates.y)) {
        cols[c] = k.jalBoardCoordinates;
      }
    });
    var columnValues = _.values(cols);
    var dropCounter = 0;
    function onDropComplete() {
      dropCounter ++;
      if(dropCounter < columnValues.length) return;

      signalCardGroupDropped.dispatch(cardsKilledCopy);
    }
    _.each(columnValues, function(coords) {
      dropColumnFromPt(coords, onDropComplete);
    });
    cardsKilled = [];
  }

  // drop the column from the passed starting point
  function dropColumnFromPt(pt, complete, newCardCreated) {
    if(!shouldContinue) return;

    complete = complete || function(){};

    log({
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
  this.boardSize = new Phaser.Point(10, 7);
  this.gameSize = new Phaser.Point(800, 600);

  this.gameBoardSize = new Phaser.Point(600, 600);

  this.cardPadding = new Phaser.Point(10, 20);
  // this is the amount of space for each cell
  this.boardSpacing = Phaser.Point.divide(this.gameBoardSize, this.boardSize);
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

PM.GameBoard = PM.GameBoard || function(game, config) {
  this.config = config;
  this.game = game;
  var newBoard = this.newBoard = function() {
    return new PM.Board(config.boardSize);
  };
  this.board = newBoard();
};


PM.GameStates = {};



PM.GameStates.MainMenu = function(game) {
  var buttonFactory = new PM.ButtonFactory(game);
  var button = buttonFactory.newButton;

  var preload = this.preload = function() {
    buttonFactory.preload();
  };
  var create = this.create = function() {
    var gameStateChanger = function(stateName) {
      return function() {
        game.state.start(stateName);
      };
    };
    var notImplemented = function() {
      alert('not implemented yet');
    };

    var buttons = [
      button('Endless', gameStateChanger('playing')),
      button('Score Attack', gameStateChanger('score-attack'))
      //button('Challenges', notImplemented),
      //button('High Scores', notImplemented),
      //button('Options', notImplemented)
    ];

    var yPadding = 10;
    // place near bottom of screen.
    var yPos = game.world.height - 4 * buttons[0].height;
    _.each(_.clone(buttons).reverse(), function(b) {
      b.x = game.world.centerX - b.width / 2;
      b.y = yPos;
      yPos -= b.height + yPadding;
    });
  };
};


PM.GameStates.Playing = function(gb) {
  var game = gb.game;
  var levelMgr, endlessLevel, renderer;

  // gamestate functions
  var preload = this.preload = function() {
    new PM.Preloader(game).preload();
  };
  var create = this.create = function() {
    renderer = new PM.Renderer(game);
    levelMgr = new PM.LevelManager(gb);
    endlessLevel = new PM.Level(gb, new PM.LevelConfig(gb.config));
    endlessLevel.addObjective(new PM.Objectives.Impossible());
    levelMgr.setLevels([endlessLevel]);
    // do any initial animations
    levelMgr.start();
  };
  var render = this.render = function() {
    renderer.render(levelMgr.getCurrentLevel());
  };
  this.shutdown = function() {
    renderer.dispose();
    renderer = null;
    levelMgr.destroy();
  };
};

PM.GameStates.ScoreAttack = function(gb) {
  var game = gb.game;

  var level1, level2, level3, levelMgr, renderer;

  // gamestate functions
  var preload = this.preload = function() {
    new PM.Preloader(game).preload();
  };
  var create = this.create = function() {
    renderer = new PM.Renderer(game);

    level1 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
    level1.addObjective(new PM.Objectives.Score(10000));

    level2 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
    level2.addObjective(new PM.Objectives.Score(25000));

    level3 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
    level3.addObjective(new PM.Objectives.Score(50000));

    levelMgr = new PM.LevelManager(gb);
    levelMgr.setLevels([level1, level2, level3]);
    // do any initial animations
    levelMgr.start();
  };

  var render = this.render = function() {
    renderer.render(levelMgr.getCurrentLevel());
  };

  this.shutdown = function() {
    renderer.dispose();
    renderer = null;
    levelMgr.destroy();
  };
};


// keeps track of play history
PM.History = PM.History || function() {
  var countsByType = {};
  var countsByValue = {};
  var countsBySuit = {};
  var countsByCard = {};

  var memory = [];
  var unicodeSuits = {
    hearts: '♥',
    spades: '♠',
    clubs: '♣',
    diamonds: '♦'
  };

  function displayCardSimple(card) {
    return card.jalCardValue.value + 
      unicodeSuits[card.jalCardValue.suit];
  }

  function displayCard(card) {
    return '<span class="' + card.jalCardValue.suit + '">' +
      displayCardSimple(card) +
      '</span>';
  }

  function sanitizeCard(card) {
    return {
      jalCardValue: card.jalCardValue,
      jalBoardCoordinates: card.jalBoardCoordinates,
      display: displayCard(card),
      displaySimple: displayCardSimple(card)
    };
  }

  function sanitizeMatch(m) {
    return {
      matchType: m.matchType,
      cards: _.map(m.match, sanitizeCard)
    };
  }

  function render() {
    var htmlStr = '<ul class="history">' +
      _.map(_.clone(memory).reverse(), function(item) {
        return '<li class="item">' + _.pluck(item.cards, 'display').join(',') + 
          ' (' + item.matchType + ')</li>';
      }).join('') +
      '</ul>';
    document.getElementById('history').innerHTML = htmlStr;
  }

  var matchTypeScoreBase = {
    kind: 1000,
    straight: 1500,
    flush: 2000
  };
  var matchTypeScoreLengthBonus = {
    kind: 50,
    straight: 100,
    flush: 25
  };

  function scoreMatch(match) {
    var mt = match.matchType;
    var len = match.cards.length;
    return matchTypeScoreBase[mt] + len * matchTypeScoreLengthBonus[mt];
  }

  var score = 0;
  var getScore = this.getScore = function() {
    return score;
  };

  this.getStatistics = function() {
    return {
      countsByType: countsByType,
      countsByCard: countsByCard,
      countsBySuit: countsBySuit,
      countsByValue: countsByValue,
      score: score,
      // same as matches
      moves: memory.length
    };
  };

  function track(match) {
    countsByType[match.matchType] = (countsByType[match.matchType] || 0) + 1;
    _.each(match.cards, function(c) {
      countsByCard[c.displaySimple] = (countsByCard[c.displaySimple] || 0) + 1;
      var cv = c.jalCardValue;
      countsBySuit[cv.suit] = (countsBySuit[cv.suit] || 0) + 1;
      countsByValue[cv.value] = (countsByValue[cv.value] || 0) + 1;
    });
  }

  var remember = this.remember = function(match) {
    var san = sanitizeMatch(match);
    track(san);
    memory.push(san);
    score += scoreMatch(san);
    render();
  };

};


// Represents a game level.
PM.LevelConfig = function(gameConfig) {
  // set some default config
  this.boardSize = gameConfig.boardSize;
};
PM.Level = function(gameBoard, levelConfig) {
  var board;
  var cardSelector;
  var gb = gameBoard;
  var game = gb.game;
  var cardFactory;
  var history = new PM.History();
  var matcherB = new PM.PreselectedMatcher();
  var cardSwapper;
  var self = this;
  var signals = {
    objectiveCompleted: new Phaser.Signal(),
    levelCompleted: new Phaser.Signal()
  };

  function init() {
    board = newBoard();
    gb.board = board; // this is kind of clunky

    cardSelector = new PM.CardSelectorDrag(board, function(cards) {
      console.log(cards);
      cardSwapper.tryMatches(cards);
    });
    cardFactory = new PM.CardFactory(gb, cardSelector);
    cardFactory = new PM.CardFactory(gb, cardSelector);
    cardSwapper = new PM.CardSwapper({
      gameBoard: gb,
      matcher: matcherB,
      cardFactory: cardFactory
    });
    cardSwapper.signalMatchFound.add(function(match) {
      history.remember(match);
      console.log({
        what: 'objective met',
        met: isObjectiveMet(),
        stats: history.getStatistics()
      });

      if(isObjectiveMet()) {
        signals.objectiveCompleted.dispatch(history);
        showObjectivesMetAnimation(function() {
          signals.levelCompleted.dispatch();
        });
      }
    });
    spawnBoard(board);
  }

  this.getSignals = function() {
    return signals;
  };

  this.getHistory = function() {
    return history;
  };

  // fill the screen with as many cards as possible
  function spawnBoard() {
    board.saveCards(cardFactory.createInitialCards());
  }

  function newBoard() {
    return new PM.Board(levelConfig.boardSize);
  }

  function showObjectivesMetAnimation(callback) {
    cardSwapper.stop();

    var style = { 
      font: "40px Arial", 
      fill: "#0000FF", 
      align: "center" 
    };
    var completedText = game.add.text(game.world.width/2, -100, "Objective Completed!", style);
    completedText.anchor.setTo(0.5, 0.5);
    var tween = game.add.tween(completedText).to({
        y: game.world.height/2
      }, 1000, Phaser.Easing.Bounce.In).to({
        y: game.world.height + 100
      }, 2000, Phaser.Easing.Power2, true, 2000);
    // wait a bit for this
    setTimeout(function() {
      _.each(board.getCards(), function(c) {
        var t = game.add.tween(c).to({ y: -100 }, 500 + 500 * Math.random(), Phaser.Easing.Power2);
        t.onComplete.add(function() {
          c.kill();
        });
        t.start();
      });
    }, 500);
    tween.onComplete.add(function() {
      callback();
    });
    tween.delay(2000).start();
  }

  // Performs any initial setup and starts animations that signal
  // the beginning of the level.
  var start = this.start = function(callback) {
    init();
  };
  var objectives = [];
  var isObjectiveMet = this.isObjectiveMet = function() {
    return _.every(objectives, function(obj) {
      return obj.isMet(self);
    });
  };
  // This is used to clean-up the level and show any animations
  // that need to be shown
  var endLevel = this.endLevel = function(callback) {
  };

  var getScore = this.getScore = function() {
    return history.getScore();
  };

  var getSelectedCards = this.getSelectedCards = function() {
    return cardSelector.getSelected();
  };

  var setObjective = this.setObjective = function(objectiveFunc) {
    isObjectiveMet = self.isObjectiveMet = objectiveFunc;
  };

  var addObjective = this.addObjective = function(objective) {
    objectives.push(objective);
  };

  this.getObjectivesDescription = function() {
    return _.map(objectives, function(obj) {
      return obj.getDescription();
    }).join('\n');
  };

  this.destroy = function() {
    _.invoke(board.getCards(), 'kill');
  };
};

// controls level
PM.LevelManager = function(gb) {
  var currentLevelIndex = -1;
  var currentLevel = null;
  var levels = [];

  function nextLevel() {
    if(currentLevel) {
      currentLevel.destroy();
    }
    currentLevelIndex ++;
    currentLevel = levels[currentLevelIndex];
    if(! currentLevel) {
      return null;
    }
    currentLevel.getSignals().levelCompleted.addOnce(function() {
      console.log('moving to next level');
      nextLevel();
    });
    currentLevel.start();
    return currentLevel;
  }

  this.start = function() {
    var level = nextLevel();
    if(level) {
      // do something?
    }
    else {
      console.log('game over');
      // TODO
    }
  };

  this.getCurrentLevel = function() {
    return currentLevel;
  };

  this.setLevels = function(lvls) {
    levels = lvls;
  };

  this.destroy = function() {
    if(currentLevel) {
      currentLevel.destroy();
    }
  };
};


PM.MatchReconciler = PM.MatchReconciler || function() {

  var cardRenderer = new PM.UnicodeRenderer();

  // we will not add the card value and suit because we will assume that
  // no two cards can have the same coordinate at once.
  var cardHash = this.cardHash = function(card) {
    return card.jalBoardCoordinates.toString();
  };

  // a string hash that can be used to compare against other matches
  // to determine if they are the same.
  var matchHash = this.matchHash = function(m) {
    return m.matchType + '_' + _.map(m.match, cardHash).sort().join(',');
  };

  var matchDisplay = this.matchDisplay = function(m) {
    return m.matchType + '_' + _.map(m.match, cardRenderer.render).sort().join(',');
  };

  var matchesEqual = this.matchesEqual = function(a, b) {
    return matchHash(a) === matchHash(b);
  };

  var uniqueMatches = this.uniqueMatches = function(matches) {
    var cache = {};
    return _.filter(matches, function(m) {
      var key = matchHash(m);
      var exists = !! cache[key];
      cache[key] = m;
      return !exists;
    });
  };
};


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

  var matchAcceptable = this.matchAcceptable = function(m) {
    var len = m.match.length;

    if(m.matchType === MATCH.KIND && len > 2) return true;
    if(m.matchType === MATCH.FLUSH && len >= minimumFlushLength) return true;
    if(m.matchType === MATCH.STRAIGHT && len > 2) return true;

    //console.log({
      //what: 'matchAcceptable unacceptable',
      //m: m
    //});

    return false;
  };

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

  var getBaseMatches = this.getBaseMatches = function(original) {
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



PM.Objectives = {};


// Just used for testing.
PM.Objectives.Impossible = function() {
  var isMet = this.isMet = function() {
    return false;
  };

  this.getDescription = function() {
    return "Endless.";
  };
};


PM.Objectives.Score = function(targetScore) {
  var isMet = this.isMet = function(level) {
    return targetScore <= level.getScore();
  };

  this.getDescription = function() {
    return "Score at least " + targetScore + " points."
  };
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


PM.Renderer = PM.Renderer || function(game) {
  var graphics;
  var scoreText;
  var objectivesText;
  var quitButton;
  var buttonFactory = new PM.ButtonFactory(game);

  var dispose = this.dispose = function() {
    if(graphics) {
      graphics.destroy();
      graphics = null;
    }

    if(scoreText) {
      scoreText.destroy();
      scoreText = null;
    }

    if(objectivesText) {
      objectivesText.destroy();
      objectivesText = null;
    }

    if(quitButton) {
      quitButton.destroy();
      quitButton = null;
    }
  };
 
  function initGraphics(){
    if(graphics) {
      game.world.bringToTop(graphics); // this doesn't seem to do anything.
      graphics.parent.bringToTop(graphics);
      return;
    }
    graphics = game.add.graphics();
    graphics.boundsPadding = 0;
    var cardLine = game.add.sprite(0, 0, null);
    cardLine.addChild(graphics);

    quitButton = buttonFactory.newButton("Quit", function() {
      game.state.start('main-menu');
    });
    quitButton.x = game.world.width - quitButton.width;
    // TODO: why is this times 3?
    quitButton.y = game.world.height - quitButton.height * 3;
    //quitButton.x = 600;
    //quitButton.y = 400;
    console.log({
      what: 'quitButton',
      x: quitButton.x,
      y: quitButton.y,
      width: quitButton.width,
      height: quitButton.height
    });
    //quitButton.x = 100;
    //quitButton.y = 100;
  }

  function initText() {
    if(scoreText) return;

    var style = { 
      font: "20px Arial", 
      fill: "#FF0000", 
      align: "left" 
    };
    scoreText = game.add.text(0, 0, "0", style);
    scoreText.anchor.setTo(1, 0);
    scoreText.x = game.world.width;

    var objectivesStyle = _.extend({}, style, {
      font: '12px Arial'
    });
    objectivesText = game.add.text(0, 100, "0", objectivesStyle);
    objectivesText.anchor.setTo(1, 0);
    objectivesText.x = game.world.width;
  }

  function init() {
    initGraphics();
    initText();
  }

  function cardCenter(card) {
    return new Phaser.Point(card.x + card.width / 2, card.y + card.height / 2);
  }

  var lastCardsDrawn = null;
  function drawLine(cards) {

    graphics.clear();

    if(!cards) return;
    if(cards.length < 2) return;

    graphics.lineStyle(5, 0x00ff00, 1);
    var first = cardCenter(cards[0]);

    // draw a circle at the beginning
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(first.x, first.y, 10);
    graphics.endFill();

    graphics.moveTo(first.x, first.y);

    var last = first;
    for(var i = 1; i < cards.length; i ++) {
      var card = cardCenter(cards[i]);
      graphics.lineTo(card.x, card.y);
      last = card;
    }

    // draw a triangle at the end?
    // doesn't seem to work.
    //var triangleSideLength = 20;
    //var halfTriangle = triangleSideLength/2;
    //var points = [last, 
      //Phaser.Point.add(last, new Phaser.Point(halfTriangle, - halfTriangle)),
      //Phaser.Point.add(last, new Phaser.Point(- halfTriangle, - halfTriangle))];

    //graphics.beginFill(0x00ff00);
    //graphics.drawTriangle(points);
    //graphics.endFill();
  }

  var render = this.render = _.bind(function(level) {
    init();
    drawLine(level.getSelectedCards());
    scoreText.text = "Score: " + level.getScore().toString();
    objectivesText.text = "Objectives\n" + level.getObjectivesDescription();

    //_.each(getSelectedCards(), function(c) {
      //game.debug.spriteBounds(c, 'rgba(0, 0, 255, .2)');
    //});
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


PM.UnicodeRenderer = PM.UnicodeRenderer || function() {
  var unicodeSuits = {
    hearts: '♥',
    spades: '♠',
    clubs: '♣',
    diamonds: '♦'
  };

  var render = this.render = function(card) {
      return card.jalCardValue.value + 
        unicodeSuits[card.jalCardValue.suit];
  };
};

