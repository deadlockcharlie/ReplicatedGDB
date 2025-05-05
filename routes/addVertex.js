var express = require('express');
var router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

router.post("/", jsonParser, async (req, res) => {
    try {
      // console.log("Adding vertex with body:", req);
      const { identifier, label = 'vertex', properties = {} } = req.body;
    console.log("Vertex ID:", identifier);
      const traversal = g.addV(label).property('identifier', identifier);
      for (const [key, value] of Object.entries(properties)) {
        traversal.property(key, value);
      }
      const result = await traversal.next();
      res.status(201).json({
        message: "Vertex added successfully",
        id: result.value.id,
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

  module.exports = router;
  