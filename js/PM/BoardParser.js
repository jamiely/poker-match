PM.BoardParser = PM.BoardParser || function() {
  // parses board in pipe delimited format.
  // "A♠|9♥|A♠|9♥|A♠"
  // "9♥|A♠|9♥|A♠|9♥"
  // "A♠|9♥|A♠|9♥|A♠"
  // "9♥|A♠|9♥|A♠|9♥"
  // "A♠|9♥|A♠|9♥|A♠"
  //♠
  //♥
  //♦
  //♣
  var cardParser = new PM.UnicodeParser();
  var parse = this.parse = function(str) {
    var lines = str.split('\n');
    var rows = _.map(lines, function(line) {
      var cols = line.split('|');
      return _.map(cols, function(cell) {
        return cardParser.parse(cell);
      });
    });
    if(rows.length === 0) return null;

    var cols = rows[0].length;
    var cards = [];
    for(var r = 0; r < rows.length; r++) {
      for(var c = 0; c < cols; c++) {
        cards.push({
          jalBoardCoordinates: new Phaser.Point(c, r),
          jalCardValue: rows[r][c]
        });
      }
    }

    var board = new PM.Board();
    board.saveCards(cards);

    return board;
  };
};

