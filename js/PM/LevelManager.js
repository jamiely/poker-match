// controls level
PM.LevelManager = function(gb) {
  var level1 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
  level1.addObjective(new PM.Objectives.Score(10000));

  var level2 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
  level2.addObjective(new PM.Objectives.Score(25000));

  var level3 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
  level3.addObjective(new PM.Objectives.Score(50000));

  // how should we progress the level? there should probably be some
  // signal that we listen for.

  var currentLevel = level1;

  this.getCurrentLevel = function() {
    return currentLevel;
  };
};

