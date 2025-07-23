var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
const logger = require("./helpers/Logging");
const {
  query,
  checkSchema,
  validationResult,
  check,
} = require("express-validator");
const {
  VertexSchema,
  EdgeSchema,
  deleteVertexSchema,
  deleteEdgeSchema,
} = require("./Schemas/Requests");

const { executeCypherQuery } = require("./helpers/DatabaseDriver");

var Y = require("yjs");
var {WebsocketProvider} = require("y-websocket");
const { Vertex_Edge } = require('./helpers/Graph_Class');
const {Graph} = require('./helpers/GraphManager')



ydoc = new Y.Doc();
const GraphManager = new Graph();
const graph = new Vertex_Edge(ydoc, executeCypherQuery, GraphManager);
vertexCount = 0;

const wsProvider = new WebsocketProvider(
  process.env.WS_URI,
  "GraceSyncKey",
  ydoc,
  { WebSocketPolyfill: require("ws") }
);

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var getGraphRouter = require("./routes/getGraph");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api/getGraph", getGraphRouter);

app.post(
  "/api/addVertex",
  checkSchema(VertexSchema, ["body"]),
  async (req, res) => {
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      logger.error(
        `Malformed request rejected: ${JSON.stringify(validation.array())}`
      );
      res.status(500);
      res.json("Malformed request.");
    } else {
      try {
        const { label, properties } = req.body;
        const result = await graph.addVertex(label, properties, false);
        logger.info(`Vertex added: ${JSON.stringify(result)}`);
        res.json(result);
      } catch (err) {
        logger.error(`Error adding vertex ${err}`);
        res.status(500);
        res.json("Error adding vertex");
      }
    }
  }
);

app.post(
  "/api/deleteVertex",
  checkSchema(deleteVertexSchema, ["body"]),
  async (req, res) => {
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      logger.error(
        `Malformed request rejected: ${JSON.stringify(validation.array())}`
      );
      res.status(500);
      res.json("Malformed request.");
    } else {
      try {
        const label = req.body.label; // you can pass label via query
        const properties = req.body.properties;
        const result = await graph.removeVertex(label, properties, false);
        logger.info(`Vertex deleted: ${JSON.stringify(result)}`);
        res.json(result);
      } catch (err) {
        logger.error(`Error removing vertex ${err}`);
        res.status(500);
        res.json("Error removing vertex");
      }
    }
  }
);

app.post(
  "/api/addEdge",
  checkSchema(EdgeSchema, ["body"]),
  async (req, res) => {
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      logger.error(
        `Malformed request rejected: ${JSON.stringify(validation.array())}`
      );
      res.status(500);
      res.json("Malformed request.");
    } else {
      try {
        const {
          relationType,
          sourceLabel,
          sourcePropName,
          sourcePropValue,
          targetLabel,
          targetPropName,
          targetPropValue,
          properties,
        } = req.body;

        const result = await graph.addEdge(
          relationType,
          sourceLabel,
          sourcePropName,
          sourcePropValue,
          targetLabel,
          targetPropName,
          targetPropValue,
          properties,
          false
        );
        logger.info(`Edge added: ${JSON.stringify(result)}`);
        res.json(result);
      } catch (err) {
        logger.error(`Error adding edge ${err}`);
        res.status(500);
        res.json("Error adding edge");
      }
    }
  }
);

app.post(
  "/api/deleteEdge",
  checkSchema(deleteEdgeSchema, ["body"]),
  async (req, res) => {
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      logger.error(
        `Malformed request rejected: ${JSON.stringify(validation.array())}`
      );
      res.status(500);
      res.json("Malformed request.");
    } else {
      try {
        const relationType = req.body.relationType;
        const properties = req.body.properties;

        const result = await graph.removeEdge(relationType, properties, false);
        logger.info(`Edge deleted: ${JSON.stringify(result)}`);
        res.json(result);
      } catch (err) {
        logger.error(`Error deleting edge ${err}`);
        res.status(500);
        res.json("Error deleting edge");
      }
    }
  }
);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

module.exports = app;
module.exports.executeCypherQuery = executeCypherQuery;
module.exports = { logger };
