import * as Y from 'yjs';
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

export type VertexInformation = {
  id: string,
  properties : { [key: string]: any },
  edgesConnected : Y.Map<EdgeInformation>
}

export class AdjacencyList {
  private ydoc: Y.Doc;
  private GVertices: Y.Map<Y.Map<VertexInformation>>;
  private helpers: {
    addVertex: Function;
    deleteVertex: Function;
    addEdge: Function;
    deleteEdge: Function;
  };

  constructor(
    ydoc: Y.Doc,
    helpers = {
      addVertex,
      deleteVertex,
      addEdge,
      deleteEdge
    }
  ) {
    this.ydoc = ydoc;
    this.helpers = helpers;
    this.GVertices = ydoc.getMap('GVertices');
  }

  public addNode(id: string, label: string, properties: { [key: string]: any }, remote = false) {
    this.helpers.addVertex(remote, label, properties);

    const node = new Y.Map<VertexInformation>();
    node.set('id', id);
    node.set('label', label);
    node.set('properties', properties);
    node.set('edgeInformation', new Y.Array());

    this.GVertices.set(id, node);
  }

  public removeNode(id: string, label: string, properties: Record<string, any>, remote = false) {
    this.helpers.deleteVertex(remote, label, properties);
    this.GVertices.delete(id);
  }

  public addEdge(
    sourceId: string,
    targetId: string,
    edge: Omit<EdgeInformation, 'id'>,
    remote = false
  ) {
    const sourceNode = this.GVertices.get(sourceId);
    if (!sourceNode) throw new Error('Source node not found');

    const edgeId = `${sourceId}->${targetId}`;

    this.helpers.addEdge(
      remote,
      edge.sourceLabel,
      edge.sourcePropName,
      edge.sourcePropValue,
      edge.targetLabel,
      edge.targetPropName,
      edge.targetPropValue,
      edge.relationType,
      edge.properties
    );

    const edgeList = sourceNode.get('edgeInformation') as Y.Array<Y.Map<EdgeInformation>>;

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

  public removeEdge(sourceId: string, edgeId: string, relationType: string, properties: any, remote = false) {
    const sourceNode = this.GVertices.get(sourceId);
    if (!sourceNode) return;

    const edgeList = sourceNode.get('edgeInformation') as Y.Array<Y.Map<any>>;
    const index = edgeList.toArray().findIndex((e) => e.get('id') === edgeId);

    if (index !== -1) {
      this.helpers.deleteEdge(remote, relationType, properties);
      edgeList.delete(index, 1);
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