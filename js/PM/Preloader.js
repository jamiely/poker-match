PM.Preloader = PM.Preloader || function(game) {
  this.preload = function() {
    return {
      cards: {
        loader: game.load.atlasXML(
          'cards', 
          'assets/sprites/playingCards.png', 
          'assets/sprites/playingCards.xml'),
          name: 'cards'
      },
      cardBacks: {
        loader: game.load.atlasXML(
          'cardBacks',
          'assets/sprites/playingCardBacks.png', 
          'assets/sprites/playingCardBacks.xml'),
          name: 'cardBacks'
      }
    };
  }
};

