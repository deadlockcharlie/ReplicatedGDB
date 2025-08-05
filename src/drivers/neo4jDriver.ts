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
      await this.driver.executeQuery("MATCH (n) DETACH DELETE n");
      await this.driver.executeQuery("MATCH ()-[r]->() DELETE r");
      logger.info(
        "Database reinitialized. Any existing data has been deleted from the local database. Commencing sync with remote database..."
      );
    })();
  }

  addVertex(label, properties) {
    logger.info("Adding vertex");
    // Build and execute Cypher query
    const query = `CREATE (n:${label} $properties) RETURN n`;
    const params = { label: label, properties: properties };
    try {
      this.driver.executeQuery(query, params);
    } catch (err) {
      logger.error(err);
      throw new (err);
    }
  }

  deleteVertex(label, identifier) {
    const query = `MATCH (n:${label} {identifier: $identifier}) DETACH DELETE n`;
    const params = { identifier };
     try {
      this.driver.executeQuery(query, params);
    } catch (err) {
      logger.error(err);
      throw new (err);
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
    const query = `
          MATCH (a:${sourceLabel} {${sourcePropName}: "${sourcePropValue}"}), 
                (b:${targetLabel} {${targetPropName}: "${targetPropValue}"})
          CREATE (a)-[r:${relationType}]->(b)
          SET r += $properties
          RETURN r;
            `;

    const params = {
      sourceLabel: sourceLabel,
      sourcePropName: sourcePropName,
      sourcePropValue: sourcePropValue,
      targetLabel: targetLabel,
      targetPropName: targetPropName,
      targetPropValue: targetPropValue,
      properties: properties,
      relationType: relationType,
    };

     try {
      this.driver.executeQuery(query, params);
    } catch (err) {
      logger.error(err);
      throw new (err);
    }
  }

  deleteEdge(relationType: string, properties: any, remote: boolean) {
    const query = `MATCH ()-[r:${relationType} {identifier: $properties.identifier}]-() DELETE r`;
    const params = {
      relationType: relationType,
      properties: properties,
    };
     try {
      this.driver.executeQuery(query, params);
    } catch (err) {
      logger.error(err);
      throw new (err);
    }
  }
}
