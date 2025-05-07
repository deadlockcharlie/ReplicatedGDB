var express = require('express');
var router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();


/* GET home page. */
router.get('/',jsonParser, async function(req, res, next) {

  try {
    const result = await session.run(
      'MATCH (n)-[r]->(m) RETURN n, r, m'
    );

    const records = result.records.map(record => ({
      n: record.get('n').properties,
      m: record.get('m').properties,
      r: record.get('r').type,
    }));

    res.json(records);
  } catch (error) {
    console.error('Error fetching data from Neo4j:', error);
    res.status(500).send('Internal Server Error');
  }

  // res.render('index', { title: 'GDB', body: 'Welcome to a very nice graph DB application' });

});

module.exports = router;
