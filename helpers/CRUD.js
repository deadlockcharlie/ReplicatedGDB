  async function addVertex(remote, label, properties) {
    console.log("Adding vertex with label:", label);
    if(properties.identifier == undefined){
       throw new Error("Identifier is required");
      }
      // Check if a vertex with the same identifier already exists. If not, add it to the GVertices map and create it in the database. 
      else if(GVertices.get(properties.identifier) == undefined || remote == true){
        const query = `CREATE (n:${label} $properties) RETURN n`;
        const params = {
          label:label,
          properties: properties,
        };
        const result = await executeCypherQuery(query, params);
        if (result.records.length === 0) {
          throw new Error("Failed to create vertex");
        } 
        
        if(!remote) 
          {GVertices.set(properties.identifier, {label: label, properties: properties});
      }
        return result;
      } else {
        // If the vertex already exists, return an error
        throw new Error("Vertex with this identifier already exists");
      }
  }

  async function deleteVertex(remote, label, properties) {
      // Ensure the a unique identifier is provided
      if (!properties.identifier) {
        throw new Error("Identifier is required");
      }
      else if (GVertices.get(properties.identifier) == undefined && !remote) {
        throw new Error("Vertex with this identifier does not exist");
      } else {
        const query = `MATCH (n:${label} {identifier: $properties.identifier}) DETACH DELETE n`;
        const params = {
          label:label,
          properties: properties,
        };
        const result = await executeCypherQuery(query, params);

        if(!remote) {
          GVertices.delete(properties.identifier);
        }
        return result;
      }
  }

  async function deleteEdge(remote, relationType, properties) {
      // Ensure the a unique identifier is provided
      if (!properties.identifier || !relationType) {
        throw new Error("Identifier and relation type is required to delete an edge");
      }

      else if (GEdges.get(properties.identifier) == undefined  && !remote) {
        throw new Error("Edge with this identifier does not exist");
      } else{
        const query = `MATCH ()-[r:${relationType} {identifier: $properties.identifier}]-() DELETE r`;
        const params = {
          relationType: relationType,
          properties: properties,
        };
        const result = await executeCypherQuery(query, params);

        if(!remote){
          // console.log("Removing the edge from the local data")
          GEdges.delete(properties.identifier);
          // console.log(JSON.stringify(GEdges, null, 2));
        }
        return result;
      }
  }




async function addEdge(remote, sourceLabel, sourcePropName, sourcePropValue, targetLabel, targetPropName, targetPropValue, relationType, properties) {
    console.log(properties);
 
        // const traversal = g.V().has('identifier',toId).as('target').V().has('identifier',fromId).addE(label)
        //     .to('target')

        if (properties.identifier == undefined) {
            throw new Error("Identifier is required");
        }
        else if (GEdges.get(properties.identifier) == undefined || remote == true) {
                
            const query = `MATCH (a:${sourceLabel} {${sourcePropName}: "${sourcePropValue}"}), (b:${targetLabel} {${targetPropName}: "${targetPropValue}"}) CREATE (a)-[r:${relationType} $properties]->(b) RETURN r`;
            const params = {
                sourceLabel: sourceLabel,
                sourcePropName: sourcePropName,
                sourcePropValue: sourcePropValue,
                targetLabel: targetLabel,
                targetPropName: targetPropName,
                targetPropValue: targetPropValue,
                properties: properties,
                relationType: relationType
            };
            const result = await executeCypherQuery(query, params);

            if (result.records.length === 0) {
                throw new Error(JSON.stringify(result));
            }
            if(!remote){
                GEdges.set(properties.identifier, {sourceLabel: sourceLabel, sourcePropName: sourcePropName, sourcePropValue: sourcePropValue, targetLabel: targetLabel, targetPropName: targetPropName, targetPropValue: targetPropValue, relationType: relationType, properties: properties });

            }
            return result;
        } else {
            throw new Error("Edge with this identifier already exists");
        }


        // console.log("Result:", result);
        // // for (const [key, value] of Object.entries(properties)) {
        // //     traversal.property(key, value);
        // // }

        // // const result = await traversal.next();
        
        // res.status(201).json({
        //     message: 'Edge created successfully',
        // });


}

module.exports.addEdge = addEdge;
module.exports.addVertex = addVertex;
module.exports.deleteVertex = deleteVertex;
module.exports.deleteEdge = deleteEdge;