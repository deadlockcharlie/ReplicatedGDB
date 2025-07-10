"use strict";
//Adding unique identifier generator - UUID, append serverid, or smth else
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
exports.Graph = void 0;
var Y = require("yjs");
var Graph = /** @class */ (function () {
    function Graph(ydoc, executeCypherQuery) {
        this.ydoc = ydoc;
        this.GVertices = ydoc.getMap('GVertices');
        this.GEdges = ydoc.getMap('GEdges');
        this.Graph = ydoc.getMap('Graph');
        this.executeCypherQuery = executeCypherQuery;
    }
    Graph.prototype.addVertex = function (label, properties, remote) {
        return __awaiter(this, void 0, void 0, function () {
            var existingVertex, query, params, result, vertex, newLink;
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
                            console.log('CALLED!');
                            vertex = {
                                id: properties.identifier,
                                label: label,
                                properties: properties,
                            };
                            newLink = {
                                id_vertex: properties.identifier,
                                edge_List: new Y.Array(),
                            };
                            this.GVertices.set(properties.identifier, vertex);
                            this.Graph.set(properties.identifier, newLink);
                            Array.from(this.GVertices.entries()).forEach(function (_a) {
                                var key = _a[0], value = _a[1];
                                console.log(key, value);
                            });
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Graph.prototype.removeVertex = function (label, properties, remote) {
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
                            this.Graph.delete(identifier);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Graph.prototype.addEdge = function (relationType, sourceLabel, sourcePropName, sourcePropValue, targetLabel, targetPropName, targetPropValue, properties, remote) {
        return __awaiter(this, void 0, void 0, function () {
            var edgeId, existingEdge, query, params, result, edge;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log(properties, sourcePropValue);
                        if (this.GVertices.get(sourcePropValue) == undefined) {
                            console.log('called for some fucking reason');
                            throw new Error("Source vertex undefined");
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
                        result = _b.sent();
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
                            (_a = this.Graph.get(sourcePropValue)) === null || _a === void 0 ? void 0 : _a.edge_List.push([edge]);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Graph.prototype.removeEdge = function (relationType, properties, remote) {
        return __awaiter(this, void 0, void 0, function () {
            var query, params, result, edge, edgeList, index;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(!properties.identifier || !relationType)) return [3 /*break*/, 1];
                        throw new Error("Identifier and relation type is required to delete an edge");
                    case 1:
                        if (!(this.GEdges.get(properties.identifier) == undefined && !remote)) return [3 /*break*/, 2];
                        throw new Error("Edge with this identifier does not exist");
                    case 2:
                        query = "MATCH ()-[r:".concat(relationType, " {identifier: $properties.identifier}]-() DELETE r");
                        params = {
                            relationType: relationType,
                            properties: properties,
                        };
                        return [4 /*yield*/, this.executeCypherQuery(query, params)];
                    case 3:
                        result = _b.sent();
                        if (!remote) {
                            edge = this.GEdges.get(properties.identifier);
                            edgeList = (_a = this.Graph.get(edge === null || edge === void 0 ? void 0 : edge.sourcePropValue)) === null || _a === void 0 ? void 0 : _a.edge_List;
                            index = edgeList === null || edgeList === void 0 ? void 0 : edgeList.toArray().findIndex(function (e) { return e.id === properties.identifier; });
                            if (index !== undefined && index >= 0) {
                                edgeList === null || edgeList === void 0 ? void 0 : edgeList.delete(index);
                            }
                            this.GEdges.delete(properties.identifier);
                            // console.log(JSON.stringify(GEdges, null, 2));
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Graph.prototype.observe = function (callback) {
        this.GVertices.observeDeep(callback);
        this.GEdges.observeDeep(callback);
        this.Graph.observeDeep(callback);
    };
    Graph.prototype.getVertex = function (id) {
        return this.GVertices.get(id);
    };
    Graph.prototype.getArrayEdges = function (id) {
        var _a;
        return (_a = this.Graph.get(id)) === null || _a === void 0 ? void 0 : _a.edge_List;
    };
    return Graph;
}());
exports.Graph = Graph;
