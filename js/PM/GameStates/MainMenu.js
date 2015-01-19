PM.GameStates.MainMenu = function(game) {
  var buttonFactory = new PM.ButtonFactory(game);
  var button = buttonFactory.newButton;
  var logo = new (function() {
    this.preload = function() {
      game.load.image('logo', 'assets/logo01.png');
    };
    function setupLogoTween(s) {
      var t = game.add.tween(s);
      t.to({y: s.height}, 1000, Phaser.Easing.Bounce.Out);
      return t;
    }
    this.create = function() {
      var s = game.add.sprite(game.world.width / 2, 0, 'logo');
      s.y = 0;
      s.anchor.setTo(0.5, 0.5);
      setupLogoTween(s).start();
      return s;
    };
  });

  var preload = this.preload = function() {
    buttonFactory.preload();
    logo.preload();
  };
  var create = this.create = function() {
    game.stage.backgroundColor = '#498840';
    logo.create();
    var gameStateChanger = function(stateName) {
      return function() {
        game.state.start(stateName);
      };
    };
    var notImplemented = function() {
      alert('not implemented yet');
    };

    var buttons = [
      button('Endless', gameStateChanger('playing')),
      button('Score Attack', gameStateChanger('score-attack'))
      //button('Challenges', notImplemented),
      //button('High Scores', notImplemented),
      //button('Options', notImplemented)
    ];

    var yPadding = 10;
    // place near bottom of screen.
    var yPos = game.world.height - 4 * buttons[0].height;
    _.each(_.clone(buttons).reverse(), function(b) {
      b.x = game.world.centerX - b.width / 2;
      b.y = yPos;
      yPos -= b.height + yPadding;
    });
  };
};

