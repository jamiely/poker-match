PM.Renderer = PM.Renderer || function(game) {
  var graphics;
  var scoreHeading;
  var scoreText;
  var objectivesHeading;
  var objectivesText;
  var quitButton;
  var buttonFactory = new PM.ButtonFactory(game);
  var textPadding = 10;

  var dispose = this.dispose = function() {
    if(graphics) {
      graphics.destroy();
      graphics = null;
    }

    if(scoreText) {
      scoreText.destroy();
      scoreText = null;
    }

    if(objectivesText) {
      objectivesText.destroy();
      objectivesText = null;
    }

    if(quitButton) {
      quitButton.destroy();
      quitButton = null;
    }
  };
 
  function initGraphics(){
    if(graphics) {
      game.world.bringToTop(graphics); // this doesn't seem to do anything.
      graphics.parent.bringToTop(graphics);
      return;
    }
    graphics = game.add.graphics();
    graphics.boundsPadding = 0;
    var cardLine = game.add.sprite(0, 0, null);
    cardLine.addChild(graphics);

    quitButton = buttonFactory.newButton("Quit", function() {
      game.state.start('main-menu');
    });
    quitButton.x = game.world.width - quitButton.width;
    // TODO: why is this times 3?
    quitButton.y = game.world.height - quitButton.height * 3;
    //quitButton.x = 600;
    //quitButton.y = 400;
    console.log({
      what: 'quitButton',
      x: quitButton.x,
      y: quitButton.y,
      width: quitButton.width,
      height: quitButton.height
    });
    //quitButton.x = 100;
    //quitButton.y = 100;
  }

  function initText() {
    if(scoreText) return;

    var rightMargin = game.world.width - textPadding;
    var style = { 
      font: "20px Arial", 
      fill: "#FFFFFF", 
      align: "left" 
    };
    var headingStyle = _.extend({}, style, {
      font: '32px Arial'
    });

    function calcY(sprite) {
      return textPadding + sprite.y + sprite.height;
    }

    scoreHeading = game.add.text(0, textPadding, "Score", headingStyle);
    scoreHeading.anchor.setTo(1, 0);
    scoreHeading.x = rightMargin;

    scoreText = game.add.text(0, calcY(scoreHeading), "0", style);
    scoreText.anchor.setTo(1, 0);
    scoreText.x = rightMargin;

    objectivesHeading = game.add.text(0, calcY(scoreText), "Objectives", style);
    objectivesHeading.anchor.setTo(1, 0);
    objectivesHeading.x = rightMargin;

    var objectivesStyle = _.extend({}, style, {
      font: '12px Arial'
    });
    objectivesText = game.add.text(0, calcY(objectivesHeading), "?", objectivesStyle);
    objectivesText.anchor.setTo(1, 0);
    objectivesText.x = rightMargin;
  }

  function init() {
    initGraphics();
    initText();
  }

  function cardCenter(card) {
    return new Phaser.Point(card.x + card.width / 2, card.y + card.height / 2);
  }

  var lastCardsDrawn = null;
  function drawLine(cards, color, width) {


    if(!cards) return;
    if(cards.length < 2) return;

    graphics.lineStyle(width, color, 1);
    var first = cardCenter(cards[0]);

    // draw a circle at the beginning
    graphics.beginFill(color);
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

  var clear = this.clear = function() {
    graphics.clear();
  };

  var render = this.render = _.bind(function(level, showSideBar) {
    if(showSideBar !== false) showSideBar = true;

    init();
    clear();

    if(!level) {
      return;
    }

    //game.stage.backgroundColor = '#498840';
    drawLine(level.getSelectedCards(), 0xeeeeee, 10);
    //drawLine(level.getSelectedCards(), 0xc93f3f, 5);
    drawLine(level.getSelectedCards(), 0x498840, 5);

    scoreHeading.visible = showSideBar;
    scoreText.text = level.getScore().toString();
    scoreText.visible = showSideBar;

    objectivesText.text = level.getObjectivesDescription();
    objectivesText.visible = showSideBar;
    objectivesHeading.visible = showSideBar;

    quitButton.visible = showSideBar;

    //_.each(getSelectedCards(), function(c) {
      //game.debug.spriteBounds(c, 'rgba(0, 0, 255, .2)');
    //});
  }, this);
};

