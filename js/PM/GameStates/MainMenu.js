PM.GameStates.MainMenu = function(game) {
  var buttonFactory = new PM.ButtonFactory(game);
  var button = buttonFactory.newButton;

  var preload = this.preload = function() {
    buttonFactory.preload();
  };
  var create = this.create = function() {
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

