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
  var history = new PM.History();

  cardSwapper.signalCardGroupDropped.add(function(cards) {
    console.log('CARDS DROPPED');
    console.log(cards);
    history.remember(cards);
  });
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

