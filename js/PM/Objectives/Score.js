PM.Objectives.Score = function(targetScore) {
  var isMet = this.isMet = function(level) {
    return targetScore <= level.getScore();
  };

  this.getDescription = function() {
    return "Score at least " + targetScore + " points."
  };
};

