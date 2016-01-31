var express = require('express');

var DEFAULT_COLOR = "#333";

/**
 * A block is a collection of word nodes that are connected with 
 * each other.
 */
var Block = function() {
  this.nodes = [];
};

Block.prototype.addNode = function(node) {
  this.nodes.push(node);  
};

Block.prototype.isEmpty = function() {
  return this.nodes.length == 0;
};

var WordNodeConnection = function(joinNode, joinPos, selfPos) {
  this.joinNodeId = joinNode.id;
  this.joinPos = joinPos;
  this.selfPos = selfPos;
};

/**
 * A word node represents the text of a single word, its timing 
 * information, and how it connects to another node. 
 */
var WordNode = function(id, text) {
  this.id = id;
  this.text = text;
  this.color = DEFAULT_COLOR;
  this.connections = {};
  this.ltr = true;
};

WordNode.prototype.attemptJoin = function(node) {
  // A node can only have a max of two connections
  if (this.connections.length == 2) return false;
  var originText = this.text.split('');
  var appendText = node.text.split('');
  for (var i in appendText) {
    for (var j in originText) {
      // Find a spot where the characters match up
      if (appendText[i] == originText[j]) {
        // Check if the origin character has any existing connections
        // at that position
        if (!this.connections[j]) {
          // Join the two nodes
          //this.connections[j] = new WordNodeConnection(node, i, j);
          node.connections[i] = new WordNodeConnection(this, j, i);
          node.ltr = !this.ltr;
          return node.connections[i];    
        }
      }
    }
  }  
  return false; 
}


/** Main **/

var getWordMap = function(lyrics) {
  var blocks = [];
  var currBlock = null;
  
  for (var i = 0; i < lyrics.length; i++) {
    var word = lyrics[i];
    var node = new WordNode(i, word);
    if (!currBlock) {
      currBlock = new Block();
      blocks.push(currBlock);
    }
    if (currBlock.isEmpty()) {
      currBlock.addNode(node);
    }
    else {
      var connection = false;
      for (var j = 0; j < currBlock.nodes.length; j++) {
        var priorNode = currBlock.nodes[j];
        var connection = priorNode.attemptJoin(node);
        if (connection !== false) {
          break;
        }  
      }
      if (!connection) {
        currBlock = new Block();
        blocks.push(currBlock);
      }
      currBlock.addNode(node);
    }  
  }
  return blocks; 
};

module.exports = getWordMap;


