//Adding unique identifier generator - UUID, append serverid, or smth else
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
  label: string;
  properties: { [key: string]: any };
};

export type Listener = {
  addVertex: (id: string) => void;
  deleteVertex: (id: string) => void;
  addEdge: (id: string, edge: EdgeInformation) => void;
  deleteEdge: (id: string, edge: EdgeInformation) => void;
};

export class Vertex_Edge {
  private ydoc: Y.Doc;
  private GVertices: Y.Map<VertexInformation>;
  private GEdges: Y.Map<EdgeInformation>;
  private listener: Listener;

  constructor(ydoc: Y.Doc, listener: Listener) {
    this.ydoc = ydoc;
    this.GVertices = ydoc.getMap("GVertices");
    this.GEdges = ydoc.getMap("GEdges");
    this.listener = listener;
    this.setupObservers();
  }

  public async addVertex(
    label: string,
    properties: { [key: string]: any },
    remote: boolean
  ) {
    const existingVertex = this.GVertices.get(properties.identifier);
    // Prevent duplicate entries if not remote
    if (existingVertex && !remote) {
      throw new Error(
        `Vertex with identifier "${properties.identifier}" already exists`
      );
    }
    // Update the database
    await driver.addVertex(label, properties);
    // Only update local structures if not a remote sync
    if (!remote) {
      const vertex: VertexInformation = {
        id: properties.identifier,
        label,
        properties,
      };

      this.GVertices.set(properties.identifier, vertex);
      this.listener.addVertex(properties.identifier);
    }
  }

  public async removeVertex(
    label: string,
    properties: Record<string, any>,
    remote: boolean
  ) {
    const identifier = properties.identifier;
    // update the database
    await driver.deleteVertex(label, identifier);

    const exists = this.GVertices.get(identifier);

    if (!exists && !remote) {
      throw new Error(`Vertex with identifier "${identifier}" does not exist`);
    }
    if (!remote) {
      // vertex and associated link data
      this.GVertices.delete(identifier);
      this.listener.deleteVertex(identifier);
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
    const edgeId = properties.identifier;

    if (this.GVertices.get(sourcePropValue) == undefined || this.GVertices.get(targetPropValue) == undefined) {
      throw new Error("Source and/or target vertex do not exist");
    }
    const existingEdge = this.GEdges.get(edgeId);
    //Dont allow duplicates if we are not remote
    if (existingEdge && !remote) {
      throw new Error(`Edge with identifier "${edgeId}" already exists`);
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
    // Ensure the a unique identifier is provided

    if (!properties.identifier || !relationType) {
      throw new Error(
        "Identifier and relation type is required to delete an edge"
      );
    }
    const edge = this.GEdges.get(properties.identifier);

    if (edge == undefined && !remote) {
      throw new Error("Edge with this identifier does not exist");
    } else {
      await driver.deleteEdge(relationType, properties, remote);
      if (!remote) {
        if (edge == undefined) {
          throw Error("Undefined Edge");
        }
        this.listener.deleteEdge(edge.sourceLabel, edge);
        this.GEdges.delete(properties.identifier);
      }
    }
  }

  private setupObservers() {
    this.GVertices.observe((event, transaction) => {
      if (!transaction.local) {
        event.changes.keys.forEach((change, key) => {
          if (change.action === "add") {
            const vertex = this.GVertices.get(key);
            if (vertex) {
              this.addVertex(vertex.label, vertex.properties, true).catch(
                console.error
              );
            }
          } else if (change.action === "delete") {
            const oldValue = change.oldValue as VertexInformation;
            this.removeVertex(oldValue.label, oldValue.properties, true).catch(
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
