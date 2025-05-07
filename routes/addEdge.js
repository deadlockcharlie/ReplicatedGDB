var express = require('express');
var router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

router.post('/', jsonParser, async (req, res) => {
    try {
        const { label, fromId, toId, properties = {} } = req.body;
        
        // const traversal = g.V().has('identifier',toId).as('target').V().has('identifier',fromId).addE(label)
        //     .to('target')
        
        const query = `MATCH (a), (b) WHERE id(a) = $idA AND id(b) = $idB CREATE (a)-[:RELATES_TO]->(b) RETURN a, b`;
        const params = {
            idA: fromId,
            idB: toId
        };
        const result = await executeCypherQuery(query, params);
        console.log("Result:", result);
        // for (const [key, value] of Object.entries(properties)) {
        //     traversal.property(key, value);
        // }

        // const result = await traversal.next();
        
        res.status(201).json({
            message: 'Edge created successfully',
        });
    } catch (error) {
        res.status(500).json({
            error: 'Edge creation failed',
            details: error.message
        });
    }
});


module.exports = router;
