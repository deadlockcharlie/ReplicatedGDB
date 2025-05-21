var express = require('express');
var router = express.Router();
var bodyParser = require("body-parser");
const { deleteVertex } = require('../helpers/CRUD');
var jsonParser = bodyParser.json();



router.post("/", jsonParser, async (req, res) => {
    try {
      // console.log("Adding vertex with body:", req);
      const { label = 'vertex', properties = {} } = req.body;
      // console.log("Deleting vertex with body:", label);
      await deleteVertex(false, label, properties);
      res.status(201).json({message: "Vertex deleted successfully"});
    } catch (error) {
      // console.error("Error deleting vertex:", error);
      res.status(500).json({
        message: "Error deleting vertex",
        error: error.message,
      });
    }
  });

  module.exports = router;
  