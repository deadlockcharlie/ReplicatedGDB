var VertexSchema = {
    type: "object",
    required: ["label", "properties"],
    properties: {
        label:{
            type: "string"
        },
        properties: {
            type: "object",
            required: ["identifier"],
            properties: {
                identifier: "string"
            }
        }
    }
}