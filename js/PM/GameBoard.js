PM.GameBoard = PM.GameBoard || function(game, config) {
  this.config = config;
  this.game = game;
  var newBoard = this.newBoard = function() {
    return new PM.Board(config.boardSize);
  };
  this.board = newBoard();
};

