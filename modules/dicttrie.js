"use strict";

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
  this.dictionaryFile = dictionaryFile || '/usr/share/dict/words';
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
  var self = this;
  return new Promise(function(resolve, reject) {
    self.load().then(function() {
	    var node = self.root;
		  for (var i = 0; i < word.length; i++) {
		    node = node.nodes[word[i]]; 
		    if (!node) {
		      resolve(false);
		    }
		  }
		  resolve(true);
	  });
  });
};

module.exports = DictionaryTrie;
