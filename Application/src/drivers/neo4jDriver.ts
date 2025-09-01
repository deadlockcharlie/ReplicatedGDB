import { logger } from "../helpers/logging";
import { DatabaseDriver } from "./driver";
import neo4j from "neo4j-driver";
import {graph} from "../app";

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
      
      logger.info(
        "Connected to the Database."
      );
      if(process.env.PRELOAD){
        logger.info("Materializing data from the db to the middleware");
        (async () => {
        const session = this.driver.session();

        for await (const batch of this.streamQuery(session, "MATCH (n) RETURN n")) {
          for (const record of batch) {
            const node = record.get("n");
            // logger.info(JSON.stringify(node));
            graph.addVertex(node.labels, node.properties, false, true);
          }
        }
        logger.info("✅ All vertices loaded")

        for await (const batch of this.streamQuery(session, "MATCH (a)-[r]->(b) RETURN id(r) as id, id(a) as source, id(b) as target, r")) {
          for (const record of batch) {
            const node = record.get("r");
            // logger.info(JSON.stringify(node));
            graph.addEdge(["Edge"], ["Vertex"],"id", node.properties.source, ["Vertex"], "id", node.properties.target, node.properties, false, true);
          }
        }
        logger.info("✅ All Edges loaded")

        await session.close();
      })();
      }
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

  async deleteVertex(id) {
    const query = `MATCH (n {id: $id}) DELETE n`;
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

  async deleteEdge(id: string) {
    const query = `MATCH ()-[r {id: $id}]-() DELETE r`;
    const params = {
      id: id,
    };
    try {
      await this.driver.executeQuery(query, params);
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  async setVertexProperty(vid: string, key: string, value: string) {
    const query = `MATCH (n {id: $vid}) CALL apoc.create.setProperty(n, $key, $value) YIELD node RETURN n`;
    const params = { vid, key, value };

    try {
      const result = await this.driver.executeQuery(query, params);
      if (result.records.length === 0) {
        throw new Error(`Vertex with id ${vid} not found.`);
      }
      logger.info(`Property ${key} set to ${value} for vertex with id ${vid}`);
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }
  async setEdgeProperty(eid: string, key: string, value: string) {
    const query = `MATCH ()-[r {id: $eid}]->() CALL apoc.create.setRelProperty(r, $key, $value) YIELD rel RETURN r`;
    const params = { eid, key, value };

    try {
      const result = await this.driver.executeQuery(query, params);
      if (result.records.length === 0) {
        throw new Error(`Edge with id ${eid} not found.`);
      }
      logger.info(`Property ${key} set to ${value} for edge with id ${eid}`);
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

    async removeVertexProperty(vid: string, key: string) {
      const query = `MATCH (n {id: $vid}) CALL apoc.create.removeProperties(n, [$key]) YIELD node RETURN n`;
      const params = { vid, key };

      try {
        const result = await this.driver.executeQuery(query, params);
        if (result.records.length === 0) {
          throw new Error(`Vertex with id ${vid} not found.`);
        }
        logger.info(`Property ${key} removed from vertex with id ${vid}`);
      } catch (err) {
        logger.error(err);
        throw err;
      }
    }
  
    async removeEdgeProperty(eid: string, key: string) {
      const query = `MATCH ()-[r {id: $eid}]->() CALL apoc.create.removeRelProperties(r, [$key]) YIELD rel RETURN r`;
      const params = { eid, key };

      try {
        const result = await this.driver.executeQuery(query, params);
        if (result.records.length === 0) {
          throw new Error(`Edge with id ${eid} not found.`);
        }
        logger.info(`Property ${key} removed from edge with id ${eid}`);
      } catch (err) {
        logger.error(err);
        throw err;
      }
    }


  async *streamQuery(
  session: any,
  query: string,
  batchSize: number = 10000){
    let skip = 0;
  while (true) {
    const result = await this.driver.executeQuery(
      `${query} SKIP $skip LIMIT $limit`,
      { skip: neo4j.int(skip), limit: neo4j.int(batchSize) }
    );

    if (result.records.length === 0) break;

    yield result.records; // yield a batch of records
    skip += batchSize;
  }
  }

}
