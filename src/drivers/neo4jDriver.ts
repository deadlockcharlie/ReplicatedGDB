import { logger } from "../helpers/logging";
import { DatabaseDriver } from "./driver";
import neo4j from "neo4j-driver";

export class Neo4jDriver extends DatabaseDriver {
  driver;
  constructor() {
    super();

    logger.info("Connecting to bolt on :", process.env.DATABASE_URI);
    this.driver = neo4j.driver(
      process.env.DATABASE_URI,
      neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
    );
    (async () => {
      await this.driver.getServerInfo();
      // await this.driver.executeQuery("MATCH (n) DETACH DELETE n");
      // await this.driver.executeQuery("MATCH ()-[r]->() DELETE r");
      logger.info(
        "Connected to the Database. There may be data already present. Ensure it has been removed. "
      );
    })();
  }

  async getGraph(){
    const query = `MATCH (n) RETURN n LIMIT 50`;
    const params = null;

    try{
      const result = await this.driver.executeQuery(query);
      return result;
    } catch(err){
      logger.error(err);
      throw err;
    }
  }

  async addVertex(labels, properties) {
    logger.info("Adding vertex");
    const labelString = labels.join(":");
     // Build and execute Cypher query
    const query = `CREATE (n:${labelString} $properties) RETURN n`;
    const params = {properties: properties };
    try {
      await this.driver.executeQuery(query, params);
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  async deleteVertex(labels, id) {
    const labelString = labels.join(":");

    const query = `MATCH (n:${labelString} {id: $id}) DELETE n`;
    const params = { id };
    try {
      await this.driver.executeQuery(query, params);
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  async addEdge(
    relationLabels: [string],
    sourceLabels: [string],
    sourcePropName: string,
    sourcePropValue: any,
    targetLabels: [string],
    targetPropName: string,
    targetPropValue: any,
    properties: { [key: string]: any }
  ) {
     const sourceLabelString = sourceLabels.join(":");
     const targetLabelString = targetLabels.join(":");
     const relationLabelString = relationLabels.join(":");

    const query = `
          MATCH (a:${sourceLabelString} {${sourcePropName}: "${sourcePropValue}"}), 
                (b:${targetLabelString} {${targetPropName}: "${targetPropValue}"})
          CREATE (a)-[r:${relationLabelString}]->(b)
          SET r += $properties
          RETURN r;
            `;

    const params = {
      sourcePropName: sourcePropName,
      sourcePropValue: sourcePropValue,
      targetPropName: targetPropName,
      targetPropValue: targetPropValue,
      properties: properties,
    };

    try {
      await this.driver.executeQuery(query, params);
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  async deleteEdge(relationLabels: [string], properties: any, remote: boolean) {
    const relationLabelString = relationLabels.join(":");
    const query = `MATCH ()-[r:${relationLabelString} {id: $properties.id}]-() DELETE r`;
    const params = {
      properties: properties,
    };
    try {
      await this.driver.executeQuery(query, params);
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }
}
