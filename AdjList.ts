import * as Y from 'yjs';
const { executeCypherQuery } = require('./app');
import {
  addVertex,
  deleteVertex,
  addEdge,
  deleteEdge
} from './helpers/CRUD';

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

//export type VertexInformation = {
//  id: string,
//  properties : { [key: string]: any },
//  edgesConnected : Y.Map<EdgeInformation>
//}

export class AdjacencyList {
  private ydoc: Y.Doc;
  private GVertices: Y.Map<Y.Map<any>>;
  private helpers: {
    addVertex: Function;
    deleteVertex: Function;
    addEdge: Function;
    deleteEdge: Function;
  };

  //I am not sure whether we need the seperate CRUD operation if we are implemeting it all in one class.
  constructor(
    ydoc: Y.Doc,
    //helpers = {
    //  addVertex,
    //  deleteVertex,
    //  addEdge,
    //  deleteEdge
    //}
  ) {
    this.ydoc = ydoc;
    //this.helpers = helpers;
    this.GVertices = ydoc.getMap('GVertices');
  }

  public async addVertex(label: string, properties: { [key: string]: any }, remote: boolean) {
    //this.helpers.addVertex(remote, label, properties);

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
        //adding it to the adjList
        const vertex = new Y.Map<any>();
        vertex.set('id', properties.Identifier);
        const params: { [key: string]: any } = {
          properties,
          label
        }
        vertex.set('params', params);
        vertex.set('edgesConnected', new Y.Map()); // This will hold EdgeInformation

        // Store vertex in the GVertices map using its ID
        this.GVertices.set(properties.Identifier, vertex);;
      }
      return result;
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
    if (!sourceNode) throw new Error('Source node not found');

    //First getting the edgeID we are going to give it, then getting the list of edges of the source node then checking if the edgeId shows up
    const edgeId = `${sourceId}->${targetId}`;
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
          this.helpers.deleteEdge(remote, relationType, properties);
          edgeList.delete(index, 1);
        }
      }

    }
  }

  public observe(callback: () => void) {
    this.GVertices.observeDeep(callback);
  }

  public getNodeById(id: string): Y.Map<any> | undefined {
    return this.GVertices.get(id);
  }

  public getOutgoingEdges(id: string): Y.Array<Y.Map<any>> | undefined {
    return this.GVertices.get(id)?.get('edgeInformation');
  }
} 