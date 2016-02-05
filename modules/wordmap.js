var DEFAULT_COLOR = "#333";

function Position(x, y) {
  this.x = parseInt(x);
  this.y = parseInt(y);
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
  var i = parseInt(i);
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


function WordGrid() {
  this.wordPositions = {};
  this.grid = {};
  this.topLeft = null;
  this.bottomRight = null;
}

WordGrid.prototype.getBoundingBox = function() {
  if (this.topLeft == null || this.bottomRight == null) return null;
  return {topLeft: this.topLeft, botRight: this.bottomRight}; 
};

WordGrid.prototype.getBoundingBoxArea = function() {
  var bBox = this.getBoundingBox;
  if (bBox) {
    return (bBox.botRight.x - bBox.topLeft.x) * (bBox.botRight.y - bBox.topLeft.y); 
  }
  return 0;
};

/**
 * Check the word grid to see if the given word can be placed such that it doesn't
 * overlap with any mismatching characters.
 * @param word (string) - The word to check
 * @param joinPos (Position) - The position where the join occurs
 * @param wordIdx (int) - The word's char index where the join occurs
 * @param ltr (boolean) - True if intended direction of word is horizonal. 
 *                        Vertical if false.
 * @return - The start position (Position) if word fits, or false otherwise.
 */
WordGrid.prototype.fits = function(originNode, originIdx, targetText, targetIdx, targetLtr) {
  var len = targetText.length;
  var start = this.wordPositions[originNode.id].move(originIdx, originNode.ltr).move(targetIdx * -1, targetLtr);
  var pos = start;
  if (len === 1 && this.grid[pos] === targetText) {
    return start;
  }
  else {
    for (var i = 1; i < len; i++) {
      if (this.grid.hasOwnProperty(pos) && this.grid[pos] != targetText[i]) return false;
      pos = pos.next(targetLtr); 
    }  
  }
  return start;
};

WordGrid.prototype.addNode = function(node, startPosition) {
  this.wordPositions[node.id] = startPosition;
  var len =  node.text.length;
  var chars = node.text.split('');
  var pos = startPosition;
  for (var i = 0; i < len; i++) {
    this.grid[pos] = chars[i];
    if (i != len - 1) {
      pos = pos.next(node.ltr);  
    }    
  }
  var endPosition = pos;
  this.updateBBox(startPosition, endPosition);
};

WordGrid.prototype.updateBBox = function(startPosition, endPosition) {
  if (this.topLeft == null) this.topLeft = startPosition;
  else {
    this.topLeft.x = Math.min(this.topLeft.x, startPosition.x);
    this.topLeft.y = Math.min(this.topLeft.y, startPosition.y);
  }
  if (this.bottomRight == null) this.bottomRight = endPosition;
  else {
    this.bottomRight.x = Math.max(this.bottomRight.x, endPosition.x);
    this.bottomRight.y = Math.max(this.bottomRight.y, endPosition.y); 
  }
}

/**
 * A block is a collection of word nodes that are connected with 
 * each other.
 */
function Block() {
  this.nodes = [];
  this.grid = new WordGrid();
};

Block.prototype.addNode = function(node, startPosition) {
  this.nodes.push(node);  
  this.grid.addNode(node, startPosition || new Position(0,0));
};

Block.prototype.isEmpty = function() {
  return this.nodes.length == 0;
};

Block.prototype.findJoin = function(node) {
  var len = this.nodes.length;
  for (var nodeIdx = 0; nodeIdx < len; nodeIdx++) {
    var originNode = this.nodes[nodeIdx];
    var originText = originNode.text.split('');
    var targetText = node.text.split('');
    for (var targetTextIdx in targetText) {
      for (var originTextIdx in originText) {
        // Find a spot where the characters match up
        if (targetText[targetTextIdx] == originText[originTextIdx]) {
          // Check if the origin character has any existing connections at that position
          if (!originNode.connections[originTextIdx]) {
            var ltr = !originNode.ltr;
            var startPos = this.grid.fits(originNode, originTextIdx, node.text, targetTextIdx, ltr);
            if (startPos) {
              return {
                'originNode': originNode,
                'originIdx': originTextIdx,
                'targetIdx': targetTextIdx,
                'targetLtr': ltr,
                'targetPos': startPos
              };                
            }                
          }
        }
      }
    }
  }
  return false;
};

Block.prototype.joinNode = function(wordNode, joinPoint) {
  // Join the two nodes 
  wordNode.connections[joinPoint.targetIdx] = new WordNodeConnection(joinPoint.originNode, joinPoint.originIdx, joinPoint.targetIdx);
  wordNode.ltr = joinPoint.targetLtr;
  this.addNode(wordNode, joinPoint.targetPos);
  return wordNode.connections[joinPoint.targetIdx];
}

function WordNodeConnection(joinNode, joinPos, selfPos) {
  this.joinNodeId = joinNode.id;
  this.joinPos = joinPos;
  this.selfPos = selfPos;
};

/**
 * A word node represents the text of a single word, its timing 
 * information, and how it connects to another node. 
 */
function WordNode(id, text) {
  this.id = id;
  this.text = text;
  this.color = DEFAULT_COLOR;
  this.connections = {};
  this.ltr = true;
};

function WordMapper(lyricText) {
  var cleanWord = function(word) {
    return word.trim();
  }
  this.words = lyricText.split(' ').map(function(x) {
    return cleanWord(x);
  });
  this.blocks = [];
  this.currBlock = null;
}

WordMapper.prototype.getMap = function() {
  this.currBlock = new Block();
  this.blocks.push(this.currBlock);
  var wordsLen = this.words.length;
  for (var i = 0; i < wordsLen; i++) {
    var word = this.words[i];
    var node = new WordNode(i, word);
    if (this.currBlock.isEmpty()) {
      this.currBlock.addNode(node);
    }
    else {
      var joinPoint = this.currBlock.findJoin(node);
      if (joinPoint) {
        this.currBlock.joinNode(node, joinPoint);
      }
      else {
        this.currBlock = new Block();
        this.blocks.push(this.currBlock);
        this.currBlock.addNode(node);
      }
    }  
  }
  return this.blocks;
};


var wordMapper = new WordMapper("till i collapse im spilling these raps long as you feel it till the day that i die you'll never say");
console.log(JSON.stringify(wordMapper.getMap()));

module.exports = WordMapper;