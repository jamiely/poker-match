// controls level
PM.LevelManager = function(gb) {
  var currentLevelIndex = -1;
  var currentLevel = null;
  var levels = [];

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

  this.setLevels = function(lvls) {
    levels = lvls;
  };
};

