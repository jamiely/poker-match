PM.GameStates.Playing = function(gb) {
  var game = gb.game;
  var level = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO

  // gamestate functions
  var preload = this.preload = function() {
    new PM.Preloader(game).preload();
  };
  var create = this.create = function() {
    // do any initial animations
    level.start();
  };
  var renderer = new PM.Renderer(game);
  var render = this.render = function() {
    renderer.render(level);
  };
};
