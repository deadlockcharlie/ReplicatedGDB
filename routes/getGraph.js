var express = require('express');
var router = express.Router();
// Configure Gremlin client

/* GET home page. */
router.get('/', async function(req, res, next) {
    try {
        const {limit = 100} = req.body;
        const query = `MATCH (n)-[r]->(m) RETURN n, r, m LIMIT ${limit}`; 
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
