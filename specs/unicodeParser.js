describe('PM.UnicodeParser', function() {
  var parser = new PM.UnicodeParser();

  function expectCard(actual, expected) {
    expect(actual.suit).toBe(expected.suit);
    expect(actual.value).toBe(expected.value);
  }

  it('parses unicode card specifications', function() {
    expectCard(parser.parse('J♣'), {
      suit: 'clubs',
      value: 'J'
    });
    expectCard(parser.parse('4♣'), {
      suit: 'clubs',
      value: '4'
    });
    expectCard(parser.parse('4♥'), {
      suit: 'hearts',
      value: '4'
    });
    expectCard(parser.parse('10♥'), {
      suit: 'hearts',
      value: '10'
    });
    expectCard(parser.parse('J♠'), {
      suit: 'spades',
      value: 'J'
    });
    expectCard(parser.parse('A♦'), {
      suit: 'diamonds',
      value: 'A'
    });
  });
});

