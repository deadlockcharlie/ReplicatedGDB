var express = require('express');
var router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

var { addEdge } = require("../helpers/CRUD");

router.post('/', jsonParser, async (req, res) => {
    try {
            const { sourceLabel, sourcePropName, sourcePropValue, targetLabel, targetPropName, targetPropValue, relationType, properties = {} } = req.body;
                

        await addEdge(false, sourceLabel, sourcePropName, sourcePropValue, targetLabel, targetPropName, targetPropValue, relationType, properties);
        res.status(201).json({message: 'Edge created successfully'});
    } catch (error) {
        res.status(500).json({
            error: 'Edge creation failed',
            details: error.message
        });
    }
});



module.exports = router;
