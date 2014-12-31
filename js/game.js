(function(){

  var CARD_SIZE = new Phaser.Point(140, 190);
  var CARD_SPACING = new Phaser.Point(2, 2);
  var BOARD_SIZE = new Phaser.Point(10, 6);
  var GAME_SIZE = new Phaser.Point(800, 600);
  // this is the amount of space for each cell
  var BOARD_SPACING = Phaser.Point.divide(GAME_SIZE, BOARD_SIZE);
  // now we need the ratio of the spacing to the size of each card
  var CARD_BOARD_RATIO = Phaser.Point.divide(
    BOARD_SPACING, 
    Phaser.Point.add(CARD_SIZE, CARD_SPACING));
  // take the lower of the two for the appropriate scale
  var CARD_SCALE = Math.min(CARD_BOARD_RATIO.x, CARD_BOARD_RATIO.y);
  console.log(CARD_SCALE);
  var CARD_SIZE_ADJ = CARD_SIZE.multiply(CARD_SCALE, CARD_SCALE);
  var CARD_SIZE_SPACED = Phaser.Point.add(CARD_SIZE_ADJ, CARD_SPACING);

  var cards;

  var game = new Phaser.Game(GAME_SIZE.x, GAME_SIZE.y, Phaser.CANVAS, 'game', { 
    preload: preload, 
    create: create 
  });

  function preload() {
    game.load.atlasXML(
      'cards', 
      'assets/sprites/playingCards.png', 
      'assets/sprites/playingCards.xml');

    //game.load.spritesheet(
      //"cards", 
      //"assets/sprites/playingCards.png", 
      //CARD_SIZE.x, 
      //CARD_SIZE.y);
  }

  function create() {
    spawnBoard();
  }

  // fill the screen with as many cards as possible
  function spawnBoard() {
    //BOARD_SIZE = new Phaser.Point(
      //Phaser.Math.floor(game.world.width / CARD_SIZE_SPACED.x),
      //Phaser.Math.floor(game.world.height / CARD_SIZE_SPACED.y));

    cards = game.add.group();

    for (var i = 0; i < BOARD_SIZE.x; i++)
    {
      for (var j = 0; j < BOARD_SIZE.y; j++)
      {
        var card = cards.create(i * CARD_SIZE_SPACED.x, j * CARD_SIZE_SPACED.y, "cards");
        card.name = 'card' + i.toString() + 'x' + j.toString();
        card.scale.setTo(CARD_SCALE, CARD_SCALE);
        //card.inputEnabled = true;
        //card.events.onInputDown.add(selectcard, this);
        //card.events.onInputUp.add(releasecard, this);
        randomizeCardColor(card);
        setCardPos(card, i, j); // each card has a position on the board
      }
    }

  }

  function randomizeCardColor(card) {
    card.frame = 
      game.rnd.integerInRange(0, 52);
  }

  // set the position on the board for a gem
  function setCardPos(gem, posX, posY) {
    gem.posX = posX;
    gem.posY = posY;
    gem.id = calcCardId(posX, posY);
  }

  // the gem id is used by getGem() to find specific gems in the group
  // each position on the board has a unique id
  function calcCardId(posX, posY) {
    return posX + posY * BOARD_SIZE.x;
  }
})();



