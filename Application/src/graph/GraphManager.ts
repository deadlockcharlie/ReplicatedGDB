import {EdgeInformation} from './Graph';

export class Graph{
    public Graph: Map<string, Array<EdgeInformation>>;

    constructor(){
        this.Graph = new Map();
    }

    public addVertex(id: string){
        this.Graph.set(id, new Array<EdgeInformation>())
    }
    public deleteVertex(id: string){
        this.Graph.delete(id)
    }
    public addEdge(id: string, edge:EdgeInformation){
        const edgeArr = this.Graph.get(id)
        edgeArr?.push(edge)
    }
    public deleteEdge(id: string, edge:EdgeInformation){
        const edgeArr = this.Graph.get(id)
        const index = edgeArr?.findIndex(e => e.id == edge.id)
        if (typeof index === 'number' && index >= 0) {
            edgeArr?.splice(index, 1);
        }
    }
    // public setVertexProperty(id: string, key:string, value:string){
    //     const 
    // }

}