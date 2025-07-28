export const VertexSchema = {
  label: {
    notEmpty: true,
  },
  "properties.identifier": {
    notEmpty: true,
  },
};


export const EdgeSchema = {
  sourceLabel: { notEmpty: true },
  sourcePropName: { notEmpty: true },
  sourcePropValue: { notEmpty: true },
  targetLabel: { notEmpty: true },
  targetPropName: { notEmpty: true },
  targetPropValue: { notEmpty: true },
  relationType: { notEmpty: true },
  "properties.identifier": {
    notEmpty: true,
  },
};

export const deleteVertexSchema = {
  label: {
    notEmpty: true,
  },
  "properties.identifier": {
    notEmpty: true,
  },
};

export const deleteEdgeSchema = {
    relationType: { notEmpty: true },
  "properties.identifier": {
    notEmpty: true,
  },
}