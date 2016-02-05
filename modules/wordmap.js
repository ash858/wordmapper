"use strict";

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
  var start = this.wordPositions[originNode.id].move(originIdx, originNode.ltr)
                                               .move(targetIdx * -1, targetLtr);
  var pos = start;
  if (len === 1 && this.grid[pos] === targetText) {
    return start;
  }
  else {
    for (var i = 0; i < len; i++) {
      if (this.grid.hasOwnProperty(pos) && this.grid[pos] !== targetText[i]) return false;
      pos = pos.next(targetLtr); 
    }  
  }
  return start;
};

WordGrid.prototype.addNode = function(node, startPos) {
  this.wordPositions[node.id] = startPos;
  var len = node.text.length;
  var text = node.text;
  var pos = startPos;
  for (var i = 0; i < len; i++) {
    this.grid[pos] = text[i];
    if (i != len - 1) {
      pos = pos.next(node.ltr);  
    }    
  }
  var endPos = pos;
  this.updateBBox(startPos, endPos);
};

WordGrid.prototype.updateBBox = function(startPos, endPos) {
  if (this.topLeft == null) this.topLeft = new Position(startPos.x, startPos.y);
  else {
    this.topLeft.x = Math.min(this.topLeft.x, startPos.x);
    this.topLeft.y = Math.min(this.topLeft.y, startPos.y);
  }
  if (this.bottomRight == null) this.bottomRight = new Position(endPos.x, endPos.y);
  else {
    this.bottomRight.x = Math.max(this.bottomRight.x, endPos.x);
    this.bottomRight.y = Math.max(this.bottomRight.y, endPos.y); 
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
    var originText = originNode.text;
    var targetText = node.text;
    for (var targetTextIdx in targetText) {
      for (var originTextIdx in originText) {
        // Find a spot where the characters match up
        if (targetText[targetTextIdx] == originText[originTextIdx]) {
          // Check if the origin character has any existing connections at that position
          if (!originNode.connections[originTextIdx]) {
            var ltr = !originNode.ltr;
            var startPos = this.grid.fits(originNode, originTextIdx, targetText, targetTextIdx, ltr);
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

function WordMapper(words) {
  this.words = words;
  this.blocks = [];
  this.buildMap();
}

WordMapper.prototype.buildMap = function() {
  var currBlock = new Block();
  this.blocks.push(currBlock);
  var wordsLen = this.words.length;
  for (var i = 0; i < wordsLen; i++) {
    var word = this.words[i];
    var node = new WordNode(i, word);
    if (currBlock.isEmpty()) {
      currBlock.addNode(node);
    }
    else {
      var joinPoint = currBlock.findJoin(node);      
      if (joinPoint) {
        currBlock.joinNode(node, joinPoint);
      }
      else {
        currBlock = new Block();
        this.blocks.push(currBlock);
        currBlock.addNode(node);
      }
    }      
  }
  return this.blocks;
};

function WordMapGenerator(lyricText) {
  var cleanWords = function(word) {
    return word.trim().toLowerCase().replace(/[,.]/, '');
  }
  this.words = lyricText.split(' ').map(cleanWords);
  this.wordMapper = new WordMapper(this.words);
}

function WordMapRenderer(wordMap) {
  this.wordMap = wordMap;
} 

WordMapRenderer.prototype.blockSize = function() {
  return this.wordMap.blocks.length;
};

WordMapRenderer.prototype.renderBlocks = function() {
  var len = this.blockSize();
  for (var i = 0; i < len; i++) {
    this.renderBlock(i);
  }
};

WordMapRenderer.prototype.renderBlock = function(i) {
  var grid = this.wordMap.blocks[i].grid;
  var tl = grid.topLeft;
  var br = grid.bottomRight;
  var height = br.y - tl.y;
  var width = br.x - tl.x; 
  for (var y = 0; y <= height; y++) {
    var pos = new Position(tl.x, tl.y + y);
    var row = '';
    for (var x = 0; x <= width; x++) {
      pos.x = tl.x + x;
      row += grid.grid[pos] || ' ';
    }
    console.log(row);
  }
  console.log('-----------');
};

var wordMapper = new WordMapGenerator("We open with the vultures, kissing the cannibals Sure I get lonely, when I'm the only Only human in the heaving heat of the animals Bitter brown salt, stinging on my tongue and I I will not waiver, heart will not wait its turn It will beat, it will burn, burn, burn your love into the ground With the lips of another 'Til you get lonely, sure I get lonely, sometimes").wordMapper;
var wordRenderer = new WordMapRenderer(wordMapper);

wordRenderer.renderBlocks();

module.exports = WordMapper;