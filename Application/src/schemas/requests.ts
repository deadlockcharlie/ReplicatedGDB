export const VertexSchema = {
  label: {
    notEmpty: true,
  },
  "properties.id": {
    notEmpty: true,
  },
};


export const EdgeSchema = {
  sourcePropName: { notEmpty: true },
  sourcePropValue: { notEmpty: true },
  targetPropName: { notEmpty: true },
  targetPropValue: { notEmpty: true },
  relationType: { notEmpty: true },
  "properties.id": {
    notEmpty: true,
  },
};

export const deleteVertexSchema = {
  id: { notEmpty: true },
};

export const deleteEdgeSchema = {
  id: { notEmpty: true },
};

export const setVertexPropertySchema = {
    id: { notEmpty: true },
    key: { notEmpty: true },
    value: { notEmpty: true },
}

export const setEdgePropertySchema = {
    id: { notEmpty: true },
    key: { notEmpty: true },
    value: { notEmpty: true },
}

export const removeVertexPropertySchema = {
    id: { notEmpty: true },
    key: { notEmpty: true },
}

export const removeEdgePropertySchema = {
    id: { notEmpty: true },
    key: { notEmpty: true },
}