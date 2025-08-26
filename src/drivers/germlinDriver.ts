import { DatabaseDriver } from "./driver";
import gremlin from "gremlin";
import { Graph } from "gremlin/lib/structure/graph";
import { logger } from "../helpers/logging";
import { WebSocket } from "ws";

export class GremlinDriver extends DatabaseDriver {
  driver;
  constructor() {
    super();
    console.log(
      "Initializing Gremlin server connection on: " + process.env.DATABASE_URI
    );
    try {
      const ws = new WebSocket(process.env.DATABASE_URI + "/gremlin", {
        rejectUnauthorized: false,
      });

      const dc = new gremlin.driver.DriverRemoteConnection(
        process.env.DATABASE_URI + "/gremlin",
        { webSocket: ws }
      );
      const graph = new Graph();

      this.driver = graph.traversal().withRemote(dc);
      console.log("Gremlin server connection initialized");
    } catch (err) {
      logger.error(err);
      process.exit(1);
    }
  }

  async getGraph() {
      try{
        const result = await this.driver.V().sample(50).toList();
        return result;
      } catch(err){
        logger.error("getGraph: "+err);
      }
  }
  async addVertex(labels, properties) {
    logger.info("Adding vertex");
    try {
      const traversal = this.driver.addV('Node');
      traversal.property('Labels', labels);
      logger.info(traversal);
      for (const [key, value] of Object.entries(properties)) {
        traversal.property(key, value);
      }
      logger.info(traversal);
      const result = await traversal.next();
      logger.info(result);
    } catch (err) {
      logger.error("addVertex: "+err);
      throw err;
    }
  }

  deleteVertex(_label, id) {
    try {
      (async () => {
        await this.driver
          .V()
          .has("id", id)
          .as("v")
          .bothE()
          .drop()
          .select("v")
          .drop()
          .iterate();
      })();
    } catch (err) {
      logger.error(err);
      throw new err();
    }
  }

  addEdge(
    relationLabels: [string],
    sourceLabels: [string],
    sourcePropName: string,
    sourcePropValue: any,
    targetLabels: [string],
    targetPropName: string,
    targetPropValue: any,
    properties: { [key: string]: any }
  ) {
    try {
      const traversal = this.driver
        .V()
        .has(targetPropName, targetPropValue)
        .as("target")
        .V()
        .has(sourcePropName, sourcePropValue)
        .addE()
        .property('Label', relationLabels)
        .to("target");

      for (const [key, value] of Object.entries(properties)) {
        traversal.property(key, value);
      }
      (async () => {
        const result = await traversal.next();
      })();
    } catch (err) {
      logger.error("addEdge: "+err);
      throw new err;
    }
  }

  deleteEdge(relationLabels: [string], properties: any, remote: boolean) {
    try {
      (async () => {
        this.driver
          .E()
          .has("id", properties.id)
          .drop()
          .iterate();
      })();
    } catch (err) {
      logger.error("deleteEdge: " + err);
      throw new err();
    }
  }
}
