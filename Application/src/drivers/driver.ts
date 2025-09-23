export abstract class DatabaseDriver {
  driver;
  abstract getGraph();
  
  abstract addVertex(labels: [string], properties: { [key: string]: any });
  abstract addEdge(
    relationLabels: [string],
    sourcePropName: string,
    sourcePropValue: any,
    targetPropName: string,
    targetPropValue: any,
    properties: { [key: string]: any }
  );
  abstract deleteVertex(id: string);
  abstract deleteEdge(properties: any, remote: boolean);

  abstract setVertexProperty(vid: string, key: string, value: string)
  abstract setEdgeProperty(eid: string, key: string, value: string)

  abstract removeVertexProperty(vid: string, key: string)
  abstract removeEdgeProperty(eid: string, key: string)

}
