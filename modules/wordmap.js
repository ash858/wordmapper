"use strict";

const Combinatorics = require('js-combinatorics');
const fs = require('fs');
const Promise = require('promise');

/** 
 * Position
 */
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

/** 
 * WordTrieNode
 */
function WordTrieNode(character) {
  this.character = character;
  this.nodes = {};
  this.marked = false;
}

WordTrieNode.prototype.addChar = function(character) {
  if (!this.nodes[character]) {
    var node = new WordTrieNode(character);
    this.nodes[character] = node;
  }
  return this.nodes[character];
}

/** 
 * WordTrie
 */
function DictionaryTrie(dictionaryFile) {
  this.dictionaryFile = dictionaryFile;
  this.root = new WordTrieNode(null);
  this.built = false;
  this.load();
}

DictionaryTrie.prototype.addWord = function(root, word) {
  var characters = word.split('');
  var trieNode = root;
  for (var i = 0; i < characters.length; i++) {
    trieNode = trieNode.addChar(characters[i]);
  }
  trieNode.marked = true;
};

DictionaryTrie.prototype.load = function() {
  var self = this;
  return new Promise(function (resolve, reject) {
    if (self.built) resolve();
    else {
      fs.readFile(self.dictionaryFile, 'utf8', (err, data) => {
        if (err) reject(err);
        data.split('\n').forEach(function (word) {
          self.addWord(self.root, word);
        });
        self.built = true;
        resolve(self);
      }); 
    }
  });
};

DictionaryTrie.prototype.hasWord = function(word) {
  var node = this.root;
  for (var i = 0; i < word.length; i++) {
    node = node.nodes[word[i]]; 
    if (!node) {
      return false;
    }
  }
  return true;
};

/**
 * WordGrid
 */
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
  var bBox = this.getBoundingBox();
  if (bBox) {
    return (bBox.botRight.x - bBox.topLeft.x + 1) * (bBox.botRight.y - bBox.topLeft.y + 1); 
  }
  return 0;
};

/**
 * fits
 *
 * Check the word grid to see if the given word can be placed such that it doesn't
 * overlap with any mismatching characters.
 * 
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
 * Block
 *
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

Block.prototype.getBoundingBoxArea = function() {
  return this.grid.getBoundingBoxArea();
}

/**
 * WordNodeConnection
 */
function WordNodeConnection(joinNode, joinPos, selfPos) {
  this.joinNodeId = joinNode.id;
  this.joinPos = joinPos;
  this.selfPos = selfPos;
};

/**
 * WordNode
 *
 * A word node represents the text of a single word, its timing 
 * information, and how it connects to another node. 
 */
function WordNode(id, text) {
  this.id = id;
  this.text = text;
  this.connections = {};
  this.ltr = true;
};

/**
 * WordMapper 
 */
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

WordMapper.prototype.getTotalArea = function() {
  return this.blocks.map(function(b) {
    return b.getBoundingBoxArea();
  }).reduce(function(a,b) {
    return a + b;
  }, 0);
}

function WordMapGenerator(lyricText) {
  var cleanWords = function(word) {
    return word.trim().toLowerCase().replace(/[,.]/, '');
  }
  this.words = lyricText.split(' ').map(cleanWords);
  this.wordsPermutation();
}

WordMapGenerator.prototype.wordsPermutation = function() {
  var len = this.words.length;
  var indicies = [];
  for (var i = 0; i < len; i++) {
    indicies.push(i);
  }
  var perms = Combinatorics.permutation(indicies),
      perm = null,
      count = 0,
      minBlocks = Number.MAX_VALUE,
      minArea = Number.MAX_VALUE,
      candidate = null;
  while ((perm = perms.next()) && count < 200000) {
    var wordPerm = perm.map(function(i) { 
      return this.words[i]; 
    }.bind(this));
    //console.log(wordPerm);
    var mapper = new WordMapper(wordPerm);
    if (mapper.blocks.length <= minBlocks) {
      var totalArea = mapper.getTotalArea();
      if (mapper.blocks.length < minBlocks || totalArea < minArea) {
        candidate = mapper;
        minArea = totalArea;
      }      
      minBlocks = mapper.blocks.length;
    }
    count++;
  }
  //console.log(minBlocks);
  //console.log(minArea);
  new WordMapRenderer(candidate).renderBlocks();
  console.log("Tried " + count + " variations.");
};

/**
 * WordMapRenderer 
 */
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
 // console.log(this.wordMap.blocks[i].grid.getBoundingBoxArea());
  console.log('-----------');

};

//var wordMapper = new WordMapGenerator("I never could see the waves that roll me under").wordMapper;
//var wordRenderer = new WordMapRenderer(wordMapper);

//wordRenderer.renderBlocks();

var dict = new DictionaryTrie('/usr/share/dict/words');

module.exports = WordMapper;