var express = require('express');
var router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

router.post('/', jsonParser, async (req, res) => {
    try {
        const { SourceLabel, SourcePropName, SourcePropValue, TargetLabel, TargetPropName, TargetPropValue, RelationType, properties = {} } = req.body;
        
        // const traversal = g.V().has('identifier',toId).as('target').V().has('identifier',fromId).addE(label)
        //     .to('target')
        console.log(properties);
        const query = `MATCH (a:${SourceLabel} {${SourcePropName}: "${SourcePropValue}"}), (b:${TargetLabel} {${TargetPropName}: "${TargetPropValue}"}) CREATE (a)-[r:${RelationType} $properties]->(b) RETURN r`;
        const params = {
            SourceLabel: SourceLabel,
            SourcePropName: SourcePropName,
            SourcePropValue: SourcePropValue,
            TargetLabel: TargetLabel,
            TargetPropName: TargetPropName,
            TargetPropValue: TargetPropValue,
            properties: properties,
            RelationType: RelationType || 'RELATIONSHIP'
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
