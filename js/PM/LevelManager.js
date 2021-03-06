// controls level
PM.LevelManager = function(gb) {
  var currentLevelIndex = -1;
  var currentLevel = null;
  var levels = [];
  var statRenderer;

  var game = gb.game;

  var showScore = true;
  var renderer;
  var self = this;

  var onComplete = this.onComplete = new Phaser.Signal();

  var curtain = new (function() {
    var sprite;

    this.preload = function() {
      game.load.image('curtain', 'assets/curtain.png');
    }
    this.destroy = function() {
      if(! sprite) return;
      sprite.kill();
    };
    this.create = function() {
      renderer = new PM.Renderer(game);
      var s = game.add.sprite(game.world.width / 2, 0, 'curtain');
      s.y = 0;
      s.anchor.setTo(0.5, 1);
      sprite = s;
      return s;
    };
    this.drop = function() {
      sprite.parent.bringToTop(sprite);
      sprite.y = 0;
      self.showScore = false;
      var tween = game.add.tween(sprite).to({
        y: game.world.height - 10
      }, 2000, Phaser.Easing.Power2);
      tween.onComplete.add(function() {
        //self.showScore = true;
      });
      tween.start();
      return tween;
    };
    this.raise = function() {
      sprite.parent.bringToTop(sprite);
      sprite.y = game.world.height;
      var tween = game.add.tween(sprite).to({
        y: 0
      }, 2000, Phaser.Easing.Power2);
      self.showScore = true;
      tween.start();
      return tween;
    };
  });

  this.preload = function() {
    curtain.preload();
  };

  this.create = function() {
    curtain.create();
  };

  function nextLevel() {
    if(currentLevel) {
      currentLevel.destroy();
    }
    currentLevelIndex ++;
    if(currentLevelIndex >= levels.length) {
      return null;
    }
    currentLevel = levels[currentLevelIndex];
    if(! currentLevel) {
      return null;
    }
    currentLevel.getSignals().levelCompleted.addOnce(function() {
      console.log('moving to next level');
      curtain.drop();
      setTimeout(function() {
        var stats = currentLevel.getHistory().getStatistics();
        statRenderer = new PM.StatisticsRenderer(game, stats);
        statRenderer.preload();
        statRenderer.create();
        statRenderer.onComplete.add(function() {
          setTimeout(function() {
            statRenderer.destroy();

            var next = nextLevel();
            if(next) {
              curtain.raise();
            } else {
              console.log('game over');
              onComplete.dispatch();
            }
          }, 2500);
        });
      }, 1000);
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

  this.destroy = function() {
    if(currentLevel) {
      currentLevel.destroy();
    }
    curtain.destroy();

    if(renderer) {
      renderer.dispose();
      renderer = null;
    }

    if(statRenderer) {
      statRenderer.destroy();
    }
  };

  this.render = function() {
    renderer.render(self.getCurrentLevel(), self.showScore);
    if(statRenderer) {
      statRenderer.render();
    }
  };
};

