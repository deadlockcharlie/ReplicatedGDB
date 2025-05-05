var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'GDB', body: 'Welcome to a very nice graph DB application' });
});

module.exports = router;
