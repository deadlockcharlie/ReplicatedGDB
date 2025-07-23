
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
//var { addVertex, deleteVertex, addEdge,deleteEdge } = require("./helpers/CRUD");

var Y = require("yjs");
var {WebsocketProvider} = require("y-websocket");
const { Vertex_Edge } = require('./helpers/Graph_Class');
const {Graph} = require('./helpers/GraphManager')

const { fromUint8Array, toUint8Array } = require("js-base64");

var neo4j = require("neo4j-driver");


console.log("Connecting to neo4j on Bolt port:", process.env.NEO4J_URI);
driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));

executeCypherQuery = async (statement, params = {}) => {
  session = driver.session();
  try {
    const result = await session.run(statement, params);
    return result;
  } catch (error) {
    throw error; // we are logging this error at the time of calling this method
  }
};

ydoc = new Y.Doc();
const GraphManager = new Graph();
const graph = new Vertex_Edge(ydoc, executeCypherQuery, GraphManager);
vertexCount = 0;

const wsProvider = new WebsocketProvider(process.env.WS_URI, 'GraceSyncKey', ydoc, { WebSocketPolyfill: require('ws') });

// const wrtcprovider = new WebrtcProvider("graphdb", ydoc, {
//   signaling: ["ws://localhost:4444"],
//   peerOpts: {
//     wrtc: wrtc,
//   },
// });



// observe all changes in the graph (if needed for debugging)
//graph.observe(() => {
//  const update = Y.encodeStateAsUpdate(ydoc);
//});

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var getGraphRouter = require("./routes/getGraph");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api/getGraph", getGraphRouter);

//app.use("/api/addVertex", addVertexRouter);
app.post('/api/addVertex', async (req, res) => {
  try {
    const { label, properties } = req.body;
    const result = await graph.addVertex(label, properties, false);
    res.json(result);
  } catch (err) {
    console.log(res, err);
  }
});

//app.use("/api/deleteVertex", deleteVertexRouter);
app.post('/api/deleteVertex', async (req, res) => {
  try {
    const label = req.body.label; // you can pass label via query
    const properties = req.body.properties;
    const result = await graph.removeVertex(label, properties, false);
    res.json(result);
  } catch (err) {
    console.log(res, err);
  }
});

//app.use("/api/addEdge", addEdgeRouter);
app.post('/api/addEdge', async (req, res) => {
  try {
    const {
      relationType,
      sourceLabel,
      sourcePropName,
      sourcePropValue,
      targetLabel,
      targetPropName,
      targetPropValue,
      properties
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
    res.json(result);
  } catch (err) {
    console.log(res, err);
  }
});

//app.use("/api/deleteEdge", deleteEdgeRouter);
app.post('/api/deleteEdge', async (req, res) => {
  try {
    const relationType = req.body.relationType;
    const properties   = req.body.properties;

    const result = await graph.removeEdge(
      relationType,
      properties,
      false
    );
    res.json(result);
  } catch (err) {
    console.log(res, err);
  }
});


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