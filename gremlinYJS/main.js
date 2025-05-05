const express = require('express');
const gremlin = require('gremlin');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const app = express();



// // Configure Gremlin client
// const gremlin = require("gremlin");
// const { t } = gremlin.process;
// var g = gremlin.process.AnonymousTraversalSource.traversal;

const port = 3000;

// View graph route
app.get("/api/graph", async (req, res) => {
  try {
    // Get all vertices with properties
    const vertices = await g.V().valueMap(true).toList();

    // Get all edges with properties
    const edges = await g.E().valueMap(true).toList();

    // Transform results for better readability
    const graphData = {
      vertices: vertices.map((v) => ({
        id: v.get(t.id),
        label: v.get(t.label),
        properties: cleanProperties(v),
      })),
      edges: edges.map((e) => ({
        id: e.get(t.id),
        label: e.get(t.label),
        inV: e.get(t.inV),
        outV: e.get(t.outV),
        properties: cleanProperties(e),
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

app.post("/api/add-vertex", jsonParser, async (req, res) => {
  try {
    // console.log("Adding vertex with body:", req);
    const { id, label = 'vertex', properties = {} } = req.body;

    const traversal = g.addV(label).property("id", id);
    for (const [key, value] of Object.entries(properties)) {
      traversal.property(key, value);
    }
    const result = await traversal.next();
    res.status(201).json({
      message: "Vertex added successfully",
      vertex: result.value.id,
      label: result.value.label,
      properties: result.value.properties,
    });
  } catch (error) {
    console.error("Error adding vertex:", error);
    res.status(500).json({
      message: "Error adding vertex",
      error: error.message,
    });
  }
});

app.post('/api/add-edge', jsonParser, async (req, res) => {
    try {
        const { label, fromId, toId, properties = {} } = req.body;
        
        const traversal = g.V(toId).as('target').V(fromId).addE(label)
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


app.listen(port, () => {
  console.log("Initializing Gremlin server connection...");
  const traversal = gremlin.process.AnonymousTraversalSource.traversal;
  g = traversal().withRemote(
    new gremlin.driver.DriverRemoteConnection("ws://localhost:8182/gremlin")
  );
  console.log("Gremlin server connection initialized");


  console.log(`Example app listening at http://localhost:${port}`);
});

// Helper function to clean properties
function cleanProperties(element) {
  const props = {};
  for (const [key, value] of element.entries()) {
    if (key !== t.id && key !== t.label) {
      props[key] = value?.toArray ? value.toArray() : value;
    }
  }
  return props;
}
