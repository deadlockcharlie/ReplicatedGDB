Replication middleware for Cypher based graph databases. 
------

This project is a replication middleware for Cypher based graph databases. It has been designed and tested to work with Neo4j.

## Features
- Connects to a local Neo4j database and forwards queries from a HTTP client to the database. 
- Uses YJs to replicate the graph data between clients. 

### Setup
This project is a NodeJS application and exposes a REST API. To run the application, you need to have NodeJS@24, npm and Neo4j installed. Neo4j can be run in a docker container with relevant ports exposed. The port config should be set in the app.js file. 


Once Neo4j is running, you can run the application with the following command:

```
DEBUG=replicatedGDB:* PORT= <PORT NUMBER> npm start
```
This will start the application on the specified port. The default setup is local. 

To connect multiple clients, each running its own instance of the application and the database, start as many clients as you need with the command above. Ensure each client connects to its own instance of neo4j. Since clients replicate all updates to each other, two clients connecting to the same database will duplicate the data. 

### API

`/api/addVertex` - Add a vertex to the graph.
- Method: POST
- Body: 
```json
{
  "label": "vertexLabel",
  "properties": { // Property key value pairs on the vertices
    "property1": "value1",
    "property2": "value2",
    ...
  }
}
```

`/api/addEdge` - Add an edge to the graph.
- Method: POST
- Body: 
```json
{
    "SourceLabel": "Source Vertex Label",
    "SourcePropName": "Source vertec Property Name", // This property must be a unique ID
    "SourcePropValue": "Source Vertex Property Value",
    "TargetLabel": "Target Vertex Label",
    "TargetPropName": "Target Vertex Property Name", // This property must be a unique ID
    "TargetPropValue": "Target Vertex Property Value",
    "RelationType": "Relation Type",
    "properties": { // Property key value pairs on the edge
        "property1": "value1",
        "property2": "value2",
        ...
    }
}
```

`/api/getGraph` - Get the entire graph.
- METHOD: GET
- Body: 

```json
{    
    "limit": "<Maximum number of records to return>" // Optional, default is 100. 
}
```
- Response: 
```json
{
    "nodes": [
        {
            "id": 1,
            "label": "vertexLabel",
            "properties": {
                "property1": "value1",
                "property2": "value2"
            }
        },
        ...
    ],
    "edges": [
        {
            "source": 1,
            "target": 2,
            "type": "relationType",
            "properties": {
                "property1": "value1",
                ...
            }
        },
        ...
    ]
}
```


