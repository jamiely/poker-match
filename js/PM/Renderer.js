PM.Renderer = PM.Renderer || function(game, getSelectedCards) {
  var render = this.render = _.bind(function() {
    _.each(getSelectedCards(), function(c) {
      game.debug.spriteBounds(c, 'rgba(0, 0, 255, .2)');
    });
  }, this);
};

