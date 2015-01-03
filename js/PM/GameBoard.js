PM.GameBoard = PM.GameBoard || function(config) {
  this.config = config;
  this.board = new PM.Board(config.boardSize);
  this.game = new Phaser.Game(config.gameSize.x, 
                              config.gameSize.y, 
                              Phaser.CANVAS, 
                              config.element);
};

