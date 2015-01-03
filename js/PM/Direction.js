(function() {
  var DIRECTION = {
    UP: new Phaser.Point(0, -1), // up
    DOWN: new Phaser.Point(0, 1), // down
    RIGHT: new Phaser.Point(1, 0), // right
    LEFT: new Phaser.Point(-1, 0)
  };
  var AXIS = {
    HORIZONTAL: [DIRECTION.LEFT, DIRECTION.RIGHT],
    VERTICAL: [DIRECTION.DOWN, DIRECTION.UP]
  };
  var AXES = [AXIS.HORIZONTAL, AXIS.VERTICAL];

  PM.Direction = PM.Direction || {
    Up: DIRECTION.UP,
    Down: DIRECTION.DOWN,
    Left: DIRECTION.LEFT,
    Right: DIRECTION. RIGHT,
    All: AXIS.HORIZONTAL.concat(AXIS.VERTICAL),
    pointInDir: function(pt, dir) {
      return Phaser.Point.add(pt, dir);
    }
  };

  PM.Axis = AXIS;
  PM.Axis.All = AXES;
})();
