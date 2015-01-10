PM.App = PM.App || function(config) {
  var gb = new PM.GameBoard(config);
  var game = gb.game;
  game.state.add('playing', new PM.GameStates.Playing(gb));
  game.state.add('main-menu', new PM.GameStates.MainMenu(game));

  var run = this.run = function() {
    game.state.start('main-menu');
  };
};

