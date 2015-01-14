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

