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

  async addVertex(label, properties) {
    logger.info("Adding vertex");
    try {
      const traversal = this.driver.addV(label);
      logger.info(traversal);
      for (const [key, value] of Object.entries(properties)) {
        traversal.property(key, value);
      }
      logger.info(traversal);
      const result = await traversal.next();
      logger.info(result);
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  deleteVertex(_label, identifier) {
    try {
      (async () => {
        await this.driver
          .V()
          .has("identifier", identifier)
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
    relationType: string,
    sourceLabel: string,
    sourcePropName: string,
    sourcePropValue: any,
    targetLabel: string,
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
        .addE(relationType)
        .to("target");

      for (const [key, value] of Object.entries(properties)) {
        traversal.property(key, value);
      }
      (async () => {
        const result = await traversal.next();
      })();
    } catch (err) {
      logger.error(err);
      throw new err();
    }
  }

  deleteEdge(relationType: string, properties: any, remote: boolean) {
    try {
      (async () => {
        this.driver
          .E()
          .has("identifier", properties.identifier)
          .drop()
          .iterate();
      })();
    } catch (err) {
      logger.error("Error in driver" + err);
      throw new err();
    }
  }
}
