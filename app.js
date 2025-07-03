var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var { addVertex, deleteVertex, addEdge,deleteEdge } = require("./helpers/CRUD");

var Y = require("yjs");
var {WebsocketProvider} = require("y-websocket");

const { fromUint8Array, toUint8Array } = require("js-base64");

ydoc = new Y.Doc();

import { AdjacencyList } from "./AdjList";


GVertices = ydoc.getMap("GVertices");
GEdges = ydoc.getMap("GEdges");
//const adjList = new AdjacencyList(ydoc, {
//  addVertex,
//  deleteVertex,
//  addEdge,
//  deleteEdge
//});

vertexCount = 0;

const wsProvider = new WebsocketProvider(process.env.WS_URI, 'GraceSyncKey', ydoc, { WebSocketPolyfill: require('ws') });

// const wrtcprovider = new WebrtcProvider("graphdb", ydoc, {
//   signaling: ["ws://localhost:4444"],
//   peerOpts: {
//     wrtc: wrtc,
//   },
// });



//adjList['GVertices'].observeDeep((yevent, transaction) =>{ // GEdges
GEdges.observe((yevent, transaction) =>{
  yevent.changes.keys.forEach((update,key)=> {
    if(update.action === "delete" && !transaction.local){
      // console.log("Key deleted: ", key);
      // console.log("Update: ", update.oldValue);
      var toDelete = update.oldValue;

      if(toDelete.hasOwnProperty("relationType")) {
        // console.log("Delete edge was called from a remote client", toDelete);
        (async () => {
          await deleteEdge(
            true,
            toDelete.relationType,
            toDelete.properties
          );
        })().catch((error) => {
          console.error("Error deleting edge due to a remote update:", error);
        });
      }

    }
  });
});

//adjList['GVertices'].observe((yevent, transaction) => {
GVertices.observe((yevent, transaction) => {
  yevent.changes.keys.forEach((update, key) => {
  
    if(update.action === "delete" && !transaction.local) {
      // console.log("Transaction was issued for a delete", transaction);
      // console.log("Key deleted: ", key);
      // console.log("Update: ", update.oldValue);
      var toDelete = update.oldValue;

      if(toDelete.hasOwnProperty("label")) {
        (async () => {
          await deleteVertex(
            true,
            toDelete.label,
            toDelete.properties
          );
        })().catch((error) => {
          console.error("Error deleting vertex due to remote update:", error);
        });
      }
    }
      
  });
  
});

//adjList.observe(() => {
//  
//});

ydoc.on("update", (update, origin, doc, transaction) => {
  // console.log("Yjs document updated:", update);
  var updateString = Y.decodeUpdate(update);
  // console.log("Doc updated: ", doc);

  if (transaction.local) {
    return;
  } else {
    // console.log("Yjs document updated ", JSON.stringify(updateString, null, 2));
    for (const updateValue of updateString.structs) {
      // console.log("Vertices: ", GVertices.toJSON());
      // console.log("Update value: ", JSON.stringify(updateValue, null, 2));
      if (updateValue.content.hasOwnProperty("arr")) {
        if (updateValue.content.arr[0].hasOwnProperty("label")) {
          (async () => {
            await addVertex(
              true,
              updateValue.content.arr[0].label,
              updateValue.content.arr[0].properties
            );
            // Y.applyUpdate(ydoc, update);
            // console.log("Done adding vertex");
          })().catch((error) => {
            console.error("Error adding vertex due to remote update:", error);
          });
        } else if (updateValue.content.arr[0].hasOwnProperty("sourceLabel")) {
          // console.log(
          //   "Add edge was called from a remote client",
          //   updateValue.content
          // );
          (async () => {
            await addEdge(
              true,
              updateValue.content.arr[0].sourceLabel,
              updateValue.content.arr[0].sourcePropName,
              updateValue.content.arr[0].sourcePropValue,
              updateValue.content.arr[0].targetLabel,
              updateValue.content.arr[0].targetPropName,
              updateValue.content.arr[0].targetPropValue,
              updateValue.content.arr[0].relationType,
              updateValue.content.arr[0].properties
            );
          })().catch((error) => {
            console.error("Error adding edge due to a remote update:", error);
          });
        }
      }
    }
  }
});

//adjList.observe(() => {
//  // React to any remote or local change in graph
//  console.log("Graph updated");
//
//  // If you want to re-sync to a DB, UI, etc. do it here
//});


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

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var addVertexRouter = require("./routes/addVertex");
var deleteVertexRouter = require("./routes/deleteVertex");
var addEdgeRouter = require("./routes/addEdge");
var deleteEdgeRouter = require("./routes/deleteEdge");
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
app.use("/api/deleteVertex", deleteVertexRouter);
app.use("/api/deleteEdge", deleteEdgeRouter);

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
