//Adding unique identifier generator - UUID, append serverid, or smth else
//removing dangling edges
//pre condition that source and target are edges

import * as Y from 'yjs';
import { v4 as uuidv4 } from 'uuid';
import { BackupProgressInfo } from 'node:sqlite';
import {logger} from "./Logging";

export type EdgeInformation = {
  id: string,
  relationType: string,
  sourceLabel: string,
  sourcePropName: string,
  sourcePropValue: any,
  targetLabel: string,
  targetPropName: string,
  targetPropValue: any,
  properties: { [key: string]: any }
};

export type VertexInformation = {
  id: string,
  label: string,
  properties: { [key: string]: any }
}

export type Link = {
  id_vertex: string,
  edge_List: Y.Array<EdgeInformation>;
}

export class Graph {
  private ydoc: Y.Doc;
  private GVertices: Y.Map<VertexInformation>;
  private GEdges: Y.Map<EdgeInformation>;
  private Graph: Y.Map<Link>;
  private executeCypherQuery: (query: string, params?: any) => Promise<any>;

  constructor(ydoc: Y.Doc, executeCypherQuery: (query: string, params?: any) => Promise<any>) {
    this.ydoc = ydoc;
    this.GVertices = ydoc.getMap('GVertices');
    this.GEdges = ydoc.getMap('GEdges');
    this.Graph = ydoc.getMap('Graph');
    this.executeCypherQuery = executeCypherQuery;
    this.setupObservers();
  }

  public async addVertex(
    label: string,
    properties: { [key: string]: any },
    remote: boolean
  ) {
    // logger.info(`Adding vertex with label ${label}, remote is : ${remote}`);

    // Ensure identifier exists or generate one if not remote
    //if (!properties.identifier) {
    //  if (!remote) {
    //    properties.identifier = `${label}_${uuidv4()}`; // default fallback
    //  } else {
    //    throw new Error("Identifier is required for remote vertex");
    //  }
    //}
    // if (properties.identifier == undefined) {
    //   throw new Error("Identifier is required");
    // } 
    // This check has been performed in the schema validation step in routers. 
    
    const existingVertex = this.GVertices.get(properties.identifier);

    // Prevent duplicate entries if not remote
    if (existingVertex && !remote) {
      throw new Error(
        `Vertex with identifier "${properties.identifier}" already exists`
      );
    }

    // Build and execute Cypher query
    const query = `CREATE (n:${label} $properties) RETURN n`;
    const params = { label: label, properties: properties, };
    const result = await this.executeCypherQuery(query, params);

    if (result.records.length === 0) {
      throw new Error("Failed to create vertex");
    }

    // Only update local structures if not a remote sync
    if (!remote) {
      // console.log('CALLED!')
      const vertex: VertexInformation = {
        id: properties.identifier,
        label,
        properties,
      };

      const newLink: Link = {
        id_vertex: properties.identifier,
        edge_List: new Y.Array<EdgeInformation>(),
      };

      this.GVertices.set(properties.identifier, vertex);
      this.Graph.set(properties.identifier, newLink);
      //Array.from(this.GVertices.entries()).forEach(([key, value]) => {
      //  console.log(key, value);
      //});
    }

    return result;
  }

  public async removeVertex(
    label: string,
    properties: Record<string, any>,
    remote: boolean
  ) {
    console.log(properties);
    const identifier = properties.identifier;

    // if (!identifier) {
    //   throw new Error("Identifier is required");
    // }

    const exists = this.GVertices.get(identifier);

    if (!exists && !remote) {
      throw new Error(`Vertex with identifier "${identifier}" does not exist`);
    }

    const query = `MATCH (n:${label} {identifier: $identifier}) DETACH DELETE n`;
    const params = { identifier };

    const result = await this.executeCypherQuery(query, params);

    if (!remote) {

      // vertex and associated link data
      this.GVertices.delete(identifier);
      this.Graph.delete(identifier);
    }
    return result
  }

  public async addEdge(
    relationType: string,
    sourceLabel: string,
    sourcePropName: string,
    sourcePropValue: any,
    targetLabel: string,
    targetPropName: string,
    targetPropValue: any,
    properties: { [key: string]: any },
    remote: boolean
  ) {

    // console.log(properties, sourcePropValue);
    if (this.GVertices.get(sourcePropValue) == undefined) {
      throw new Error("Source vertex undefined");
    }


    // //check for id
    // if (!properties.identifier) {
    //   throw new Error("Identifier is required for the edge");
    // }

    const edgeId = properties.identifier;

    const existingEdge = this.GEdges.get(edgeId);
    //Dont allow duplicates if we are not remote
    if (existingEdge && !remote) {
      throw new Error(`Edge with identifier "${edgeId}" already exists`);
    }

    //Cypher Query
    // const query = `MATCH (a:${sourceLabel} {${sourcePropName}: "${sourcePropValue}"}),  (b:${targetLabel} {${targetPropName}: "${targetPropValue}"})     CREATE (a)-[r:${relationType} $properties]->(b)   RETURN r;`;
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
      relationType: relationType
    };

    const result = await this.executeCypherQuery(query, params);
    logger.error(JSON.stringify(result));
    if (result.records.length === 0) {
      throw new Error("Failed to create edge");
    }

    //adding it the yjs list
    const edge: EdgeInformation = {
      id: edgeId,
      sourceLabel,
      sourcePropName,
      sourcePropValue,
      targetLabel,
      targetPropName,
      targetPropValue,
      properties,
      relationType,
    };

    if (!remote) {
      this.GEdges.set(edgeId, edge);
      this.Graph.get(sourcePropValue)?.edge_List.push([edge]);
    }

    return result;
  }

  public async removeEdge(relationType: string, properties: any, remote: boolean) {
    // Ensure the a unique identifier is provided
    if (!properties.identifier || !relationType) {
      throw new Error("Identifier and relation type is required to delete an edge");
    }
    else if (this.GEdges.get(properties.identifier) == undefined && !remote) {
      throw new Error("Edge with this identifier does not exist");
    } else {
      const query = `MATCH ()-[r:${relationType} {identifier: $properties.identifier}]-() DELETE r`;
      const params = {
        relationType: relationType,
        properties: properties,
      };
      const result = await this.executeCypherQuery(query, params);
      if (!remote) {
        // console.log("Removing the edge from the local data")
        const edge = this.GEdges.get(properties.identifier);
        const edgeList = this.Graph.get(edge?.sourcePropValue)?.edge_List;
        const index = edgeList?.toArray().findIndex(e => e.id === properties.identifier);
        if (index !== undefined && index >= 0) {
          edgeList?.delete(index);
        }
        this.GEdges.delete(properties.identifier);

        // console.log(JSON.stringify(GEdges, null, 2));
      }
      return result;
    }
  }

  private setupObservers() {
    this.GVertices.observe((event, transaction) => {
      if (!transaction.local) {
        event.changes.keys.forEach((change, key) => {
          if (change.action === 'add') {
            const vertex = this.GVertices.get(key);
            if (vertex) {
              this.addVertex(vertex.label, vertex.properties, true).catch(console.error);
            }
          } else if (change.action === 'delete') {
            const oldValue = change.oldValue as VertexInformation;
            this.removeVertex(oldValue.label, oldValue.properties, true).catch(console.error);
          }
        });
      }
    });

    this.GEdges.observe((event, transaction) => {
      if (!transaction.local) {
        event.changes.keys.forEach((change, key) => {
          if (change.action === 'add') {
            const edge = this.GEdges.get(key);
            if (edge) {
              this.addEdge(
                edge.relationType,
                edge.sourceLabel,
                edge.sourcePropName,
                edge.sourcePropValue,
                edge.targetLabel,
                edge.targetPropName,
                edge.targetPropValue,
                edge.properties,
                true
              ).catch(console.error);
            }
          } else if (change.action === 'delete') {
            const oldValue = change.oldValue as EdgeInformation;
            this.removeEdge(oldValue.relationType, oldValue.properties, true).catch(console.error);
          }
        });
      }
    });
  }


  public getVertex(id: string): VertexInformation | undefined {
    return this.GVertices.get(id);
  }

  public getArrayEdges(id: string): Y.Array<EdgeInformation> | undefined {
    return this.Graph.get(id)?.edge_List;
  }
} 