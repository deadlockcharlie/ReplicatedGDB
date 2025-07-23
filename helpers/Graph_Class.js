"use strict";
//Adding unique identifier generator - UUID, append serverid, or smth else
//removing dangling edges
//pre condition that source and target are edges
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
exports.Vertex_Edge = void 0;
var Vertex_Edge = /** @class */ (function () {
    function Vertex_Edge(ydoc, executeCypherQuery, listener) {
        this.ydoc = ydoc;
        this.GVertices = ydoc.getMap('GVertices');
        this.GEdges = ydoc.getMap('GEdges');
        this.listener = listener;
        this.executeCypherQuery = executeCypherQuery;
        this.setupObservers();
    }
    Vertex_Edge.prototype.addVertex = function (label, properties, remote) {
        return __awaiter(this, void 0, void 0, function () {
            var existingVertex, query, params, result, vertex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Adding vertex with label:", label);
                        console.log("Remote:", remote);
                        // Ensure identifier exists or generate one if not remote
                        //if (!properties.identifier) {
                        //  if (!remote) {
                        //    properties.identifier = `${label}_${uuidv4()}`; // default fallback
                        //  } else {
                        //    throw new Error("Identifier is required for remote vertex");
                        //  }
                        //}
                        if (properties.identifier == undefined) {
                            throw new Error("Identifier is required");
                        }
                        existingVertex = this.GVertices.get(properties.identifier);
                        // Prevent duplicate entries if not remote
                        if (existingVertex && !remote) {
                            throw new Error("Vertex with identifier \"".concat(properties.identifier, "\" already exists"));
                        }
                        query = "CREATE (n:".concat(label, " $properties) RETURN n");
                        params = { label: label, properties: properties, };
                        return [4 /*yield*/, this.executeCypherQuery(query, params)];
                    case 1:
                        result = _a.sent();
                        if (result.records.length === 0) {
                            throw new Error("Failed to create vertex");
                        }
                        // Only update local structures if not a remote sync
                        if (!remote) {
                            vertex = {
                                id: properties.identifier,
                                label: label,
                                properties: properties,
                            };
                            this.GVertices.set(properties.identifier, vertex);
                            this.listener.addVertex(properties.identifier);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Vertex_Edge.prototype.removeVertex = function (label, properties, remote) {
        return __awaiter(this, void 0, void 0, function () {
            var identifier, exists, query, params, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log(properties);
                        identifier = properties.identifier;
                        if (!identifier) {
                            throw new Error("Identifier is required");
                        }
                        exists = this.GVertices.get(identifier);
                        if (!exists && !remote) {
                            throw new Error("Vertex with identifier \"".concat(identifier, "\" does not exist"));
                        }
                        query = "MATCH (n:".concat(label, " {identifier: $identifier}) DETACH DELETE n");
                        params = { identifier: identifier };
                        return [4 /*yield*/, this.executeCypherQuery(query, params)];
                    case 1:
                        result = _a.sent();
                        if (!remote) {
                            // vertex and associated link data
                            this.GVertices.delete(identifier);
                            this.listener.deleteVertex(identifier);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Vertex_Edge.prototype.addEdge = function (relationType, sourceLabel, sourcePropName, sourcePropValue, targetLabel, targetPropName, targetPropValue, properties, remote) {
        return __awaiter(this, void 0, void 0, function () {
            var edgeId, existingEdge, query, params, result, edge;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log(properties, sourcePropValue);
                        if (this.GVertices.get(sourcePropValue) == undefined || this.GVertices.get(targetPropValue) == undefined) {
                            throw new Error("verteces undefined");
                        }
                        //check for id
                        if (!properties.identifier) {
                            throw new Error("Identifier is required for the edge");
                        }
                        edgeId = properties.identifier;
                        existingEdge = this.GEdges.get(edgeId);
                        //Dont allow duplicates if we are not remote
                        if (existingEdge && !remote) {
                            throw new Error("Edge with identifier \"".concat(edgeId, "\" already exists"));
                        }
                        query = "\n      MATCH (a:".concat(sourceLabel, " {").concat(sourcePropName, ": $sourcePropValue}), \n            (b:").concat(targetLabel, " {").concat(targetPropName, ": $targetPropValue})\n      CREATE (a)-[r:").concat(relationType, "]->(b)\n      SET r += $properties\n      RETURN r;\n        ");
                        params = {
                            sourceLabel: sourceLabel,
                            sourcePropName: sourcePropName,
                            sourcePropValue: sourcePropValue,
                            targetLabel: targetLabel,
                            targetPropName: targetPropName,
                            targetPropValue: targetPropValue,
                            properties: properties,
                            relationType: relationType
                        };
                        return [4 /*yield*/, this.executeCypherQuery(query, params)];
                    case 1:
                        result = _a.sent();
                        if (result.records.length === 0) {
                            throw new Error("Failed to create edge");
                        }
                        edge = {
                            id: edgeId,
                            sourceLabel: sourceLabel,
                            sourcePropName: sourcePropName,
                            sourcePropValue: sourcePropValue,
                            targetLabel: targetLabel,
                            targetPropName: targetPropName,
                            targetPropValue: targetPropValue,
                            properties: properties,
                            relationType: relationType,
                        };
                        if (!remote) {
                            this.GEdges.set(edgeId, edge);
                            this.listener.addEdge(sourceLabel, edge);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Vertex_Edge.prototype.removeEdge = function (relationType, properties, remote) {
        return __awaiter(this, void 0, void 0, function () {
            var edge, query, params, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Ensure the a unique identifier is provided
                        if (!properties.identifier || !relationType) {
                            throw new Error("Identifier and relation type is required to delete an edge");
                        }
                        edge = this.GEdges.get(properties.identifier);
                        if (!(edge == undefined && !remote)) return [3 /*break*/, 1];
                        throw new Error("Edge with this identifier does not exist");
                    case 1:
                        query = "MATCH ()-[r:".concat(relationType, " {identifier: $properties.identifier}]-() DELETE r");
                        params = {
                            relationType: relationType,
                            properties: properties,
                        };
                        return [4 /*yield*/, this.executeCypherQuery(query, params)];
                    case 2:
                        result = _a.sent();
                        if (!remote) {
                            if (edge == undefined) {
                                throw Error('Undefined Edge');
                            }
                            this.listener.deleteEdge(edge.sourceLabel, edge);
                            this.GEdges.delete(properties.identifier);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Vertex_Edge.prototype.setupObservers = function () {
        var _this = this;
        this.GVertices.observe(function (event, transaction) {
            if (!transaction.local) {
                event.changes.keys.forEach(function (change, key) {
                    if (change.action === 'add') {
                        var vertex = _this.GVertices.get(key);
                        if (vertex) {
                            _this.addVertex(vertex.label, vertex.properties, true).catch(console.error);
                        }
                    }
                    else if (change.action === 'delete') {
                        var oldValue = change.oldValue;
                        _this.removeVertex(oldValue.label, oldValue.properties, true).catch(console.error);
                    }
                });
            }
        });
        this.GEdges.observe(function (event, transaction) {
            if (!transaction.local) {
                event.changes.keys.forEach(function (change, key) {
                    if (change.action === 'add') {
                        var edge = _this.GEdges.get(key);
                        if (edge) {
                            _this.addEdge(edge.relationType, edge.sourceLabel, edge.sourcePropName, edge.sourcePropValue, edge.targetLabel, edge.targetPropName, edge.targetPropValue, edge.properties, true).catch(console.error);
                        }
                    }
                    else if (change.action === 'delete') {
                        var oldValue = change.oldValue;
                        _this.removeEdge(oldValue.relationType, oldValue.properties, true).catch(console.error);
                    }
                });
            }
        });
    };
    Vertex_Edge.prototype.getVertex = function (id) {
        return this.GVertices.get(id);
    };
    return Vertex_Edge;
}());
exports.Vertex_Edge = Vertex_Edge;
