var express = require('express');
var router = express.Router();

var wordMapper = require('../wordmap');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
    title: 'Express', 
    wordJson: JSON.stringify(wordMapper('One thing I dont know why it doesnt even matter how hard you try'.split(' ')))
  });
});

module.exports = router;
