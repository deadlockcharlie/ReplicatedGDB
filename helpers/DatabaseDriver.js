const neo4j = require("neo4j-driver");

console.log("Connecting to neo4j on Bolt port:", process.env.NEO4J_URI);

const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));
(async () => {
  await driver.getServerInfo();
})();


async function executeCypherQuery(statement, params){
  try {
    const result = await driver.executeQuery(statement, params);
    return result;
  } catch (error) {
    throw error; // we are logging this error at the time of calling this method
  }
}

async function closeConnection() {
  await driver.close();
}

module.exports = { driver, executeCypherQuery, closeConnection };