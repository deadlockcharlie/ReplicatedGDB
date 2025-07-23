const neo4j = require("neo4j-driver");
const {logger} = require("../helpers/Logging");
console.log("Connecting to neo4j on Bolt port:", process.env.NEO4J_URI);

const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));
(async () => {
  await driver.getServerInfo();
  driver.executeQuery("MATCH (n) DETACH DELETE n");
  driver.executeQuery("MATCH ()-[r]->() DELETE r");
  logger.info("Database reinitialised. Any existing data has been deleted from the local database. Commencing sync with remote database...");
})();


async function executeCypherQuery(statement, params){
  try {
    const result = await driver.executeQuery(statement, params);
    // logger.error(JSON.stringify(result));
    return result;
  } catch (error) {
    logger.error(JSON.stringify(error));
    throw error; // we are logging this error at the time of calling this method
  }
}

async function closeConnection() {
  await driver.close();
}

module.exports = { driver, executeCypherQuery, closeConnection };