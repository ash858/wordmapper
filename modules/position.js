function Position(x, y) {
  this.x = x;
  this.y = y;
}

Position.prototype.next = function(ltr) {
  if (ltr) {
    return this.right();
  }
  return this.down();
};

Position.prototype.prev = function(ltr) {
  if (ltr) {
    return this.left();
  }
  return this.up();
};

Position.prototype.move = function(i, ltr) {
  if (ltr) {
    return new Position(this.x + i, this.y);
  }
  return new Position(this.x, this.y + i);
};

Position.prototype.left = function() {
  return new Position(this.x - 1, this.y);
};

Position.prototype.right = function() {
  return new Position(this.x + 1, this.y);
};

Position.prototype.up = function() {
  return new Position(this.x, this.y - 1);
};

Position.prototype.down = function() {
  return new Position(this.x, this.y + 1);
};

Position.prototype.toString = function() {
  return 'x:' + this.x + 'y:' + this.y;
};

exports.Position = Position;