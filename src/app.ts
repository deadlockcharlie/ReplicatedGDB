import express from "express";
import cookieParser from "cookie-parser";
import createError from "http-errors";
import http from "http";
import path from "path";

export var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  res.set('Connection', 'close');
  next();
});

import { logger } from "./helpers/logging";

// Setup for prometheus
import client from "prom-client";
const register = new client.Registry();
client.collectDefaultMetrics({ register });
const httpRequests = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
});
register.registerMetric(httpRequests);

// Setup YJS

import Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import WebSocketPolyfill from "ws";

let ydoc = new Y.Doc();

new WebsocketProvider(
  process.env.WS_URI,
  "GraceSyncKey",
  ydoc,
  WebSocketPolyfill
);

// Setup Database
import {Neo4jDriver} from "./drivers/neo4jDriver";
import {GremlinDriver} from "./drivers/germlinDriver";

// logger.info(`environment: ${JSON.stringify(process.env)}`);
const dbname = process.env.DATABASE;
logger.info(`Database specified ${dbname}`);
export var driver;
switch (dbname) {
    case "NEO4J":
    case "MEMGRAPH":
        driver = new Neo4jDriver();
    break;
    case "JANUSGRAPH":
      driver = new GremlinDriver();
      break;
    default:
        logger.error("No database specified in configuration. Cannot initialize driver.");
        process.exit(1);
        break;
}

// Setup graph
import { Graph } from "./graph/GraphManager";
import { Vertex_Edge } from "./graph/Graph";
const GraphManager = new Graph();
export const graph = new Vertex_Edge(ydoc, GraphManager);

import {
  VertexSchema,
  deleteVertexSchema,
  EdgeSchema,
  deleteEdgeSchema,
} from "./schemas/requests";

//Setup application routes
import { query, checkSchema, validationResult, check } from "express-validator";
import { getGraph, addVertex, deleteVertex, addEdge, deleteEdge } from "./routes/routes";

{
  app.get("/api/getGraph", async(req,res)=>{
   await getGraph(req,res);
});



  app.post(
    "/api/addVertex",
    checkSchema(VertexSchema, ["body"]),
    async (req, res) => {
      const validation = validationResult(req);
      if (!validation.isEmpty()) {
        logger.error(
          `Add Vertex Malformed request rejected: ${JSON.stringify(validation.array())}`
        );
        res.status(500).json("Malformed request.");
      } else {
        await addVertex(req, res);
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
          `Delete Vertex Malformed request rejected: ${JSON.stringify(validation.array())}`
        );
        res.status(500).json("Malformed request.");
      } else {
        await deleteVertex(req, res);
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
          `Add Edge Malformed request rejected: ${JSON.stringify(validation.array())}`
        );
        res.status(500).json("Malformed request.");
      } else {
        await addEdge(req,res);
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
          `Delete Edge Malformed request rejected: ${JSON.stringify(validation.array())}`
        );
        res.status(500).json("Malformed request.");
      } else {
        await deleteEdge(req, res);
      }
    }
  );

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404));
  });
}



// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send("error");
});

/**
 * Normalize a port into a number, string, or false.
 */

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

var port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);


function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  // console.log("Initializing Gremlin server connection...");
  // const traversal = gremlin.process.AnonymousTraversalSource.traversal;
  // g = traversal().withRemote(
  //   new gremlin.driver.DriverRemoteConnection("ws://localhost:8182/gremlin")
  // );
  // console.log("Gremlin server connection initialized");
  //

  // If the middleware crashes and restarts, it needs to reinitialise the database. 

  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  logger.debug("Listening on " + bind);
}