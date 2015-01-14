// Just used for testing.
PM.Objectives.Impossible = function() {
  var isMet = this.isMet = function() {
    return false;
  };

  this.getDescription = function() {
    return "Endless.";
  };
};

