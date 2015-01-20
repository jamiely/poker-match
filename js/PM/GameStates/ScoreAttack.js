PM.GameStates.ScoreAttack = function(gb) {
  var game = gb.game;

  var level1, level2, level3, levelMgr, renderer;

  // gamestate functions
  var preload = this.preload = function() {
    new PM.Preloader(game).preload();
    levelMgr = new PM.LevelManager(gb);
    levelMgr.preload();
  };
  var create = this.create = function() {
    renderer = new PM.Renderer(game);

    level1 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
    level1.addObjective(new PM.Objectives.Score(5000));

    level2 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
    level2.addObjective(new PM.Objectives.Score(25000));

    level3 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
    level3.addObjective(new PM.Objectives.Score(50000));

    levelMgr.setLevels([level1, level2, level3]);
    levelMgr.create();
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

