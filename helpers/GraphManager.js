"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Graph = void 0;
var Graph = /** @class */ (function () {
    function Graph() {
        this.Graph = new Map();
    }
    Graph.prototype.addVertex = function (id) {
        this.Graph.set(id, new Array());
    };
    Graph.prototype.deleteVertex = function (id) {
        this.Graph.delete(id);
    };
    Graph.prototype.addEdge = function (id, edge) {
        var edgeArr = this.Graph.get(id);
        edgeArr === null || edgeArr === void 0 ? void 0 : edgeArr.push(edge);
    };
    Graph.prototype.deleteEdge = function (id, edge) {
        var edgeArr = this.Graph.get(id);
        var index = edgeArr === null || edgeArr === void 0 ? void 0 : edgeArr.findIndex(function (e) { return e.id == edge.id; });
        if (typeof index === 'number' && index >= 0) {
            edgeArr === null || edgeArr === void 0 ? void 0 : edgeArr.splice(index, 1);
        }
    };
    return Graph;
}());
exports.Graph = Graph;
