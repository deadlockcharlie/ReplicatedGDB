var express = require('express');
const {executeCypherQuery} = require("../app")
var router = express.Router();
// Configure Gremlin client

/* GET home page. */
router.get('/', async function(req, res, next) {
    try {
        const {limit = 100} = req.body;
        const query = `MATCH (n)
                      OPTIONAL MATCH (n)-[r]-(m)
                      RETURN COLLECT(DISTINCT n) AS nodes, COLLECT(DISTINCT r) AS relationships LIMIT ${limit}`; 
        const result = await executeCypherQuery(query);
        res.json(result.records);
      } catch (error) {
        res.status(500).json({
          error: "Failed to fetch graph data",
          details: error.message,
        });
      }
});


module.exports = router;
