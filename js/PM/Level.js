// Represents a game level.
PM.LevelConfig = function(gameConfig) {
  // set some default config
  this.boardSize = gameConfig.boardSize;
};
PM.Level = function(gameBoard, levelConfig) {
  var board;
  var cardSelector;
  var gb = gameBoard;
  var cardFactory;
  var history = new PM.History();
  var matcherB = new PM.PreselectedMatcher();
  var cardSwapper;

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
    });
    spawnBoard(board);
  }

  // fill the screen with as many cards as possible
  function spawnBoard() {
    board.saveCards(cardFactory.createInitialCards());
  }

  function newBoard() {
    return new PM.Board(levelConfig.boardSize);
  }

  // Performs any initial setup and starts animations that signal
  // the beginning of the level.
  var start = this.start = function(callback) {
    init();
  };
  var isObjectiveMet = this.isObjectiveMet = function() {
    return false; // by default
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
};
