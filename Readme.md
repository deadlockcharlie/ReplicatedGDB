### What is this mess about?

This is a project setup to design a replicated grah database that uses CRDTs.

We depend on the graph traversal computer provided by gremlin. Ergo, any gdb which is gremlin capable will be able to use this library
The replication logic is written outside the database itself and redirected through the JS bindings of gremlin.

To set the project up with Janusgraph, follow these commands.
1. Fetch the latest `full` janusgraph release. This project is built using version 1.1.0 but if janusgraph keeps implementing gremlin, future versions will be backwards compatible. 
    ```
   https://github.com/JanusGraph/janusgraph/releases
   ```
2. Start the janusgraph sever with a console and in-memory configuration (This can be replaced with another DB).
    ```
    ./bin/janusgraph-server.sh console ./conf/gremlin-server/gremlin-server.yaml
   ```
   This gremlin configuration can be swapped out to switch storage backends for janusgraph. 
3. Once janusgraph starts, the NodeJS server in the `gremlinYJS` directory can be started. 
    This server sets up a socket connection with the janusgraph server over port 8182. Then the graph traversal object is initialised which is used to execute traversals. 
These are then forwarded to the underlying graph computer.
Operations which modify data involve additional hooks which are called when updates occur. These are replicated using YJs. 


