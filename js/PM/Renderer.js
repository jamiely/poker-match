PM.Renderer = PM.Renderer || function(game, getSelectedCards) {
  var graphics;
 
  function initGraphics(){
    if(graphics) {
      game.world.bringToTop(graphics);
      return;
    }
    graphics = game.add.graphics();
    graphics.boundsPadding = 0;
    var cardLine = game.add.sprite(0, 0, null);
    cardLine.addChild(graphics);
  }

  function cardCenter(card) {
    return new Phaser.Point(card.x + card.width / 2, card.y + card.height / 2);
  }

  var lastCardsDrawn = null;
  function drawLine(cards) {
    initGraphics();

    graphics.clear();

    if(!cards) return;
    if(cards.length < 2) return;

    graphics.lineStyle(5, 0x00ff00, 1);
    var first = cardCenter(cards[0]);

    // draw a circle at the beginning
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(first.x, first.y, 10);
    graphics.endFill();

    graphics.moveTo(first.x, first.y);

    var last = first;
    for(var i = 1; i < cards.length; i ++) {
      var card = cardCenter(cards[i]);
      graphics.lineTo(card.x, card.y);
      last = card;
    }

    // draw a triangle at the end?
    // doesn't seem to work.
    //var triangleSideLength = 20;
    //var halfTriangle = triangleSideLength/2;
    //var points = [last, 
      //Phaser.Point.add(last, new Phaser.Point(halfTriangle, - halfTriangle)),
      //Phaser.Point.add(last, new Phaser.Point(- halfTriangle, - halfTriangle))];

    //graphics.beginFill(0x00ff00);
    //graphics.drawTriangle(points);
    //graphics.endFill();
  }

  var render = this.render = _.bind(function() {
    drawLine(getSelectedCards());

    //_.each(getSelectedCards(), function(c) {
      //game.debug.spriteBounds(c, 'rgba(0, 0, 255, .2)');
    //});
  }, this);
};

