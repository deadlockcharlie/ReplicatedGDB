var express = require('express');
var router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();



router.post("/", jsonParser, async (req, res) => {
    try {
      // console.log("Adding vertex with body:", req);
      const { label = 'vertex', properties = {} } = req.body;
      console.log(properties);

      
      const query = `CREATE (n:${label} $properties) RETURN n`;
      const params = {
        label:label,
        properties: properties,
      };
      const result = await executeCypherQuery(query, params);
      
      if (result.records.length === 0) {
        return res.status(500).json({
          message: "Failed to create vertex",
        });
      }

      GVertices.set(vertexCount, {label: label, properties: properties});
      vertexCount++;
      // const update = Y.encodeStateAsUpdate(ydocRemote)
      // Y.applyUpdate(ydoc, update);


      // console.log("Result:", result);

      // const traversal = g.addV(label).property('identifier', identifier);
      // for (const [key, value] of Object.entries(properties)) {
      //   traversal.property(key, value);
      // }
      // const result = await traversal.next();
      res.status(201).json(result);
    } catch (error) {
      console.error("Error adding vertex:", error);
      res.status(500).json({
        message: "Error adding vertex",
        error: error.message,
      });
    }
  });

  module.exports = router;
  