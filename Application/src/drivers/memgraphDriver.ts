import { logger } from "../helpers/logging";
import { DatabaseDriver } from "./driver";
import neo4j from "neo4j-driver";
import {graph} from "../app";

export class MemGraphDriver extends DatabaseDriver {
  

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
      logger.warn("Preload data flag is "+ process.env.PRELOAD);
      if(process.env.PRELOAD=="True"){
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
      logger.error("Error in add vertex: " + err);
      throw err;
    }
  }

  async deleteVertex(id) {
    const query = "MATCH (n {id: \""+id+"\"}) DELETE n";
    // logger.error("Delete vertex query: "+ query);
    try {
      await this.driver.executeQuery(query, null);
    } catch (err) {
      logger.error("Error in delete vertex: " + err);
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
      logger.error("Error in add edge: " + err);
      throw err;
    }
  }

  async deleteEdge(id: string) {
    const query = "MATCH ()-[r {id: \""+id+"\"}]-() DELETE r";
    logger.info("Delete edge query: "+ query);
    try {
      await this.driver.executeQuery(query, null);
    } catch (err) {
      logger.error("Error in delete edge: " + err);
      throw err;
    }
  }

  async setVertexProperty(vid: string, key: string, value: string) {
    const query = "MATCH (n {id: \""+vid+"\"}) SET n."+key+"=\""+ value+"\"  RETURN n;";
    logger.info("Set vertex property query: "+ query);

    try {
      const result = await this.driver.executeQuery(query, null);
      if (result.records.length === 0) {
        throw new Error(`Vertex with id ${vid} not found.`);
      }
      logger.info(`Property ${key} set to ${value} for vertex with id ${vid}`);
    } catch (err) {
      logger.error("Error in set vertex property: " + err);
      throw err;
    }
  }
  async setEdgeProperty(eid: string, key: string, value: string) {
    const query = "MATCH ()-[r {id: \""+eid+"\"}]->() SET r."+key+"=\""+ value+"\"  RETURN r";

    try {
      const result = await this.driver.executeQuery(query, null);
      if (result.records.length === 0) {
        throw new Error(`Edge with id ${eid} not found.`);
      }
      logger.info(`Property ${key} set to ${value} for edge with id ${eid}`);
    } catch (err) {
      logger.error("Error in set edge property: " + err);
      throw err;
    }
  }

    async removeVertexProperty(vid: string, key: string) {
      const query = "MATCH (n {id: \""+ vid+"\"}) REMOVE n."+key+" RETURN n";
      try {
        const result = await this.driver.executeQuery(query, null);
        if (result.records.length === 0) {
          throw new Error(`Vertex with id ${vid} not found.`);
        }
        logger.info(`Property ${key} removed from vertex with id ${vid}`);
      } catch (err) {
        logger.error("Error in remove vertex property: " + err);
        throw err;
      }
    }
  
    async removeEdgeProperty(eid: string, key: string) {
      const query = "MATCH ()-[r {id: \""+ eid+"\"}]->() REMOVE r."+key+" RETURN r";

      try {
        const result = await this.driver.executeQuery(query, null);
        if (result.records.length === 0) {
          throw new Error(`Edge with id ${eid} not found.`);
        }
        logger.info(`Property ${key} removed from edge with id ${eid}`);
      } catch (err) {
        logger.error("Error in remove edge property: " + err);
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
