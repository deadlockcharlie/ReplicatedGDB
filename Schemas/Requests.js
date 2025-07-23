var VertexSchema = {
  label: {
    notEmpty: true,
  },
  "properties.identifier": {
    notEmpty: true,
  },
};

var EdgeSchema = {
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

var deleteVertexSchema = {
  label: {
    notEmpty: true,
  },
  "properties.identifier": {
    notEmpty: true,
  },
};

var deleteEdgeSchema = {
    relationType: { notEmpty: true },
  "properties.identifier": {
    notEmpty: true,
  },
}

module.exports = { VertexSchema, EdgeSchema, deleteVertexSchema, deleteEdgeSchema };
