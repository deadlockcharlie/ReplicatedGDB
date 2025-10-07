import { DatabaseDriver } from "./driver";
import { logger } from "../helpers/logging";
import { MongoClient, ServerApiVersion, Db, Collection, ObjectId } from 'mongodb';


interface BaseDocument {
  _id: number;
  [key: string]: any;  // Allow any additional properties
}

export class MongoDBDriver extends DatabaseDriver {
    private client: MongoClient;
    private db: Db;
    private verticesCollection: Collection<BaseDocument>;
    private edgesCollection: Collection<BaseDocument>;
    private isReady: Promise<void>;

    constructor() {
        super();
        const uri = process.env.DATABASE_URI;
        
        this.client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            maxPoolSize: 50,
            minPoolSize: 10,
            maxIdleTimeMS: 30000,
        });

        // Single initialization chain
        this.isReady = this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            await this.client.connect();
            await this.client.db("admin").command({ ping: 1 });
            logger.info("Connected to MongoDB database.");

            // Get database reference
            this.db = this.client.db('grace');

            // Check and create collections in parallel
            const collections = await this.db.listCollections().toArray();
            const collectionNames = new Set(collections.map(c => c.name));

            const createPromises = [];
            if (!collectionNames.has('vertices')) {
                createPromises.push(this.db.createCollection('vertices'));
            }
            if (!collectionNames.has('edges')) {
                createPromises.push(this.db.createCollection('edges'));
            }
            await Promise.all(createPromises);

            // Cache collection references
            this.verticesCollection = this.db.collection('vertices');
            this.edgesCollection = this.db.collection('edges');

            // // Create indexes for better query performance
            // await Promise.all([
            //     this.verticesCollection.createIndex({ "properties.id": 1 }, { unique: true, sparse: true }),
            //     this.edgesCollection.createIndex({ "properties.id": 1 }, { unique: true, sparse: true }),
            //     this.edgesCollection.createIndex({ "source.propValue": 1 }),
            //     this.edgesCollection.createIndex({ "target.propValue": 1 }),
            // ]);

            logger.warn("Preload data flag is " + process.env.PRELOAD);
            if (process.env.PRELOAD === "True") {
                logger.info("Materializing data from the db to the middleware");
                // Preloading logic would go here
            }

            logger.info("MongoDBDriver initialized.");
        } catch (e) {
            logger.error("Error connecting to MongoDB database:", e);
            throw e;
        }
    }

    private async ensureReady(): Promise<void> {
        await this.isReady;
    }

    async getGraph() {
        await this.ensureReady();
        return this.verticesCollection.find({}).limit(50).toArray();
    }

    async addVertex(labels: string[], properties: { [key: string]: any }) {
        await this.ensureReady();
        try {
            const result = await this.verticesCollection.insertOne({ 
                _id: properties.id,
                labels:labels, 
                // remove _id from properties
                properties:properties,
                createdAt: new Date()
            });
            logger.info("Vertex added with id: " + result.insertedId);
            return result;
        } catch (err) {
            logger.error("Error in add vertex: " + err);
            throw err;
        }
    }

    async addEdge(
        relationLabels: string[],
        sourcePropName: string,
        sourcePropValue: any,
        targetPropName: string,
        targetPropValue: any,
        properties: { [key: string]: any }
    ) {
        await this.ensureReady();
        try {
            const result = await this.edgesCollection.insertOne({
                _id: properties.id,
                relationLabels,
                source: { propName: sourcePropName, propValue: sourcePropValue },
                target: { propName: targetPropName, propValue: targetPropValue },
                properties:properties,
                createdAt: new Date()
            });
            logger.info("Edge added with id: " + result.insertedId);
            return result;
        } catch (err) {
            logger.error("Error in add edge: " + err);
            throw err;
        }
    }

    async deleteVertex(id: string) {
        await this.ensureReady();
        try {
            // Delete vertex by _id
            const result = await this.verticesCollection.deleteOne({ _id: parseInt(id) });
            if (result.deletedCount === 0) {
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

    async deleteEdge(properties: any, remote: boolean) {
        await this.ensureReady();
        try {
            const result = await this.edgesCollection.deleteOne({ _id: parseInt(properties.id) });
            if (result.deletedCount === 0) {
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

    async setVertexProperty(vid: string, key: string, value: string) {
        await this.ensureReady();
        try {
            const result = await this.verticesCollection.updateOne(
                { _id: parseInt(vid) },
                { 
                    $set: { 
                        [key]: value,
                        updatedAt: new Date()
                    } 
                }
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

    async setEdgeProperty(eid: string, key: string, value: string) {
        await this.ensureReady();
        try {
            const result = await this.edgesCollection.updateOne(
                { _id: parseInt(eid) },
                { 
                    $set: { 
                        [key]: value,
                        updatedAt: new Date()
                    } 
                }
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

    async removeVertexProperty(vid: string, key: string) {
        await this.ensureReady();
        try {
            const result = await this.verticesCollection.updateOne(
                { _id : parseInt(vid) },
                { 
                    $unset: {[key]: "" },
                    $set: { updatedAt: new Date() }
                }
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

    async removeEdgeProperty(eid: string, key: string) {
        await this.ensureReady();
        try {
            const result = await this.edgesCollection.updateOne(
                { _id: parseInt(eid) },
                { 
                    $unset: { [key]: "" },
                    $set: { updatedAt: new Date() }
                }
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

    async close() {
        await this.client.close();
        logger.info("MongoDB connection closed.");
    }
}