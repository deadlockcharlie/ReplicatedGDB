var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

var Y = require("yjs");
const {WebrtcProvider} = require("y-webrtc");
const wrtc = require("@roamhq/wrtc");

ydoc = new Y.Doc();


GVertices = ydoc.getMap("GVertices");
vertexCount = 0;

const wrtcprovider = new WebrtcProvider("graphdb", ydoc, {
  signaling: ['ws://localhost:4444'],
  peerOpts: {
    wrtc: wrtc
  }
});

ydoc.on("update", (update) => {
  console.log("Yjs document updated:", update);
});
var neo4j = require('neo4j-driver');
// Neo4j Driver
driver = neo4j.driver(
  'bolt://localhost:7687',
);
session = driver.session();

executeCypherQuery = async (statement, params = {}) => {
  try {
    const result = await session.run(statement, params);
    return result;
  } catch (error) {
    throw error; // we are logging this error at the time of calling this method
  }
}


// // Configure Gremlin client
// const gremlin = require("gremlin");
// var t = gremlin.process;
// var g = gremlin.process.AnonymousTraversalSource.traversal;


var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var addVertexRouter = require("./routes/addVertex");
var addEdgeRouter = require("./routes/addEdge");
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
app.use("/api/addVertex", addVertexRouter);
app.use("/api/addEdge", addEdgeRouter);

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

module.exports = app;
