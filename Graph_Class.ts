//Adding unique identifier generator - UUID, append serverid, or smth else

import * as Y from 'yjs';
const { executeCypherQuery } = require('./app');
import { v4 as uuidv4 } from 'uuid';
import { BackupProgressInfo } from 'node:sqlite';

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
        var vertex: VertexInformation = {
          'id': properties.identifier,
          'label': label,
          'properties': properties
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
    //edge: Omit<EdgeInformation, 'id'>,
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
    console.log(properties);

    if (properties.identifier == undefined) {
      throw new Error("Identifier is required");
    }
    const edgeId = properties.identifier;

    if (this.GEdges.get(properties.identifier) == undefined || remote === true) {
      const query = `MATCH (a:${sourceLabel} {${sourcePropName}: "${sourcePropValue}"}), (b:${targetLabel} {${targetPropName}: "${targetPropValue}"}) CREATE (a)-[r:${relationType} $properties]->(b) RETURN r`;
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
      const result = await executeCypherQuery(query, params);


      if (result.records.length === 0) {
        throw new Error(JSON.stringify(result));
      }
      if (!remote) {

        var edge: EdgeInformation = {
          'id' : properties.identifier,
          'sourceLabel': sourceLabel,
          'sourcePropName': sourcePropName,
          'sourcePropValue': sourcePropValue,
          'targetLabel': targetLabel,
          'targetPropName': targetPropName,
          'targetPropValue': targetPropValue,
          'properties': properties,
          'relationType': relationType
        }

        this.GEdges.set(properties.identifier, edge)

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