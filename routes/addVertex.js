var express = require('express');
var router = express.Router();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

var { addVertex } = require("../helpers/CRUD");

router.post("/", jsonParser, async (req, res) => {
    try {
      // console.log("Adding vertex with body:", req);
      const { label = 'vertex', properties = {} } = req.body;
      const response = await addVertex(false, label, properties);
      // console.log("Response:", response);
      res.status(201).json({message: "Vertex added successfully"});
    }
       catch (error) {
      // console.error("Error adding vertex:", error);
      res.status(500).json({
        message: "Error adding vertex",
        error: error.message,
      });
    }

      // Ensure the a unique identifier is provided
      
  });



  module.exports = router;
  