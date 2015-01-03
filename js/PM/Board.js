PM.Board = PM.Board || function(boardSize) {
  var BOARD;

  var reset = this.reset = function () {
    BOARD = {};
  };

  var saveCards = this.saveCards = function(cards) {
    reset(); // this init needs to happen before cards are created.
    _.each(cards, saveBoardCoords);
  };

  // saves the coordinates of the passed card
  var saveBoardCoords = this.saveBoardCoords = function (c) {
    BOARD[c.jalBoardCoordinates.toString()] = c;
  };

  // returns the card at the passed point
  var cardAt = this.cardAt = function (pt) {
    return BOARD[pt.toString()];
  };

  var removeCard = this.removeCard = function (card) {
    // clear the board cache
    BOARD[card.jalBoardCoordinates.toString()] = null;
  };

  // dir is a point
  var cardInDirection = this.cardInDirection = function(c, dir) {
    var coord = PM.Direction.pointInDir(c.jalBoardCoordinates, dir);
    console.log({
      what: 'cardInDirection coord',
      coord: coord
    });
    return cardAt(coord);
  };
  
  // Determine if two cards are adjacent to each other.
  var isAdjacent = this.isAdjacent = function(c1, c2) {
    var p1 = c1.jalBoardCoordinates, p2 = c2.jalBoardCoordinates;

    return (p1.x === p2.x && Math.abs(p1.y - p2.y) === 1) ||
      (p1.y === p2.y && Math.abs(p1.x - p2.x) === 1);
  };

  var ptInBounds = this.ptInBounds = function(pt) {
    return pt.x >= 0 && pt.x < boardSize.x &&
      pt.y >= 0 && pt.y < boardSize.y;
  };

  // reset the first time
  reset();
};

