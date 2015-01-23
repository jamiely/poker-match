PM.GameStates.ScoreAttack = function(gb) {
  var game = gb.game;

  var level1, level2, level3, levelMgr;

  // gamestate functions
  var preload = this.preload = function() {
    new PM.Preloader(game).preload();
    levelMgr = new PM.LevelManager(gb);
    levelMgr.preload();
  };
  var create = this.create = function() {
    level1 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
    level1.addObjective(new PM.Objectives.Score(5000));

    level2 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
    level2.addObjective(new PM.Objectives.Score(25000));

    level3 = new PM.Level(gb, new PM.LevelConfig(gb.config)); // TODO
    level3.addObjective(new PM.Objectives.Score(50000));

    levelMgr.setLevels([level1, level2, level3]);
    levelMgr.create();
    levelMgr.onComplete.add(function() {
      var style = {
        font: "30px Arial", 
        fill: "#FFFFFF", 
        align: "right"
      };
      var text = game.add.text(game.world.width / 2, game.world.height / 2, 'Score Attack Completed!', style);
      text.anchor.setTo(0.5, 0.5);
      setTimeout(function() {
        text.destroy();
        game.state.start('main-menu');
      }, 2000);
    });
    // do any initial animations
    levelMgr.start();
  };

  var render = this.render = function() {
    levelMgr.render();
  };

  this.shutdown = function() {
    levelMgr.destroy();
  };
};

