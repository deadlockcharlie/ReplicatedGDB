set -euo pipefail

SOURCE_DIR="./GraphData/yeast"
DATA_VOLUME="neo4j_data" 
IMPORT_DIR="$(pwd)/import"
NEO4J_IMAGE="neo4j:4.4.24"
DB_NAME="neo4j"



echo "[1] Cleaning up old data volume..."
docker volume rm -f $DATA_VOLUME  || true

echo "[2] Creating fresh data volume..."
docker volume create $DATA_VOLUME

echo "[3] Run neo4j-admin import..."
rm -rf ./import
mkdir import
cp -r $SOURCE_DIR/* $IMPORT_DIR

docker run --rm \
  -v $IMPORT_DIR:/import:z \
  -v $DATA_VOLUME:/data:z \
  $NEO4J_IMAGE \
  neo4j-admin import \
  --nodes=Vertex=/import/nodes.csv \
  --relationships=Edge=/import/relationships.csv \
  --delimiter ','


echo "[3] Deploying Benchmark..."

python3 Deployment.py up

echo "[4] Running the workload..."



echo "[5] Tearing down deployment..."
# python3 Deployment.py down