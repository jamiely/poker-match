PM.GameStates.Playing = function(gb) {
  var game = gb.game;
  var levelMgr = new PM.LevelManager(gb);

  // gamestate functions
  var preload = this.preload = function() {
    new PM.Preloader(game).preload();
  };
  var create = this.create = function() {
    // do any initial animations
    levelMgr.start();
  };
  var renderer = new PM.Renderer(game);
  var render = this.render = function() {
    renderer.render(levelMgr.getCurrentLevel());
  };
};
