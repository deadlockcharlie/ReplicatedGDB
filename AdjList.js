"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjacencyList = void 0;
var Y = require("yjs");
var executeCypherQuery = require('./app').executeCypherQuery;
//export type VertexInformation = {
//  id: string,
//  properties : { [key: string]: any },
//  edgesConnected : Y.Map<EdgeInformation>
//}
var AdjacencyList = /** @class */ (function () {
    //I am not sure whether we need the seperate CRUD operation if we are implemeting it all in one class.
    function AdjacencyList(ydoc) {
        this.ydoc = ydoc;
        //this.helpers = helpers;
        this.GVertices = ydoc.getMap('GVertices');
    }
    AdjacencyList.prototype.addVertex = function (label, properties, remote) {
        return __awaiter(this, void 0, void 0, function () {
            var query, params, result, vertex, params_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        //this.helpers.addVertex(remote, label, properties);
                        console.log("Adding vertex with label:", label);
                        if (!(properties.identifier == undefined)) return [3 /*break*/, 1];
                        throw new Error("Identifier is required");
                    case 1:
                        if (!(this.GVertices.get(properties.identifier) == undefined || remote == true)) return [3 /*break*/, 3];
                        query = "CREATE (n:".concat(label, " $properties) RETURN n");
                        params = {
                            label: label,
                            properties: properties,
                        };
                        return [4 /*yield*/, executeCypherQuery(query, params)];
                    case 2:
                        result = _a.sent();
                        if (result.records.length === 0) {
                            throw new Error("Failed to create vertex");
                        }
                        if (!remote) {
                            vertex = new Y.Map();
                            vertex.set('id', properties.Identifier);
                            params_1 = {
                                properties: properties,
                                label: label
                            };
                            vertex.set('params', params_1);
                            vertex.set('edgesConnected', new Y.Map()); // This will hold EdgeInformation
                            // Store vertex in the GVertices map using its ID
                            this.GVertices.set(properties.Identifier, vertex);
                            ;
                        }
                        return [2 /*return*/, result];
                    case 3: 
                    // If the vertex already exists, return an error
                    throw new Error("Vertex with this identifier already exists");
                }
            });
        });
    };
    AdjacencyList.prototype.removeVertex = function (label, properties, remote) {
        return __awaiter(this, void 0, void 0, function () {
            var query, params, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!properties.identifier) return [3 /*break*/, 1];
                        throw new Error("Identifier is required");
                    case 1:
                        if (!(this.GVertices.get(properties.identifier) == undefined && !remote)) return [3 /*break*/, 2];
                        throw new Error("Vertex with this identifier does not exist");
                    case 2:
                        query = "MATCH (n:".concat(label, " {identifier: $properties.identifier}) DETACH DELETE n");
                        params = {
                            label: label,
                            properties: properties,
                        };
                        return [4 /*yield*/, executeCypherQuery(query, params)];
                    case 3:
                        result = _a.sent();
                        if (!remote) {
                            this.GVertices.delete(properties.identifier);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    AdjacencyList.prototype.addEdge = function (sourceId, targetId, edge, remote, properties) {
        return __awaiter(this, void 0, void 0, function () {
            var sourceNode, edgeId, edgeList, edgeExists, query, params, result, edgeMap;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log(properties);
                        if (properties.identifier == undefined) {
                            throw new Error("Identifier is required");
                        }
                        sourceNode = this.GVertices.get(sourceId);
                        if (!sourceNode)
                            throw new Error('Source node not found');
                        edgeId = "".concat(sourceId, "->").concat(targetId);
                        edgeList = sourceNode.get('edgeInformation');
                        edgeExists = edgeList.toArray().some(function (edgeMap) { return edgeMap.get('id') === edgeId; });
                        if (!(!edgeExists || remote === true)) return [3 /*break*/, 2];
                        query = "MATCH (a:".concat(edge.sourceLabel, " {").concat(edge.sourcePropName, ": \"").concat(edge.sourcePropValue, "\"}), (b:").concat(edge.targetLabel, " {").concat(edge.targetPropName, ": \"").concat(edge.targetPropValue, "\"}) CREATE (a)-[r:").concat(edge.relationType, " $properties]->(b) RETURN r");
                        params = {
                            sourceLabel: edge.sourceLabel,
                            sourcePropName: edge.sourcePropName,
                            sourcePropValue: edge.sourcePropValue,
                            targetLabel: edge.targetLabel,
                            targetPropName: edge.targetPropName,
                            targetPropValue: edge.targetPropValue,
                            properties: edge.properties,
                            relationType: edge.relationType
                        };
                        return [4 /*yield*/, executeCypherQuery(query, params)];
                    case 1:
                        result = _a.sent();
                        if (result.records.length === 0) {
                            throw new Error(JSON.stringify(result));
                        }
                        if (!remote) {
                            edgeMap = new Y.Map();
                            edgeMap.set('id', edgeId);
                            edgeMap.set('relationType', edge.relationType);
                            edgeMap.set('sourceLabel', edge.sourceLabel);
                            edgeMap.set('sourcePropName', edge.sourcePropName);
                            edgeMap.set('sourcePropValue', edge.sourcePropValue);
                            edgeMap.set('targetLabel', edge.targetLabel);
                            edgeMap.set('targetPropName', edge.targetPropName);
                            edgeMap.set('targetPropValue', edge.targetPropValue);
                            edgeMap.set('properties', edge.properties);
                            edgeList.push([edgeMap]);
                        }
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    AdjacencyList.prototype.removeEdge = function (sourceId, edgeId, relationType, properties, remote) {
        return __awaiter(this, void 0, void 0, function () {
            var sourceNode, edgeList, edgeExists, query, params, result, edgeList_1, index;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!properties.identifier || !relationType) {
                            throw new Error("Identifier and relation type is required to delete an edge");
                        }
                        sourceNode = this.GVertices.get(sourceId);
                        if (!sourceNode)
                            return [2 /*return*/];
                        edgeList = sourceNode.get('edgeInformation');
                        edgeExists = edgeList.toArray().some(function (edgeMap) { return edgeMap.get('id') === edgeId; });
                        if (!(!edgeExists && !remote)) return [3 /*break*/, 1];
                        throw new Error("Edge with this identifier does not exist");
                    case 1:
                        query = "MATCH ()-[r:".concat(relationType, " {identifier: $properties.identifier}]-() DELETE r");
                        params = {
                            relationType: relationType,
                            properties: properties,
                        };
                        return [4 /*yield*/, executeCypherQuery(query, params)];
                    case 2:
                        result = _a.sent();
                        if (!remote) {
                            edgeList_1 = sourceNode.get('edgeInformation');
                            index = edgeList_1.toArray().findIndex(function (e) { return e.get('id') === edgeId; });
                            if (index !== -1) {
                                this.helpers.deleteEdge(remote, relationType, properties);
                                edgeList_1.delete(index, 1);
                            }
                        }
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AdjacencyList.prototype.observe = function (callback) {
        this.GVertices.observeDeep(callback);
    };
    AdjacencyList.prototype.getNodeById = function (id) {
        return this.GVertices.get(id);
    };
    AdjacencyList.prototype.getOutgoingEdges = function (id) {
        var _a;
        return (_a = this.GVertices.get(id)) === null || _a === void 0 ? void 0 : _a.get('edgeInformation');
    };
    return AdjacencyList;
}());
exports.AdjacencyList = AdjacencyList;
