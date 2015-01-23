PM.GameStates.Playing = function(gb) {
  var game = gb.game;
  var levelMgr, endlessLevel;

  // gamestate functions
  var preload = this.preload = function() {
    new PM.Preloader(game).preload();
  };
  var create = this.create = function() {
    levelMgr = new PM.LevelManager(gb);
    endlessLevel = new PM.Level(gb, new PM.LevelConfig(gb.config));
    endlessLevel.addObjective(new PM.Objectives.Impossible());
    levelMgr.setLevels([endlessLevel]);
    // do any initial animations
    levelMgr.create();
    levelMgr.start();
  };
  var render = this.render = function() {
    levelMgr.render();
  };
  this.shutdown = function() {
    levelMgr.destroy();
  };
};
