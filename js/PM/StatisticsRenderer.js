// Renders statistics after a level has been completed.
PM.StatisticsRenderer = function(game, stats) {
  var texts = {};
  var styles = {
    title: {
      font: "30px Arial", 
      fill: "#FFFFFF", 
      align: "right" 
    },
    heading: {
      font: "20px Arial", 
      fill: "#FFFFFF", 
      align: "right" 
    },
    text: {
      font: "20px Arial", 
      fill: "#FFFFFF", 
      align: "left" 
    }
  };

  var onComplete = this.onComplete = new Phaser.Signal();

  var title;

  var defaultInc = stats.moves * 0.05;
  var fields = [{
    id: 'matches',
    target: stats.moves,
    inc: defaultInc
  }, {
    id: 'kinds',
    target: stats.countsByType.kind,
    inc: defaultInc
  }, {
    id: 'straights',
    target: stats.countsByType.straight,
    inc: defaultInc
  }, {
    id: 'flushes',
    target: stats.countsByType.flush,
    inc: defaultInc
  }, {
    id: 'score',
    target: stats.score,
    inc: stats.score / 50 + 1
  }];

  var midX = game.world.width / 2;
  function headingWithText(headingText, valueText, y) {
    var label = game.add.text(midX - 10, y, headingText, styles.heading);
    label.anchor.setTo(1,0);
    return {
      label: label,
      value: game.add.text(midX + 10, y, valueText, styles.text)
    };
  }

  this.preload = function() {
    // do we need a special background
  };

  this.create = function() {

    var eachFieldHeight = 30;
    var worldHeight = game.world.height;
    var fieldTotalHeight = fields.length * eachFieldHeight;
    var y = (worldHeight - fieldTotalHeight) / 2;

    title = game.add.text(midX, y - eachFieldHeight, "Level Completed!", styles.title);
    title.anchor.setTo(0.5, 0);

    _.each(fields, function(f) {
      if(typeof(f.target) === 'undefined') {
        f.target = 0;
      }
    });
    texts.all = _.map(fields, function(f) {
      y += 30;
      return _.extend({}, f, {
        text: headingWithText(makeTitle(f.id), "0", y)
      });
    });
    _.each(texts.all, function(t) {
      texts[t.id] = t;
    });

    hideAll();
  };

  function makeTitle(str) {
    return capitaliseFirstLetter(str) + ':';
  }

  // http://stackoverflow.com/questions/1026069/capitalize-the-first-letter-of-string-in-javascript
  function capitaliseFirstLetter(string)
  {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function setVisibility(ts, visible) {
    ts.label.visible = visible;
    ts.value.visible = visible;
  }

  function hideAll() {
    _.each(texts.all, function(field) {
      setVisibility(field.text, false);
    });
  }

  var currentFieldIndex = 0;

  function isComplete() {
    return currentFieldIndex >= texts.all.length;
  }

  var pauseBetweenFields = 20;
  var pauseCount = 0;
  var isPaused = false;

  function update() {
    if(isComplete()) {
      return;
    }
    if(isPaused) {
      pauseCount ++;
      if(pauseCount > pauseBetweenFields) {
        isPaused = false;
        pauseCount = 0;
      }
      return;
    }

    var currentField = texts.all[currentFieldIndex];

    setVisibility(currentField.text, true);
    if(!currentField.currentValue) {
      currentField.currentValue = 0;
    }

    currentField.currentValue += currentField.inc;
    var targetMet = currentField.currentValue >= currentField.target;
    if(targetMet) {
      currentField.currentValue = currentField.target;
      // change the field
      currentFieldIndex ++;
      isPaused = true;
    }

    currentField.text.value.text = Math.floor(currentField.currentValue);

    if(isComplete()) {
      onComplete.dispatch(stats);
    }
  }

  this.render = function() {
    update();
  };

  this.destroy = function() {
    _.each(texts.all, function(f) {
      var ts = f.text;
      ts.heading.destroy();
      ts.value.destroy();
    });
  };
};

