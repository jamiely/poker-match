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
