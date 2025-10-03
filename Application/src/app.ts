import express from "express";
import cookieParser from "cookie-parser";
import createError from "http-errors";
import http from "http";
import path from "path";

export var app = express();
let preloadDone = false;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  res.set("Connection", "close");
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
import { GremlinDriver } from "./drivers/germlinDriver";
import { MemGraphDriver } from "./drivers/memgraphDriver";
import {ArangoDBDriver } from "./drivers/ArangoDBDriver";
import { MongoDBDriver } from "./drivers/MongoDBDriver";

// logger.info(`environment: ${JSON.stringify(process.env)}`);
const dbname = process.env.DATABASE;
logger.info(`Database specified ${dbname}`);
export var driver;
switch (dbname) {
  case "NEO4J":
  case "MEMGRAPH":
    driver = new MemGraphDriver();
    break;
  case "JANUSGRAPH":
    driver = new GremlinDriver();
    break;
  case "ARANGODB":
    driver = new ArangoDBDriver();
    break;
  case "MONGODB":
    driver = new MongoDBDriver();
    break;
    
  default:
    logger.error(
      "No database specified in configuration. Cannot initialize driver."
    );
    process.exit(1);
    break;
}

// Setup graph
import { Graph } from "./graph/GraphManager";
import { EdgeInformation, Vertex_Edge, VertexInformation } from "./graph/Graph";
const GraphManager = new Graph();
export const graph = new Vertex_Edge(ydoc);

import {
  VertexSchema,
  deleteVertexSchema,
  EdgeSchema,
  deleteEdgeSchema,
  setVertexPropertySchema,
  setEdgePropertySchema,
  removeVertexPropertySchema,
  removeEdgePropertySchema
} from "./schemas/requests";

//Setup application routes
import { query, checkSchema, validationResult, check } from "express-validator";
import {
  getGraph,
  addVertex,
  deleteVertex,
  addEdge,
  deleteEdge,
  setVertexProperty,
  setEdgeProperty,
  removeVertexProperty,
  removeEdgeProperty
} from "./routes/routes";
import { final } from "stream-chain";

{


  app.get('/ready', (req, res) => {
      if (preloadDone) res.sendStatus(200);
      else res.sendStatus(503); // 503 = Service Unavailable
  });

  app.get("/api/getGraph", async (req, res) => {
    await getGraph(req, res);
  });

  app.post(
    "/api/addVertex",
    checkSchema(VertexSchema, ["body"]),
    async (req, res) => {
      const validation = validationResult(req);
      if (!validation.isEmpty()) {
        logger.error(
          `Add Vertex Malformed request rejected: ${JSON.stringify(
            validation.array()
          )}`
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
          `Delete Vertex Malformed request rejected: ${JSON.stringify(
            validation.array()
          )}`
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
          `Add Edge Malformed request rejected: ${JSON.stringify(
            validation.array()
          )}`
        );
        res.status(500).json("Malformed request.");
      } else {
        await addEdge(req, res);
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
          `Delete Edge Malformed request rejected: ${JSON.stringify(
            validation.array()
          )}`
        );
        res.status(500).json("Malformed request.");
      } else {
        await deleteEdge(req, res);
      }
    }
  );

  app.post("/api/setVertexProperty",
    checkSchema(setVertexPropertySchema, ["body"]),
    async (req, res) => {
      const validation = validationResult(req);
      if (!validation.isEmpty()) {
        logger.error(
          `Set Vertex Property Malformed request rejected: ${JSON.stringify(
            validation.array()
          )}`
        );
        res.status(500).json("Malformed request.");
      } else {
        await setVertexProperty(req, res);
      }
    }
  );

  app.post("/api/setEdgeProperty",
    checkSchema(setEdgePropertySchema, ["body"]),
    async (req, res) => {
      const validation = validationResult(req);
      if (!validation.isEmpty()) {
        logger.error(
          `Set Edge Property Malformed request rejected: ${JSON.stringify(
            validation.array()
          )}`
        );
        res.status(500).json("Malformed request.");
      } else {
        await setEdgeProperty(req, res);
      }
    }
  );

  app.post("/api/removeVertexProperty",
    checkSchema(removeVertexPropertySchema, ["body"]),
    async (req, res) => {
      const validation = validationResult(req);
      if (!validation.isEmpty()) {
        logger.error(
          `Remove Vertex Property Malformed request rejected: ${JSON.stringify(
            validation.array()
          )}`
        );
        res.status(500).json("Malformed request.");
      } else {
        await removeVertexProperty(req, res);
      }
    }
  );

  app.post("/api/removeEdgeProperty",
    checkSchema(removeEdgePropertySchema, ["body"]),
    async (req, res) => {
      const validation = validationResult(req);
      if (!validation.isEmpty()) {
        logger.error(
          `Remove Edge Property Malformed request rejected: ${JSON.stringify(
            validation.array()
          )}`
        );
        res.status(500).json("Malformed request.");
      } else {
        await removeEdgeProperty(req, res);
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

const fs = require("fs");
const { chain } = require("stream-chain");
const { parser } = require("stream-json");
const { pick } = require("stream-json/filters/Pick");
const { streamArray } = require("stream-json/streamers/StreamArray");
const { once } = require("events");

async function onListening() {
    logger.error(process.env.IS_PRELOAD_LEADER)

  if(process.env.IS_PRELOAD_LEADER == "Yes"){
    logger.error("I am preloading leader. Handling the initialisation of PG-CRDT");
  // If the middleware crashes and restarts, it needs to reinitialise the database.
    try {
      let vertexFut: Promise<any>[] = [];
      let edgeFut = [];
      // Load vertices from the file into YJS document

      const vertexPipeline = chain([
        fs.createReadStream("/var/lib/grace/import/vertices.json"),
        parser(),
        streamArray(),
      ]);

      vertexPipeline.on("data", async ({ value }) => {
        value.id = value._id.toString();
        // logger.info(JSON.stringify(value));

        const vertex: VertexInformation = {
                id: value.id.toString(),
                labels: ["YCSBVertex"],
                properties: value,
              };
        graph.GVertices.set(value.id,vertex);
      });

      // Wait for final batch at the end of the stream
      await vertexPipeline.on("end", async () => {
        logger.info("✅ All vertices inserted");

        
        const edgePipeline = chain([
          fs.createReadStream("/var/lib/grace/import/edges.json"),
          parser(),
          streamArray(),
        ]);

        edgePipeline.on("data", async ({ value }) => {
          value.id = value._id.toString();
          //adding it the yjs list
              const edge: EdgeInformation = {
                id: value.id.toString(),
                sourcePropName: "id",
                sourcePropValue: value._outV.toString(),
                targetPropName: "id",
                targetPropValue: value._inV.toString(),
                properties: new Y.Map(Object.entries(value)),
                relationType: ["YCSBEdge"],
              };
            
              graph.GEdges.set(value.id, edge);
          
        });
        await once(edgePipeline, "end");
        preloadDone = true;
        let size = Y.encodeStateAsUpdate(ydoc).byteLength;
        logger.error(
          `✅ All edges inserted. Preload complete. Yjs document size is ${size} bytes`
        );      
      });




    } catch (e) {
      logger.error("Exception when loading data from a file " + e);
    }
  }
  else{
    logger.error("I am not the crdt preload leader. Waiting for remote updates")
  }
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  logger.debug("Listening on " + bind);
}
