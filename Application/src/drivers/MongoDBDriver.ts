import { DatabaseDriver } from "./driver";
import {logger} from "../helpers/logging";

const {MongoClient, ServerApiVersion} = require('mongodb');

export class MongoDBDriver extends DatabaseDriver {
    driver;
    constructor() {
        super();
        const uri = process.env.DATABASE_URI;
        const client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        (async () => {
            try {
                await client.connect();
                await client.db("admin").command({ ping: 1 });
                logger.info("Connected to MongoDB database.");
            } catch (e) {
                logger.error("Error connecting to MongoDB database:", e);
            }
        })();

        const databases = async () => {
            return await client.db().admin().listDatabases();
        };
        databases().then((dbs) => {
            if (!dbs.databases.some((db: { name: string; }) => db.name === 'grace')) {
                client.db('grace');
            }
        });

        const collections = async () => {
            return await client.db('grace').listCollections().toArray();
        }

        collections().then((cols) => {
            if (!cols.some((col: { name: string; }) => col.name === 'vertices')) {
                client.db('grace').createCollection('vertices');
            }
            if (!cols.some((col: { name: string; }) => col.name === 'edges')) {
                client.db('grace').createCollection('edges');
            }
        });

        logger.warn("Preload data flag is " + process.env.PRELOAD);
        if (process.env.PRELOAD == "True") {
            logger.info("Materializing data from the db to the middleware");
            // Preloading logic would go here
        }

        logger.info("MongoDBDriver initialized.");

        this.driver = client;
    }


    getGraph() {
        const collection = this.driver.db('grace').collection('vertices');
        return collection.find({}).limit(50).toArray();
    }
    addVertex(labels: [string], properties: { [key: string]: any; }) {
        try{
            const collection = this.driver.db('grace').collection('vertices');
            const result = collection.insertOne({labels: labels, properties: properties});
            logger.info("Vertex added with id: " + result.insertedId);
            return result;
        } catch (err) {
            logger.error("Error in add vertex: " + err);
            throw err;
        }
        
    }
    addEdge(relationLabels: [string],  sourcePropName: string, sourcePropValue: any, targetPropName: string, targetPropValue: any, properties: { [key: string]: any; }) {
        try{
            const collection = this.driver.db('grace').collection('edges');
            const result = collection.insertOne({
                relationLabels: relationLabels,
                source: {
                    propName: sourcePropName,
                    propValue: sourcePropValue
                },
                target: {
                    propName: targetPropName,
                    propValue: targetPropValue
                },
                properties: properties
            });
            logger.info("Edge added with id: " + result.insertedId);
            return result;
        } catch (err) {
            logger.error("Error in add edge: " + err);
            throw err;
        }
    }
    deleteVertex(id: string) {
        try{
            const collection = this.driver.db('grace').collection('vertices');
            const result = collection.deleteOne({ "properties.id": id });
            if(result.deletedCount === 0){
                logger.warn("No vertex found with id: " + id);
            } else {
                logger.info("Vertex deleted with id: " + id);
            }
            return result;
        } catch (err) {
            logger.error("Error in delete vertex: " + err);
            throw err;
        }
    }
    deleteEdge(properties: any, remote: boolean) {
        try{
            const collection = this.driver.db('grace').collection('edges');
            const result = collection.deleteOne({ "properties.id": properties.id });
            if(result.deletedCount === 0){
                logger.warn("No edge found with id: " + properties.id);
            } else {
                logger.info("Edge deleted with id: " + properties.id);
            }
            return result;
        } catch (err) {
            logger.error("Error in delete edge: " + err);
            throw err;
        }
    }
    setVertexProperty(vid: string, key: string, value: string) {
        const collection = this.driver.db('grace').collection('vertices');
        try {
            const result = collection.updateOne(
                { "properties.id": vid },
                { $set: { [`properties.${key}`]: value } }
            );
            if (result.matchedCount === 0) {
                throw new Error(`Vertex with id ${vid} not found.`);
            }
            logger.info(`Property ${key} set to ${value} for vertex with id ${vid}`);
            return result;
        } catch (err) {
            logger.error("Error in set vertex property: " + err);
            throw err;
        }
    }
    setEdgeProperty(eid: string, key: string, value: string) {
        const collection = this.driver.db('grace').collection('edges');
        try {
            const result = collection.updateOne(
                { "properties.id": eid },
                { $set: { [`properties.${key}`]: value } }
            );
            if (result.matchedCount === 0) {
                throw new Error(`Edge with id ${eid} not found.`);
            }
            logger.info(`Property ${key} set to ${value} for edge with id ${eid}`);
            return result;
        } catch (err) {
            logger.error("Error in set edge property: " + err);
            throw err;
        }
    }
    removeVertexProperty(vid: string, key: string) {
        const collection = this.driver.db('grace').collection('vertices');
        try {
            const result = collection.updateOne(
                { "properties.id": vid },
                { $unset: { [`properties.${key}`]: "" } }
            );
            if (result.matchedCount === 0) {
                throw new Error(`Vertex with id ${vid} not found.`);
            }
            logger.info(`Property ${key} removed for vertex with id ${vid}`);
            return result;
        } catch (err) {
            logger.error("Error in remove vertex property: " + err);
            throw err;
        }
    }
    removeEdgeProperty(eid: string, key: string) {
        const collection = this.driver.db('grace').collection('edges');
        try {
            const result = collection.updateOne(
                { "properties.id": eid },
                { $unset: { [`properties.${key}`]: "" } }
            );
            if (result.matchedCount === 0) {
                throw new Error(`Edge with id ${eid} not found.`);
            }
            logger.info(`Property ${key} removed for edge with id ${eid}`);
            return result;
        } catch (err) {
            logger.error("Error in remove edge property: " + err);
            throw err;
        }
    }



}