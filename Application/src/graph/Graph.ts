//Adding unique id generator - UUID, append serverid, or smth else
//removing dangling edges
//pre condition that source and target are edges

import * as Y from "yjs";
import { driver } from "../app";
import { logger } from "../helpers/logging";
import { ProfiledPlan } from "neo4j-driver";
export type EdgeInformation = {
  id: any;
  relationType: [string];
  sourcePropName: string;
  sourcePropValue: any;
  targetPropName: string;
  targetPropValue: any;
  properties: Y.Map<Properties>;
};


export type Properties = {[key: string]: string};

export type VertexInformation = {
  id: any;
  labels: [string];
  properties: Properties;
};

// export type Listener = {
//   addVertex: (id: string) => void;
//   deleteVertex: (id: string) => void;
//   addEdge: (id: string, edge: EdgeInformation) => void;
//   deleteEdge: (id: string, edge: EdgeInformation) => void;
// };

export class Vertex_Edge {
  private ydoc: Y.Doc;
  public GVertices: Y.Map<VertexInformation>;
  public GEdges: Y.Map<EdgeInformation>;
  // private listener: Listener;

  constructor(ydoc: Y.Doc) {
    this.ydoc = ydoc;
    this.GVertices = ydoc.getMap("GVertices");
    this.GEdges = ydoc.getMap("GEdges");
    // this.listener = listener;
    this.setupObservers();
  }

  public async getGraph() {
    const result = {vertices: this.GVertices.size, edges: this.GEdges.size};
    return result;
  }

  public async checkInvariants(){

    

    //todo: implement invariants here
    //1: Every post has a creation date.
    //2. Comments on a message are restricted to forums. 
    //3. A comment can only be posted by a forum member.
    //4. A person has a unique IP Address. 
    //5. Forum members can only view posts created after their joining date. 

  }

  public async addVertex(
    labels: [string],
    properties: Properties,
    remote: boolean,
    preload = false
  ) {
    const existingVertex = this.GVertices.get(properties.id);
    // Prevent duplicate entries if not remote
    if (existingVertex && !remote) {
      throw new Error(`Vertex with id "${properties.id}" already exists`);
    }
    // Update the database
    if (!preload) {
      await driver.addVertex(labels, properties);
    }
    // Only update local structures if not a remote sync
    if (!remote) {
      const vertex: VertexInformation = {
        id: properties.id,
        labels,
        properties: properties,
      };

      this.GVertices.set(properties.id, vertex);
      // this.listener.addVertex(properties.id);
    }
  }

  public async removeVertex(
    id:string,
    remote: boolean
  ) {
    try {
      // update the database
      await driver.deleteVertex(id);

      const exists = this.GVertices.get(id);

      if (!exists && !remote) {
        throw new Error(`Vertex with id "${id}" does not exist`);
      }
      if (!remote) {
        // vertex and associated link data
        this.GVertices.delete(id);
        // this.listener.deleteVertex(id);
      }
    } catch (err) {
      throw err;
    }
  }

  public async addEdge(
    relationType: [string],
    sourcePropName: string,
    sourcePropValue: string,
    targetPropName: string,
    targetPropValue: string,
    properties: { [key: string]: any },
    remote: boolean,
    preload = false
  ) {
    const edgeId = properties.id;
    if (
      this.GVertices.get(sourcePropValue) == undefined ||
      this.GVertices.get(targetPropValue) == undefined
    ) {
      throw new Error(
        "Source and/or target vertex do not exist. Edge: " +
          sourcePropValue +
          " " +
          targetPropValue
      );
    }
    const existingEdge = this.GEdges.get(edgeId);

    //Dont allow duplicates if we are not remote
    if (existingEdge && !remote) {
      logger.info(JSON.stringify(existingEdge));
      throw new Error(`Edge with id "${edgeId}" already exists`);
    }

    if (!preload) {
      await driver.addEdge(
        relationType,
        sourcePropName,
        sourcePropValue,
        targetPropName,
        targetPropValue,
        properties
      );
    }

    //adding it the yjs list
    const edge: EdgeInformation = {
      id: edgeId,
      sourcePropName,
      sourcePropValue,
      targetPropName,
      targetPropValue,
      properties: new Y.Map(Object.entries(properties)),
      relationType,
    };

    if (!remote) {
      this.GEdges.set(edgeId, edge);
      // this.listener.addEdge(edgeId, edge);
    }
  }

  public async removeEdge(
    id: any,
    remote: boolean
  ) {

    const edge = this.GEdges.get(id);

    if (edge == undefined && !remote) {
      throw new Error("Edge with this id does not exist");
    } else {
      await driver.deleteEdge(id);
      if (!remote) {
        if (edge == undefined) {
          throw Error("Undefined Edge");
        }
        // this.listener.deleteEdge(edge.id, edge);
        this.GEdges.delete(id);
      }
    }
  }

  public async setVertexProperty(
    vid: any,
    key: string,
    value: string,
    remote: boolean
  ) {
    const vertex = this.GVertices.get(vid);
    if (vertex == undefined && !remote) {
      throw new Error("Vertex with id " + vid + " does not exist");
    } else {
      await driver.setVertexProperty(vid, key, value);
      if(!remote){
        vertex.properties[key]= value;
        this.GVertices.set(vid, vertex);
      }
    }
  }

  public async setEdgeProperty(
    eid: any,
    key: string,
    value: string,
    remote: boolean
  ) {
    const edge = this.GEdges.get(eid);
    if (edge == undefined && !remote) {
      throw new Error("Edge with id " + eid + " does not exist");
    } else {
      await driver.setEdgeProperty(eid, key, value);
      if(!remote){
        edge.properties[key]= value;
        this.GEdges.set(eid, edge);
      }
    }
  }

  public async removeVertexProperty(
    vid: any,
    key: string,
    remote: boolean
  ) {
    const vertex = this.GVertices.get(vid);
    if (vertex == undefined && !remote) {
      throw new Error("Vertex with id " + vid + " does not exist");
    } else {
      await driver.removeVertexProperty(vid, key);
      if(!remote){
        delete vertex.properties[key];
        this.GVertices.set(vid, vertex);
      }
    }
  }

  public async removeEdgeProperty(
    eid: any,
    key: string,
    remote: boolean
  ) {
    const edge = this.GEdges.get(eid);
    if (edge == undefined && !remote) {
      throw new Error("Edge with id " + eid + " does not exist");
    } else {
      await driver.removeEdgeProperty(eid, key);
      if(!remote){
        delete edge.properties[key];
        this.GEdges.set(eid, edge);
      }
    }
  }




  private setupObservers() {
    this.GVertices.observe((event, transaction) => {
      if (!transaction.local) {
        event.changes.keys.forEach((change, key) => {
          if (change.action === "add") {
            logger.info("Remote update observed " + transaction);
            const vertex = this.GVertices.get(key);
            if (vertex) {
              this.addVertex(vertex.labels, vertex.properties, true).catch(
                logger.error
              );
            }
          } else if (change.action === "delete" && !transaction) {
            const oldValue = change.oldValue as VertexInformation;
            this.removeVertex(oldValue.properties.id, true).catch(
              logger.error
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
                edge.sourcePropName,
                edge.sourcePropValue,
                edge.targetPropName,
                edge.targetPropValue,
                edge.properties,
                true
              ).catch(console.error);
            }
          } else if (change.action === "delete") {
            const oldValue = change.oldValue as EdgeInformation;
            this.removeEdge(
              oldValue.id,
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
