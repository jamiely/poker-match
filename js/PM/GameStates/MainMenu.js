PM.GameStates.MainMenu = function(game) {
  var uiAtlasName = 'ui';
  function button(strText, clickHandler) {
    var style = { 
      font: "20px Arial", 
      fill: "#EEEEEE", 
      align: "center" 
    };
    var text = game.add.text(0, 0, strText, style);
    text.anchor.setTo(0.5, 0.5);
    var button = game.add.button(
      100, 
      100, 
      uiAtlasName, 
      clickHandler, 
      this,
      'blue_button03.png',
      'blue_button03.png',
      'blue_button03.png',
      'blue_button03.png');
    button.anchor.setTo(0.5, 0.5);

    button.addChild(text);
    return button;
  }

  var preload = this.preload = function() {
    game.load.atlasXML(
      uiAtlasName, 
      'assets/sprites/blueSheet.png', 
      'assets/sprites/blueSheet.xml');
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
      button('Score Attack', gameStateChanger('playing')),
      button('Challenges', notImplemented),
      button('High Scores', notImplemented),
      button('Options', notImplemented)];

    var yPadding = 10;
    // place near bottom of screen.
    var yPos = game.world.height - 3 * buttons[0].height;
    _.each(_.clone(buttons).reverse(), function(b) {
      b.x = game.world.centerX;
      b.y = yPos;
      yPos -= b.height + yPadding;
    });
  };
};

