### What is this mess about?

This is a project setup to design a replicated grah database that uses CRDTs.

We depend on the graph traversal computer provided by gremlin. Ergo, any gdb which is gremlin capable will be able to use this library
The replication logic is written outside the database itself and redirected through the JS bindings of gremlin.

To set the project up with Janusgraph, follow these commands.

1. Setup a docker network, allowing containers to talk to each other. 

  `docker newtork create janusnet`

2. Run docker compose. This will setup two containers, one for the database, Janusgraph in our example and the other for gremlin.

Janusgraph and gremlin talk to each other over port 8182 and gremlin receives commands over port 8183 which it forwards to the janusgraph instance. 

In the application logic, it is sufficient to connect to the gremlin instance at port 8183 and send graph commands. These are then forwarded to the underlying graph computer.
Operations which modify data involve additional hooks which are called when updates occur. These are replicated using YJs. 


