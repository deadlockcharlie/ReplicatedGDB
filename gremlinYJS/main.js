const express = require('express');
const gremlin = require('gremlin');
const app = express();

const port = 3000;

app.get('/', (req, res) => {

});

app.listen(port, () => {
    console.log('Setting up connection to Gremlin server...');
    const traversal = gremlin.process.AnonymousTraversalSource.traversal;
    const g = traversal().withRemote(new gremlin.driver.DriverRemoteConnection('ws://localhost:8182/gremlin'));

    console.log('Connected to Gremlin server');
    g.addV('person')
        .property('name', 'John Doe')
        .property('age', 30)
        .next()
        .then(() => {
            console.log('Vertex added');
        })
        .catch(error => {
            console.error('Error adding vertex:', error);
        }).then(() => {
            g.addV('person')
                .property('name', 'Jane Doe')
                .property('age', 25)
                .next()
                .then(() => {
                    console.log('Vertex added');
                })
                .catch(error => {
                    console.error('Error adding vertex:', error);
                }).then(() => {
                    g.V().toList()
                        .then(result => {
                            console.log('Gremlin query result:', result);
                        })
                        .catch(error => {
                            console.error('Error executing Gremlin query:', error);
                        })
                })
        })





    console.log(`Example app listening at http://localhost:${port}`);
});