import {EdgeInformation} from './Graph_Class';

export class Graph{
    private Graph: Map<string, Array<EdgeInformation>>;

    constructor(){
        this.Graph = new Map();
    }

    private addVertex(id: string){
        this.Graph.set(id, new Array<EdgeInformation>())
    }
    private deleteVertex(id: string){
        this.Graph.delete(id)
    }
    private addEdge(id: string, edge:EdgeInformation){
        const edgeArr = this.Graph.get(id)
        edgeArr?.push(edge)
    }
    private deleteEdge(id: string, edge:EdgeInformation){
        const edgeArr = this.Graph.get(id)
        const index = edgeArr?.findIndex(e => e.id == edge.id)
        if (typeof index === 'number' && index >= 0) {
            edgeArr?.splice(index, 1);
        }
    }

}