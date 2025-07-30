export abstract class DatabaseDriver {
  driver;

  abstract addVertex(label: string, properties: { [key: string]: any });
  abstract addEdge(
    relationType: string,
    sourceLabel: string,
    sourcePropName: string,
    sourcePropValue: any,
    targetLabel: string,
    targetPropName: string,
    targetPropValue: any,
    properties: { [key: string]: any }
  );
  abstract deleteVertex(labe: string, identifier: string);
  abstract deleteEdge(relationType: string, properties: any, remote: boolean);
}
