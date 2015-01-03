describe("PM.Matcher", function() {
  //"A♠|9♥|A♠|9♥|A♠",
  //"9♥|A♠|9♥|A♠|9♥",
  //"A♠|9♥|A♠|9♥|A♠",
  //"9♥|A♠|9♥|A♠|9♥",
  //"A♠|9♥|A♠|9♥|A♠"
  function newMatcherWithBoard(boardStr) {
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
  function expectMatch(m, x, y, matchInfo) {
    var matches = m.matchFrom(x,y);
    console.log(matches);
    expect(matches.length).toBe(1);
    var match = matches[0];
    expect(match.matchType).toBe(matchInfo.matchType);
    expect(match.match.length).toBe(matchInfo.length);
  }
  function expectNoMatch(m, x, y) {
    expect(m.matchFrom(x, y).length).toBe(0);
  }
  var kindMatchInfo = {
    matchType: 'kind',
    length: 3
  };
  it("matches kinds horizontally", function() {
    var m = newMatcherWithBoard([
      "A♠|9♥|A♠|9♥|A♠",
      "9♥|5♠|5♥|5♠|9♥",
      "A♠|9♥|A♠|9♥|A♠",
      "9♥|A♠|9♥|A♠|9♥",
      "A♠|9♥|A♠|9♥|A♠"
    ].join('\n'));
    expectMatch(m, 1, 1, kindMatchInfo);
    expectMatch(m, 2, 1, kindMatchInfo);
    expectMatch(m, 3, 1, kindMatchInfo);
    expectNoMatch(m, 0,0);
    expectNoMatch(m, 1,0);
    expectNoMatch(m, 0,1);
  });
  it("matches kinds vertically", function() {
    var m = newMatcherWithBoard([
      "A♠|9♥|A♠|9♥|A♠",
      "9♥|5♠|9♥|9♠|9♥",
      "A♠|5♥|A♠|9♥|A♠",
      "9♥|5♠|9♥|A♠|9♥",
      "A♠|9♥|A♠|9♥|A♠"
    ].join('\n'));
    expectMatch(m, 1, 1, kindMatchInfo);
    expectMatch(m, 1, 2, kindMatchInfo);
    expectMatch(m, 1, 3, kindMatchInfo);
    expectNoMatch(m, 0,0);
    expectNoMatch(m, 1,0);
    expectNoMatch(m, 0,1);
  });

  var flushMatchInfo = {
    matchType: 'flush',
    length: 4
  };
  it("matches flushes horizontally", function() {
    var m = newMatcherWithBoard([
      "A♠|9♥|A♠|9♥|A♠",
      "9♥|A♣|9♣|A♣|9♣",
      "A♠|9♥|A♠|9♥|A♠",
      "9♥|A♠|9♥|A♠|9♥",
      "A♠|9♥|A♠|9♥|A♠"
    ].join('\n'));
    expectMatch(m, 1, 1, flushMatchInfo);
    expectMatch(m, 2, 1, flushMatchInfo);
    expectMatch(m, 3, 1, flushMatchInfo);
    expectMatch(m, 4, 1, flushMatchInfo);
    expectNoMatch(m, 0,0);
    expectNoMatch(m, 1,0);
    expectNoMatch(m, 0,1);
  });
  it("matches flushes vertically", function() {
    var m = newMatcherWithBoard([
      "A♠|9♥|A♠|9♥|A♠",
      "9♥|A♣|9♥|A♠|9♥",
      "A♠|9♣|A♠|9♥|A♠",
      "9♥|A♣|9♥|A♠|9♥",
      "A♠|9♣|A♠|9♥|A♠"
    ].join('\n'));
    expectMatch(m, 1, 1, flushMatchInfo);
    expectMatch(m, 1, 2, flushMatchInfo);
    expectMatch(m, 1, 3, flushMatchInfo);
    expectMatch(m, 1, 4, flushMatchInfo);
    expectNoMatch(m, 0,0);
    expectNoMatch(m, 1,0);
    expectNoMatch(m, 0,1);
  });

  xit('matches straights horizontally', function() {
  });
  xit('matches straights vertically', function() {
  });
  xit('matches kinds with a wildcard');
  xit('matches flushes with a wildcard');
  xit('matches straights with a wildcard');
});


