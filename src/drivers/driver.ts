export abstract class DatabaseDriver {
  driver;
  abstract getGraph();
  
  abstract addVertex(labels: [string], properties: { [key: string]: any });
  abstract addEdge(
    relationLabels: [string],
    sourceLabel: [string],
    sourcePropName: string,
    sourcePropValue: any,
    targetLabel: [string],
    targetPropName: string,
    targetPropValue: any,
    properties: { [key: string]: any }
  );
  abstract deleteVertex(labels: [string], id: string);
  abstract deleteEdge(relationLabels: [string], properties: any, remote: boolean);
}
