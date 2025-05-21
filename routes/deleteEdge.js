var express = require('express');
var router = express.Router();
var bodyParser = require("body-parser");
const { deleteEdge } = require('../helpers/CRUD');
var jsonParser = bodyParser.json();



router.post("/", jsonParser, async (req, res) => {
    try {
      // console.log("Adding vertex with body:", req);
      const { relationType, properties } = req.body;
      console.log("Deleting edge with body:", relationType, JSON.stringify(properties, null, 2));
      await deleteEdge(false, relationType, properties);
      res.status(201).json({message: "Edge deleted successfully"});
    } catch (error) {
      // console.error("Error deleting edge:", error);
      res.status(500).json({
        message: "Error deleting edge",
        error: error.message,
      });
    }
  });

  module.exports = router;
  