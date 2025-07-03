"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjacencyList = void 0;
var Y = require("yjs");
var CRUD_1 = require("./helpers/CRUD");
var AdjacencyList = /** @class */ (function () {
    function AdjacencyList(ydoc, helpers) {
        if (helpers === void 0) { helpers = {
            addVertex: CRUD_1.addVertex,
            deleteVertex: CRUD_1.deleteVertex,
            addEdge: CRUD_1.addEdge,
            deleteEdge: CRUD_1.deleteEdge
        }; }
        this.ydoc = ydoc;
        this.helpers = helpers;
        this.GVertices = ydoc.getMap('GVertices');
    }
    AdjacencyList.prototype.addNode = function (id, label, properties, remote) {
        if (remote === void 0) { remote = false; }
        this.helpers.addVertex(remote, label, properties);
        var node = new Y.Map();
        node.set('id', id);
        node.set('label', label);
        node.set('properties', properties);
        node.set('edgeInformation', new Y.Array());
        this.GVertices.set(id, node);
    };
    AdjacencyList.prototype.removeNode = function (id, label, properties, remote) {
        if (remote === void 0) { remote = false; }
        this.helpers.deleteVertex(remote, label, properties);
        this.GVertices.delete(id);
    };
    AdjacencyList.prototype.addEdge = function (sourceId, targetId, edge, remote) {
        if (remote === void 0) { remote = false; }
        var sourceNode = this.GVertices.get(sourceId);
        if (!sourceNode)
            throw new Error('Source node not found');
        var edgeId = "".concat(sourceId, "->").concat(targetId);
        this.helpers.addEdge(remote, edge.sourceLabel, edge.sourcePropName, edge.sourcePropValue, edge.targetLabel, edge.targetPropName, edge.targetPropValue, edge.relationType, edge.properties);
        var edgeList = sourceNode.get('edgeInformation');
        var edgeMap = new Y.Map();
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
    };
    AdjacencyList.prototype.removeEdge = function (sourceId, edgeId, relationType, properties, remote) {
        if (remote === void 0) { remote = false; }
        var sourceNode = this.GVertices.get(sourceId);
        if (!sourceNode)
            return;
        var edgeList = sourceNode.get('edgeInformation');
        var index = edgeList.toArray().findIndex(function (e) { return e.get('id') === edgeId; });
        if (index !== -1) {
            this.helpers.deleteEdge(remote, relationType, properties);
            edgeList.delete(index, 1);
        }
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
