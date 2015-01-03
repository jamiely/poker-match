describe("PM.Matcher", function() {
  function newMatcherWithBoard(boardStr) {
    //var boardStr = [
      //"A♠|9♥|A♠|9♥|A♠",
      //"9♥|A♠|9♥|A♠|9♥",
      //"A♠|9♥|A♠|9♥|A♠",
      //"9♥|A♠|9♥|A♠|9♥",
      //"A♠|9♥|A♠|9♥|A♠"].join('\n');
    var board = new PM.BoardParser().parse(boardStr);
    var matcher = new PM.Matcher(board);
    return {
      matcher: matcher,
      board: board,
      matchFrom: function(x,y) {
        var card = board.cardAt(new Phaser.Point(x, y));
        return matcher.matchFromCard(card);
      }
    };
  }
  it("matches kinds horizontally", function() {
    var m = newMatcherWithBoard([
      "A♠|9♥|A♠|9♥|A♠",
      "9♥|5♠|5♥|5♠|9♥",
      "A♠|9♥|A♠|9♥|A♠",
    ].join('\n'));
    function expectMatch(x, y) {
      var matches = m.matchFrom(x,y);
      expect(matches.length).toBe(1);
      var match = matches[0];
      expect(match.matchType).toBe('kind');
      expect(match.match.length).toBe(3);
    }
    function expectNoMatch(x, y) {
      expect(m.matchFrom(x, y).length).toBe(0);
    }
    expectMatch(1,1);
    expectMatch(2,1);
    expectMatch(3,1);
    expectNoMatch(0,0);
    expectNoMatch(1,0);
    expectNoMatch(0,1);
  });
});


