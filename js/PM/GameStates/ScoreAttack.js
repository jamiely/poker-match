PM.GameStates.ScoreAttack = function(gb) {
  var game = gb.game;

  var level1 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
  level1.addObjective(new PM.Objectives.Score(10000));

  var level2 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
  level2.addObjective(new PM.Objectives.Score(25000));

  var level3 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
  level3.addObjective(new PM.Objectives.Score(50000));

  var levelMgr = new PM.LevelManager(gb);
  levelMgr.setLevels([level1, level2, level3]);

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

