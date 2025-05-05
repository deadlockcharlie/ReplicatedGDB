var express = require('express');
var router = express.Router();
// Configure Gremlin client
const gremlin = require("gremlin");
var t = gremlin.process.t;

/* GET home page. */
router.get('/', async function(req, res, next) {
    try {
        // Get all vertices with properties
        const vertices = await g.V().valueMap(true).toList();
    
        // Get all edges with properties
        const edges = await g.E().valueMap(true).toList();

        // console.log("Vertices:", vertices);
        // console.log("Edges:", edges);
        

        // Transform results for better readability
        const graphData = {
          vertices: vertices.map((v) => ({
            identifier: v.get('identifier'),
            name: v.get('name'),
            price: v.get('price'),
            inStock: v.get('inStock'),
            label: v.get(t.label),
            id: v.get(t.id),
          }))
          , edges:
           edges.map((e) => ({
            id: e.get(t.id),
            label: e.get(t.label),
            inV: e.get(t.inV),
            outV: e.get(t.outV),
            properties: e.get(t.properties),
          })),
        };
    
        res.json(graphData);
      } catch (error) {
        res.status(500).json({
          error: "Failed to fetch graph data",
          details: error.message,
        });
      }
});

function cleanProperties(t, element) {
    const props = {};
    for (const [key, value] of element.entries()) {
      if (key !== t.id && key !== t.label) {
        props[key] = value?.toArray ? value.toArray() : value;
      }
    }
    return props;
  }

module.exports = router;
