PM.GameStates.Playing = function(gameBoard) {
  var gb = gameBoard;
  var game = gb.game;
  var board = gb.board;
  //var matcher = new PM.Matcher(board);
  var matcherB = new PM.PreselectedMatcher();
  var cardSelector = new PM.CardSelectorDrag(board, function(cards) {
    console.log(cards);
    cardSwapper.tryMatches(cards);
  });
  var cardFactory = new PM.CardFactory(gb, cardSelector);
  var renderer = new PM.Renderer(game, function() {
    return cardSelector.getSelected();
  });
  var cardSwapper = new PM.CardSwapper({
    gameBoard: gb,
    matcher: matcherB,
    cardFactory: cardFactory
  });

  var history = new PM.History();

  cardSwapper.signalCardGroupDropped.add(function(cards) {
    console.log('CARDS DROPPED');
    console.log(cards);
    //history.remember(cards);
  });
  cardSwapper.signalMatchFound.add(function(match) {
    history.remember(match);
  });

  // fill the screen with as many cards as possible
  function spawnBoard() {
    gb.board.saveCards(cardFactory.createInitialCards());
  }

  // gamestate functions
  var preload = this.preload = function() {
    new PM.Preloader(game).preload();
  };

  var create = this.create = function() {
    spawnBoard();
  };

  var render = this.render = function() {
    renderer.render();
  };
};
