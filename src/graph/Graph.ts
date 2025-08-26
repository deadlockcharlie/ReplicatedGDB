//Adding unique id generator - UUID, append serverid, or smth else
//removing dangling edges
//pre condition that source and target are edges

import * as Y from "yjs";
import {driver} from "../app";
import {logger} from "../helpers/logging";
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
  id: string;
  labels: [string];
  properties: { [key: string]: Y.Map<VertexInformation> };
};

export type Listener = {
  addVertex: (id: string) => void;
  deleteVertex: (id: string) => void;
  addEdge: (id: string, edge: EdgeInformation) => void;
  deleteEdge: (id: string, edge: EdgeInformation) => void;
};

export class Vertex_Edge {
  private ydoc: Y.Doc;
  public GVertices: Y.Map<VertexInformation>;
  public GEdges: Y.Map<EdgeInformation>;
  private listener: Listener;

  constructor(ydoc: Y.Doc, listener: Listener) {
    this.ydoc = ydoc;
    this.GVertices = ydoc.getMap("GVertices");
    this.GEdges = ydoc.getMap("GEdges");
    this.listener = listener;
    this.setupObservers();
  }


  public async getGraph()
  {
    const result = await driver.getGraph();
    return result;
  }

  
  public async addVertex(
    labels: [string],
    properties: { [key: string]: any },
    remote: boolean
  ) {
    const existingVertex = this.GVertices.get(properties.id);
    // Prevent duplicate entries if not remote
    if (existingVertex && !remote) {
      throw new Error(
        `Vertex with id "${properties.id}" already exists`
      );
    }
    // Update the database
    await driver.addVertex(labels, properties);
    // Only update local structures if not a remote sync
    if (!remote) {
      const vertex: VertexInformation = {
        id: properties.id,
        labels,
        properties,
      };

      this.GVertices.set(properties.id, vertex);
      this.listener.addVertex(properties.id);
    }
  }

  public async removeVertex(
    labels: [string],
    properties: Record<string, any>,
    remote: boolean
  ) {
    try{
    const id = properties.id;
    // update the database
    await driver.deleteVertex(labels, id);

    const exists = this.GVertices.get(id);

    if (!exists && !remote) {
      throw new Error(`Vertex with id "${id}" does not exist`);
    }
    if (!remote) {
      // vertex and associated link data
      this.GVertices.delete(id);
      this.listener.deleteVertex(id);
    }
  } catch(err){
    throw err;
  }
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
    const edgeId = properties.id;

    if (this.GVertices.get(sourcePropValue) == undefined || this.GVertices.get(targetPropValue) == undefined) {
      throw new Error("Source and/or target vertex do not exist");
    }
    const existingEdge = this.GEdges.get(edgeId);
    //Dont allow duplicates if we are not remote
    if (existingEdge && !remote) {
      throw new Error(`Edge with id "${edgeId}" already exists`);
    }
    

    await driver.addEdge(
      relationType,
      sourceLabel,
      sourcePropName,
      sourcePropValue,
      targetLabel,
      targetPropName,
      targetPropValue,
      properties
    );
  

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
      this.listener.addEdge(sourceLabel, edge);
    }
  }

  public async removeEdge(
    relationType: string,
    properties: any,
    remote: boolean
  ) {
    // Ensure the a unique id is provided

    if (!properties.id || !relationType) {
      throw new Error(
        "id and relation type is required to delete an edge"
      );
    }
    const edge = this.GEdges.get(properties.id);

    if (edge == undefined && !remote) {
      throw new Error("Edge with this id does not exist");
    } else {
      await driver.deleteEdge(relationType, properties, remote);
      if (!remote) {
        if (edge == undefined) {
          throw Error("Undefined Edge");
        }
        this.listener.deleteEdge(edge.sourceLabel, edge);
        this.GEdges.delete(properties.id);
      }
    }
  }

  private setupObservers() {
    this.GVertices.observe((event, transaction) => {
      if (!transaction.local) {
        event.changes.keys.forEach((change, key) => {
          if (change.action === "add") {
            logger.info("Remote update observed "+ change);
            const vertex = this.GVertices.get(key);
            if (vertex) {
              this.addVertex(vertex.labels, vertex.properties, true).catch(
                console.error
              );
            }
          } else if (change.action === "delete") {
            const oldValue = change.oldValue as VertexInformation;
            this.removeVertex(oldValue.labels, oldValue.properties, true).catch(
              console.error
            );
          }
        });
      }
    });

    this.GEdges.observe((event, transaction) => {
      if (!transaction.local) {
        event.changes.keys.forEach((change, key) => {
          if (change.action === "add") {
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
          } else if (change.action === "delete") {
            const oldValue = change.oldValue as EdgeInformation;
            this.removeEdge(
              oldValue.relationType,
              oldValue.properties,
              true
            ).catch(console.error);
          }
        });
      }
    });
  }

  public getVertex(id: string): VertexInformation | undefined {
    return this.GVertices.get(id);
  }
}
