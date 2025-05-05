var express = require('express');
var router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

router.post('/', jsonParser, async (req, res) => {
    try {
        const { label, fromId, toId, properties = {} } = req.body;
        
        const traversal = g.V().has('identifier',toId).as('target').V().has('identifier',fromId).addE(label)
            .to('target')
            
        for (const [key, value] of Object.entries(properties)) {
            traversal.property(key, value);
        }

        const result = await traversal.next();
        
        res.status(201).json({
            message: 'Edge created successfully',
            edgeId: result.value.id
        });
    } catch (error) {
        res.status(500).json({
            error: 'Edge creation failed',
            details: error.message
        });
    }
});


module.exports = router;
