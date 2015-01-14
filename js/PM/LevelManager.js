// controls level
PM.LevelManager = function(gb) {
  var level1 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
  level1.addObjective(new PM.Objectives.Score(1000));

  var level2 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
  level2.addObjective(new PM.Objectives.Score(2500));

  var level3 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
  level3.addObjective(new PM.Objectives.Score(5000));

  // how should we progress the level? there should probably be some
  // signal that we listen for.

  var currentLevelIndex = -1;
  var currentLevel = null;
  var levels = [level1, level2, level3];

  function nextLevel() {
    currentLevelIndex ++;
    currentLevel = levels[currentLevelIndex];
    if(! currentLevel) {
      return null;
    }
    currentLevel.getSignals().levelCompleted.addOnce(function() {
      console.log('moving to next level');
      nextLevel();
    });
    currentLevel.start();
    return currentLevel;
  }

  this.start = function() {
    var level = nextLevel();
    if(level) {
      // do something?
    }
    else {
      console.log('game over');
      // TODO
    }
  };

  this.getCurrentLevel = function() {
    return currentLevel;
  };
};

