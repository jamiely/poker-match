PM.CardSwapper = PM.CardSwapper || function(args) {
  var game = args.gameBoard.game;
  var board = args.gameBoard.board;
  var config = args.gameBoard.config;
  var matcher = args.matcher;
  var createCardbackForCard = args.cardFactory.createCardbackForCard;
  var killCard = args.cardFactory.killCard;
  var createCard = args.cardFactory.createCard;
  var debug = false;

  function log(what) {
    if(! debug) return;

    console.log(what);
  }

  var signalCardGroupDropped = this.signalCardGroupDropped = new Phaser.Signal();

  var swapInProgress = false;
  var cardsKilled = [];
  //
  // provides the x-y coordinate for passed board position.
  function ptForBoardAt(pos) {
    return new Phaser.Point(pos.x * config.cardSizeSpaced.x,
                            pos.y * config.cardSizeSpaced.y);
  }

  // TODO: should the swap have a shadow effect as one is lifted
  // over the other? We can scale the card larger as well to indicate
  // nearness.
  var swap = this.swap = _.bind(function(a, b) {
    // can't swap multiple cards at once.
    if(swapInProgress) {
      return;
    }

    var swapDuration = 100;
    console.log({
      event: 'swapping cards',
      a: a, b: b });
    swapInProgress = true;
    var easing = Phaser.Easing.Quadratic.Out;
    function addTween(c1, c2) {
      return game.add.tween(c1).
        to( { x: c2.x, y: c2.y }, swapDuration, easing);
    }
    var tweens = [
      addTween(a, b),
      addTween(b, a)
    ];
    var tweenCountLeft = tweens.length;
    function tryMatches() {
      var matches = _.filter(_.map([a, b], function(card) {
        return {
          card: card,
          matches: matcher.matchFromCard(card)
        };
      }), function(m) {
        return m.matches && m.matches.length > 0;
      });

      var allMatches = _.reduce(matches, function(memo, m) {
        return memo.concat(m.matches);
      }, []);

      var unique = new PM.MatchReconciler().uniqueMatches(allMatches);

      console.log({
        what: 'tryMatches',
        matches: matches,
        allMatches: allMatches,
        uniqueMatches: unique
      });

      _.each(unique, disappearMatch);
    }
    function swapCoordinates() {
      // swap the coordinates of the cards
      var tmpCoords = a.jalBoardCoordinates;
      a.jalBoardCoordinates = b.jalBoardCoordinates;
      b.jalBoardCoordinates = tmpCoords;
      board.saveBoardCoords(a);
      board.saveBoardCoords(b);
    }
    function onComplete() {
      tweenCountLeft --;
      if(tweenCountLeft === 0) {
        swapCoordinates();
        swapInProgress = false;
        console.log('swap complete');
        tryMatches();
      }
    }
    _.each(tweens, function(t) {
      t.onComplete.add(onComplete);
      t.start();
    });
    console.log('swap in progress');
  }, this);

  // Use to make a card flip. Returns a tween that you
  // can use for chaining.
  function flipCard(card) {
    var duration = 300 + Math.random() * 300,
      easing = Phaser.Easing.Linear.None;
    var origX = card.x;
    var origWidth = card.width;

    //card.anchor.setTo(.5, card.anchor.y);
    var posChange = game.add.tween(card).to({
      x: origX + origWidth
    }, duration, easing);

    var originalScale = card.scale.x;
    var halfScale = originalScale / 2.0;
    
    var firstHalf = game.add.tween(card.scale).to({ 
      x: - halfScale, 
      y: card.scale.y 
    }, 
      duration / 2, 
      easing);

    var t = firstHalf.to({
      x: - originalScale,
      y: card.scale.y},
      duration / 2,
      easing);

    t.onStart.add(function() {
      var back = createCardbackForCard(card);
      back.x = origX + origWidth / 2.0;
      game.add.tween(back.scale).to({
        x: originalScale,
        y: back.scale.y
      }, duration/2, easing).start();
      var backTween = game.add.tween(back).to({
        x: origX
      }, duration/2, easing);

      // withdraw card
      backTween.onComplete.addOnce(function() {
        killCard(card);
        cardsKilled.push({
          jalBoardCoordinates: card.jalBoardCoordinates,
          jalCardValue: card.jalCardValue
        });
        game.add.tween(back).to({y: 1000}, 
                                500 * Math.random() + 500, 
                                Phaser.Easing.Linear.None).delay(500).start();
      });

      backTween.start();

      posChange.start();
    });

    return t;
  }


  // Use to remove a match
  function disappearMatch(match) {
    var count = match.match.length;
    function onMatchDisappearComplete() {
      count --;
      if(count > 0) {
        return;
      }

      // drop all the cards
      dropCards();
    }
    _.each(match.match, function(card) {
      var t = flipCard(card)
      t.onComplete.add(onMatchDisappearComplete);
      t.start();
    });
  }

  function dropCards() {
    console.log('dropping cards');
    var cols = {};

    var cardsKilledCopy = _.clone(cardsKilled);

    // find the lowest point in each col
    _.each(cardsKilled, function(k) {
      var c = k.jalBoardCoordinates.x;
      if(!cols[c] || 
         (cols[c] && cols[c].y < k.jalBoardCoordinates.y)) {
        cols[c] = k.jalBoardCoordinates;
      }
    });
    var columnValues = _.values(cols);
    var dropCounter = 0;
    function onDropComplete() {
      dropCounter ++;
      if(dropCounter < columnValues.length) return;

      signalCardGroupDropped.dispatch(cardsKilledCopy);
    }
    _.each(columnValues, function(coords) {
      dropColumnFromPt(coords, onDropComplete);
    });
    cardsKilled = [];
  }

  // drop the column from the passed starting point
  function dropColumnFromPt(pt, complete, newCardCreated) {
    complete = complete || function(){};

    log({
      what: 'dropColumnFromPt',
      pt: pt
    });

    var ptAbove = PM.Direction.pointInDir(pt, PM.Direction.Up);
    var above = board.cardAt(ptAbove);
    var continueDropping = board.ptInBounds(ptAbove);
    if(! above) {
      if(continueDropping) {
        // dropping doesn't complete yet, so we have
        // to wait.
        console.log('recursively drop column');
        dropColumnFromPt(ptAbove, function() {
          // try again once this is complete.
          dropColumnFromPt(pt, complete, newCardCreated);
        }, newCardCreated);
        return;
      } else {
        if(board.cardAt(ptAbove)) {
          throw {
            pt: pt,
            ptAbove: ptAbove,
            message: 'there shouldnt be a card registered at a point out of bounds'
          };
        }
        if(newCardCreated) {
          throw {
            pt: pt,
            ptAbove: ptAbove,
            message: 'We shouldnt get here because a new card has already been created'
          };
        }
        above = createCard(ptAbove.x, ptAbove.y);
        console.log('create a new card to drop');
        newCardCreated = true;
      }
    }

    // set some properties so we know the card is
    // dropping
    above.dropping = {
      newBoardCoordinates: pt
    };
    above.inputEnabled = false;

    // perform the actual drop now. we want to tween
    // the card's position to the one below it.
    //
    var newLocation = ptForBoardAt(pt);
    var fallDelay = 0;
    var fallDuration = 100 + Math.random()*250;
    // TODO: change easing to bounce.
    var easing = Phaser.Easing.Bounce.Out;
    var tween = game.add.tween(above).to({
      x: newLocation.x,
      y: newLocation.y},
      fallDuration,
      easing).delay(fallDelay);
    tween.onComplete.add(function() {
      above.jalBoardCoordinates = pt;
      above.inputEnabled = true;
      board.saveBoardCoords(above);
      // clear the metadata on this
      delete above.dropping;
      //complete();
      // move this outside the on completion once
      // we resolve some more of the problems.
      if(continueDropping) {
        console.log('continue dropping');
        dropColumnFromPt(ptAbove, complete, newCardCreated);
      } else {
        complete();
      }
    });
    tween.start();

  }

};



