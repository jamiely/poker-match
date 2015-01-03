describe('PM.BoardParser', function() {
  var boardStr = [
    "A♠|9♥|A♠|9♥|A♠",
    "9♥|A♠|9♥|A♠|9♥",
    "A♠|9♥|A♠|9♥|A♠",
    "9♥|A♠|9♥|A♠|9♥",
    "A♠|9♥|A♠|9♥|A♠"].join('\n');

  function expectCard(board, x, y, expected) {
    var card = board.cardAt(new Phaser.Point(x, y));
    expect(card.jalCardValue.suit).toBe(expected.suit);
    expect(card.jalCardValue.value).toBe(expected.value);
  }

  it('parses a board specified in unicode', function() {
    var parser = new PM.BoardParser();
    var board = parser.parse(boardStr);
    expectCard(board, 0, 0, {
      suit: 'spades',
      value: 'A'
    });
    expectCard(board, 1, 0, {
      suit: 'hearts',
      value: '9'
    });
    expectCard(board, 0, 1, {
      suit: 'hearts',
      value: '9'
    });
    expectCard(board, 1, 1, {
      suit: 'spades',
      value: 'A'
    });
  });
});
