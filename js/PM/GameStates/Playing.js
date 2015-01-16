PM.GameStates.Playing = function(gb) {
  var game = gb.game;
  var levelMgr, endlessLevel, renderer;

  // gamestate functions
  var preload = this.preload = function() {
    new PM.Preloader(game).preload();
  };
  var create = this.create = function() {
    renderer = new PM.Renderer(game);
    levelMgr = new PM.LevelManager(gb);
    endlessLevel = new PM.Level(gb, new PM.LevelConfig(gb.config));
    endlessLevel.addObjective(new PM.Objectives.Impossible());
    levelMgr.setLevels([endlessLevel]);
    // do any initial animations
    levelMgr.start();
  };
  var render = this.render = function() {
    renderer.render(levelMgr.getCurrentLevel());
  };
  this.shutdown = function() {
    renderer.dispose();
    renderer = null;
    levelMgr.destroy();
  };
};
