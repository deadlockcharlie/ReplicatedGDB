//Adding unique identifier generator - UUID, append serverid, or smth else

import * as Y from 'yjs';
const { executeCypherQuery } = require('./app');
import { v4 as uuidv4 } from 'uuid';

export type EdgeInformation = {
  id: string;
  relationType: string;
  sourceLabel: string;
  sourcePropName: string;
  sourcePropValue: any;
  targetLabel: string;
  targetPropName: string;
  targetPropValue: any;
  properties: { [key: string]: any };
};

export type VertexInformation = {
  id: string,
  properties : { [key: string]: any },
}

export type Links = {
  id_vertex: string,
  edge_List: Y.Array<EdgeInformation>;
}

export class Graph {
  private ydoc: Y.Doc;
  private GVertices: Y.Map<VertexInformation>;
  private GEdges: Y.Map<EdgeInformation>;
  private Graph: Y.Map<Links>;

  constructor(ydoc: Y.Doc) {
    this.ydoc = ydoc;
    this.GVertices = ydoc.getMap('GVertices');
    this.GEdges = ydoc.getMap('GEdges');
    this.Graph = ydoc.getMap('Graph');
  }

  public async addVertex(label: string, properties: { [key: string]: any }, remote: boolean) {

    console.log("Adding vertex with label:", label);

    if (properties.identifier == undefined) {
      throw new Error("Identifier is required");
    }
    // Check if a vertex with the same identifier already exists. If not, add it to the GVertices map and create it in the database. 
    else if (this.GVertices.get(properties.identifier) == undefined || remote == true) {

      const query = `CREATE (n:${label} $properties) RETURN n`;
      const params = {
        label: label,
        properties: properties,
      };
      const result = await executeCypherQuery(query, params);

      if (result.records.length === 0) {
        throw new Error("Failed to create vertex");
      }

      if (!remote) {
        //adding it to Vertices list
        var vertex : VertexInformation = {
          'id' : label,
          'properties' : properties
        };
        this.GVertices.set(label, vertex);
      }
    } else {
      // If the vertex already exists, return an error
      throw new Error("Vertex with this identifier already exists");
    }
  }

  public async removeVertex(label: string, properties: Record<string, any>, remote: boolean) {
    // Ensure the a unique identifier is provided
    if (!properties.identifier) {
      throw new Error("Identifier is required");
    }
    else if (this.GVertices.get(properties.identifier) == undefined && !remote) {
      throw new Error("Vertex with this identifier does not exist");
    } else {
      const query = `MATCH (n:${label} {identifier: $properties.identifier}) DETACH DELETE n`;
      const params = {
        label: label,
        properties: properties,
      };
      const result = await executeCypherQuery(query, params);

      if (!remote) {
        this.GVertices.delete(properties.identifier);
      }
      return result;
    }
  }

  public async addEdge(
    sourceId: string,
    targetId: string,
    edge: Omit<EdgeInformation, 'id'>,
    remote: boolean,
    properties: Record<string, any>
  ) {
    console.log(properties);

    if (properties.identifier == undefined) {
      throw new Error("Identifier is required");
    }

    const sourceNode = this.GVertices.get(sourceId);
    if (!sourceNode) throw new Error('Source node not found'); // also add for the targetNode

    //First getting the edgeID we are going to give it, then getting the list of edges of the source node then checking if the edgeId shows up
    const edgeId = properties.identifier; //needs to be changed for the uniqueness of the edges in multiple edges between vertices
    const edgeList = sourceNode.get('edgeInformation') as Y.Array<Y.Map<any>>;
    const edgeExists = edgeList.toArray().some((edgeMap) => edgeMap.get('id') === edgeId);

    if (!edgeExists || remote === true) {
      const query = `MATCH (a:${edge.sourceLabel} {${edge.sourcePropName}: "${edge.sourcePropValue}"}), (b:${edge.targetLabel} {${edge.targetPropName}: "${edge.targetPropValue}"}) CREATE (a)-[r:${edge.relationType} $properties]->(b) RETURN r`;
      const params = {
        sourceLabel: edge.sourceLabel,
        sourcePropName: edge.sourcePropName,
        sourcePropValue: edge.sourcePropValue,
        targetLabel: edge.targetLabel,
        targetPropName: edge.targetPropName,
        targetPropValue: edge.targetPropValue,
        properties: edge.properties,
        relationType: edge.relationType
      };
      const result = await executeCypherQuery(query, params);

      if (result.records.length === 0) {
        throw new Error(JSON.stringify(result));
      }
      if (!remote) {
        const edgeMap = new Y.Map<any>();
        edgeMap.set('id', edgeId);
        edgeMap.set('relationType', edge.relationType);
        edgeMap.set('sourceLabel', edge.sourceLabel);
        edgeMap.set('sourcePropName', edge.sourcePropName);
        edgeMap.set('sourcePropValue', edge.sourcePropValue);
        edgeMap.set('targetLabel', edge.targetLabel);
        edgeMap.set('targetPropName', edge.targetPropName);
        edgeMap.set('targetPropValue', edge.targetPropValue);
        edgeMap.set('properties', edge.properties);

        edgeList.push([edgeMap]);

      }
    }
  }


  public async removeEdge(sourceId: string, edgeId: string, relationType: string, properties: any, remote: boolean) {
    if (!properties.identifier || !relationType) {
      throw new Error("Identifier and relation type is required to delete an edge");
    }
    const sourceNode = this.GVertices.get(sourceId);
    if (!sourceNode) return;
    const edgeList = sourceNode.get('edgeInformation') as Y.Array<Y.Map<any>>;
    const edgeExists = edgeList.toArray().some((edgeMap) => edgeMap.get('id') === edgeId);

    if (!edgeExists && !remote) {
      throw new Error("Edge with this identifier does not exist");
    } else {
      const query = `MATCH ()-[r:${relationType} {identifier: $properties.identifier}]-() DELETE r`;
      const params = {
        relationType: relationType,
        properties: properties,
      };
      const result = await executeCypherQuery(query, params);

      if (!remote) {
        const edgeList = sourceNode.get('edgeInformation') as Y.Array<Y.Map<any>>;
        const index = edgeList.toArray().findIndex((e) => e.get('id') === edgeId);

        if (index !== -1) {
          edgeList.delete(index, 1);
        }
      }

    }
  }

  public observe(callback: () => void) {
    this.GVertices.observeDeep(callback);
  }

  public getVertex(id: string): Y.Map<any> | undefined {
    return this.GVertices.get(id);
  }

  public getOutgoingEdges(id: string): Y.Array<Y.Map<any>> | undefined {
    return this.GVertices.get(id)?.get('edgeInformation');
  }
} 