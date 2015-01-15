PM.ButtonFactory = function(game) {
  var uiAtlasName = 'ui';

  this.preload = function() {
    game.load.atlasXML(
      uiAtlasName, 
      'assets/sprites/blueSheet.png', 
      'assets/sprites/blueSheet.xml');
  };

  var newButton = this.newButton = function (strText, clickHandler) {
    var group = game.add.group();

    var style = { 
      font: "20px Arial", 
      fill: "#EEEEEE", 
      align: "center" 
    };
    var text = game.add.text(100, 100, strText, style);
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

    group.addChild(button);
    group.addChild(text);

    return group;
  }
};

