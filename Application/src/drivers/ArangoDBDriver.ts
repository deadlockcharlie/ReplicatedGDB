import { logger } from "../helpers/logging";
import { DatabaseDriver } from "./driver";
import {Database, aql} from "arangojs";
import {graph} from "../app";
import { EdgeCollection } from "arangojs/collection";

export class ArangoDBDriver extends DatabaseDriver {
  

  driver;
  vertices;
  edges;
  constructor() {
    super();

    logger.info("Connecting to ArangoDB on :", process.env.DATABASE_URI);
    this.driver = new Database(process.env.DATABASE_URI);

    (async () => {
        const now = Date.now();
      await this.driver.query(aql`RETURN ${now}`);

      const databases = await this.driver.listDatabases();
      if(!databases.includes("grace")){
        await this.driver.createDatabase("grace");
      }

      try{
      this.vertices = this.driver.collection("vertices") as EdgeCollection;
      this.edges = this.driver.collection("edges");
      if(!await this.vertices.exists()){
        logger.info("creating vertex collection");
      await this.vertices.create();
      }
      if(!await this.edges.exists()){
        logger.info("creating edge collection");
        await this.edges.create({type:3});//Edge collection type should have fields _to and _from which should be valid vertex IDs in the vertex collection.
      }
      logger.info(
        "Connected to the Database."
      );
    } catch(err){
      logger.error("Error creating colelctions : "+ err);
    }
      logger.warn("Preload data flag is "+ process.env.PRELOAD);
      if(process.env.PRELOAD=="True"){
        logger.info("Materializing data from the db to the middleware");
    //     (async () => {
    //     const session = this.driver.session();

    //     // for await (const batch of this.streamQuery(session, "MATCH (n) RETURN n")) {
    //     //   for (const record of batch) {
    //     //     const node = record.get("n");
    //     //     // logger.info(JSON.stringify(node));
    //     //     graph.addVertex(node.labels, node.properties, false, true);
    //     //   }
    //     // }
    //     // logger.info("✅ All vertices loaded")

    //     // for await (const batch of this.streamQuery(session, "MATCH (a)-[r]->(b) RETURN id(r) as id, id(a) as source, id(b) as target, r")) {
    //     //   for (const record of batch) {
    //     //     const node = record.get("r");
    //     //     // logger.info(JSON.stringify(node));
    //     //     graph.addEdge(["Edge"], ["Vertex"],"id", node.properties.source, ["Vertex"], "id", node.properties.target, node.properties, false, true);
    //     //   }
    //     // }
    //     // logger.info("✅ All Edges loaded")

    //     await session.close();
    //   })();
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
    // const labelString = labels.join(":");
    //  // Build and execute Cypher query
    // const query = `CREATE (n:${labelString} $properties) RETURN n`;
    // const params = {properties: properties };
    try {
      await this.vertices.save({_key: properties.id, properties:properties});
    } catch (err) {
      logger.error("Error in add vertex: " + err);
      throw err;
    }
  }

  async deleteVertex(id) {
    
    try {
      await this.vertices.remove(id);
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
    try {
      await this.edges.save({
        _from: "vertices/"+sourcePropValue,
        _to: "vertices/"+targetPropValue,
        _key: properties.id,
        properties: properties
      });
    } catch (err) {
      logger.error("Error in add edge: " + err);
      throw err;
    }
  }

  async deleteEdge(id: string) {
    try {
      await this.edges.remove(id);
    } catch (err) {
      logger.error("Error in delete edge: " + err);
      throw err;
    }
  }

  async setVertexProperty(vid: string, key: string, value: string) {
    // const query = "MATCH (n {id: \""+vid+"\"}) SET n."+key+"=\""+ value+"\"  RETURN n;";
    // logger.info("Set vertex property query: "+ query);

    try {
      const vertex = await this.vertices.document(vid);
      if (!vertex) {
        throw new Error(`Vertex with id ${vid} not found.`);
      }
      const result = await this.vertices.update(vid, {properties: {...vertex.properties, [key]:value }} )

      logger.info(`Property ${key} set to ${value} for vertex with id ${vid}`);
    } catch (err) {
      logger.error("Error in set vertex property: " + err);
      throw err;
    }
  }
  async setEdgeProperty(eid: string, key: string, value: string) {
    try {
      const edge = await this.edges.document(eid);
      if (!edge) {
        throw new Error(`Edge with id ${eid} not found.`);
      }
      const result = await this.edges.update(eid, {properties: {...edge.properties, [key]:value }} )

      logger.info(`Property ${key} set to ${value} for edge with id ${eid}`);
    } catch (err) {
      logger.error("Error in set edge property: " + err);
      throw err;
    }
  }

    async removeVertexProperty(vid: string, key: string) {
      try {
        const vertex = await this.vertices.document(vid);
        if(vertex.properties && vertex.properties[key]!=undefined){
          // const updatedProperties= {...vertex.properties};
          // delete updatedProperties[key];
          // logger.info("Updated properties: "+ JSON.stringify(updatedProperties));
          vertex.properties[key] = null;
          const result = await this.vertices.update(vid, vertex, {keepNull:false});
        } else{
          throw new Error(`Property ${key} not found on vertex with id ${vid}`);
        }

        logger.info(`Property ${key} removed from vertex with id ${vid}`);
      } catch (err) {
        logger.error("Error in remove vertex property: " + err);
        throw err;
      }
    }
  
    async removeEdgeProperty(eid: string, key: string) {
      try {
        const edge = await this.edges.document(eid);
        if (edge.properties && edge.properties[key]!=undefined) {
          const updatedEdge = edge;
          // const updatedProperties= {...edge.properties};
          // updatedProperties[key] = null;
          // delete updatedProperties[key];
          updatedEdge.properties[key] = null;
           
          logger.info("Updated edge: "+ JSON.stringify(updatedEdge));
          await this.edges.update(eid, updatedEdge, {keepNull: false});
        } else {
          throw new Error(`Property ${key} not found on edge with id ${eid}`);
        }
        logger.info(`Property ${key} removed from edge with id ${eid}`);
      } catch (err) {
        logger.error("Error in remove edge property: " + err);
        throw err;
      }
    }


  // async *streamQuery(
  // session: any,
  // query: string,
  // batchSize: number = 10000){
  //   let skip = 0;
  // while (true) {
  //   const result = await this.driver.executeQuery(
  //     `${query} SKIP $skip LIMIT $limit`,
  //     { skip: neo4j.int(skip), limit: neo4j.int(batchSize) }
  //   );

  //   if (result.records.length === 0) break;

  //   yield result.records; // yield a batch of records
  //   skip += batchSize;
  // }
  // }

}
