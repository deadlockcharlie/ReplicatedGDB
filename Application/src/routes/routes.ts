import { logger } from "../helpers/logging";
import { graph } from "../app";



export async function getGraph(_req, res) {
  try {
    const result = await graph.getGraph();
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Error fetching graph ${err}`);
    res.status(500).json(`Error fetching graph ${err}`);
  }
}

export async function addVertex(req, res) {
  try {
    const { label, properties } = req.body;
    const result = await graph.addVertex(label, properties, false);
    logger.info(
      `Vertex added: ${JSON.stringify({
        label: label,
        properties: properties,
      })}`
    );
    res.status(200).json({
      label: label,
      properties: properties,
    });
  } catch (err) {
    logger.error(`Error adding vertex ${err}`);
    res.status(500).json(`Error adding vertex ${err}`);
  }
}

export async function addEdge(req, res) {
  try {
    const {
      relationType,
      sourcePropName,
      sourcePropValue,
      targetPropName,
      targetPropValue,
      properties,
    } = req.body;

    await graph.addEdge(
      relationType,
      sourcePropName,
      sourcePropValue,
      targetPropName,
      targetPropValue,
      properties,
      false
    );

    logger.info(`Edge Added ${JSON.stringify({
      relationType: relationType,
      sourcePropName: sourcePropName,
      sourcePropValue: sourcePropValue,

      targetPropName: targetPropName,
      targetPropValue: targetPropValue,
      properties: properties,
    })}`)
    res.status(200).json({
      relationType: relationType,
      sourcePropName: sourcePropName,
      sourcePropValue: sourcePropValue,
      targetPropName: targetPropName,
      targetPropValue: targetPropValue,
      properties: properties,
    });
  } catch (err) {
    logger.error(`Error adding edge ${err}`);
    res.status(500).json(`Error adding edge ${err}`);
  }
}

export async function deleteVertex(req, res) {
  try {
    const id = req.body.id; // you can pass label via query
    await graph.removeVertex(id, false);
    logger.info(`Vertex deleted: ${JSON.stringify({id:id})}`);
    res.status(200).json({id:id});
  } catch (err) {
    logger.error(`Error removing vertex ${err}`);
    res.status(500).json(`Error removing vertex ${err}`);
  }
}

export async function deleteEdge(req, res) {
  try {
    const id = req.body.id;

    await graph.removeEdge(id, false);
    logger.info(`Edge deleted: ${JSON.stringify({id:id})}`);
    res.status(200).json({id:id});
  } catch (err) {
    logger.error(`Error deleting edge ${err}`);
    res.status(500).json(`Error deleting edge ${err}`);
  }
}

export async function setVertexProperty(req, res) {
  try {
    const { id, key, value } = req.body;
    await graph.setVertexProperty(id, key, value, false);
    logger.info(`Vertex property set: ${JSON.stringify({ id, key, value })}`);
    res.status(200).json({ id, key, value });
  } catch (err) {
    logger.error(`Error setting vertex property ${err}`);
    res.status(500).json(`Error setting vertex property ${err}`);
  }
}

export async function setEdgeProperty(req, res) {
  try {
    const { id, key, value } = req.body;
    await graph.setEdgeProperty(id, key, value, false);
    logger.info(`Edge property set: ${JSON.stringify({ id, key, value })}`);
    res.status(200).json({ id, key, value });
  } catch (err) {
    logger.error(`Error setting edge property ${err}`);
    res.status(500).json(`Error setting edge property ${err}`);
  }
}

export async function removeVertexProperty(req, res) {
  try {
    const { id, key } = req.body;
    await graph.removeVertexProperty(id, key, false);
    logger.info(`Vertex property removed: ${JSON.stringify({ id, key })}`);
    res.status(200).json({ id, key });
  } catch (err) {
    logger.error(`Error removing vertex property ${err}`);
    res.status(500).json(`Error removing vertex property ${err}`);
  }
}

export async function removeEdgeProperty(req, res) {
  try {
    const { id, key } = req.body;
    await graph.removeEdgeProperty(id, key, false);
    logger.info(`Edge property removed: ${JSON.stringify({ id, key })}`);
    res.status(200).json({ id, key });
  } catch (err) {
    logger.error(`Error removing edge property ${err}`);
    res.status(500).json(`Error removing edge property ${err}`);
  }
}

