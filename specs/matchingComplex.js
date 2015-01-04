describe("PM.Matcher", function() {
  //"A♠|9♥|A♠|9♥|A♠",
  //"9♥|A♠|9♥|A♠|9♥",
  //"A♠|9♥|A♠|9♥|A♠",
  //"9♥|A♠|9♥|A♠|9♥",
  //"A♠|9♥|A♠|9♥|A♠"
  function newMatcherWithBoard(boardStr) {
    var board = new PM.BoardParser().parse(boardStr);
    var matcher = new PM.Matcher(board, {
      minimumFlushLength: 4
    });
    return {
      matcher: matcher,
      board: board,
      matchFrom: function(x,y) {
        return matcher.matchFromCard(
          board.cardAt(new Phaser.Point(x, y))
        );
      }
    };
  }
  it("matches flushes horizontally", function() {
    var m = newMatcherWithBoard([
      "A♠|9♥|A♠|9♥|A♠|9♥|A♠|9♥",
      "9♥|5♣|6♣|J♣|Q♦|K♦|A♦|7♦",
      "A♠|9♥|A♠|9♥|A♠|9♥|A♠|9♥",
    ].join('\n'));
    var matches = m.matchFrom(3, 1);
    expect(matches.length).toBe(1);
  });
});



