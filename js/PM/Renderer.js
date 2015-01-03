PM.Renderer = PM.Renderer || function(game, getSelectedCard) {
  var render = this.render = _.bind(function() {
    var c = getSelectedCard();
    if(c) {
      game.debug.spriteBounds(c, 'rgba(0, 0, 255, .2)');
    }
  }, this);
};

