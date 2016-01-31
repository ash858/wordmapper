var express = require('express');
var router = express.Router();
var wordMapper = require('../wordmap');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send(JSON.stringify(wordMapper('bed stay in bed the feeling in my head pokemon meow epepe'.split(' '))));
});

module.exports = router;
