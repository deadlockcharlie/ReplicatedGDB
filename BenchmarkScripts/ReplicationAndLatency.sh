#!/bin/bash

# Directories (adjust paths if needed)
REPLICATED_DIR="$HOME/work/ReplicatedGDB"
YCSB_DIR="$HOME/work/YCSB"

# Path where your scenario configs are stored
CONFIG_DIR="$HOME/work/ReplicatedGDB/BenchmarkScripts/DistributionConfigs"

# Get all configs in the directory (you can also hardcode)
SCENARIOS=("$CONFIG_DIR"/*.json)

# Chart generation command (edit as needed)
CHART_CMD="python3 generate_chart.py"

for CONFIG in "${SCENARIOS[@]}"; do
    FILE=$(basename "$CONFIG")
    SCENARIO="${FILE%.json}"

    # Extract info: e.g. "1Neo4j" → replicas=1, dbname=Neo4j
    REPLICAS=$(echo "$SCENARIO" | grep -o '^[0-9]\+')
    DBNAME=$(echo "$SCENARIO" | sed -E 's/^[0-9]+//')

    echo "======================================="
    echo " Running benchmark for $SCENARIO"
    echo " Replicas : $REPLICAS"
    echo " Database : $DBNAME"
    echo "======================================="

    echo $CONFIG
    # Copy config file
    cp "$CONFIG" "$REPLICATED_DIR/config.json"

    # Deploy
    cd "$REPLICATED_DIR" || exit 1
    python3 deployment.py up ./config.json|| exit 1

    # Run YCSB benchmarks (two clients specific to this DB)
    cd "$YCSB_DIR" || exit 1
    echo "Executing YCSB clients for $DBNAME ($REPLICAS replicas)..."

    ./bin/ycsb run grace -P workloads/workload_grace -p HOSTURI="http://localhost:3000" -p maxexecutiontime=60 -threads 1 \
        > "./BenchmarkResults/ReplicationAndLatency/results_${SCENARIO}_client1.txt" &
    PID1=$!

    # Wait for both clients
    wait $PID1

    # Generate chart
    echo "Generating chart for $SCENARIO ..."
    # $CHART_CMD "results_${SCENARIO}_client1.txt" \
    #            "results_${SCENARIO}_client2.txt" \
    #            "chart_${SCENARIO}.png"

    echo "Completed $SCENARIO"
    echo

    # Optional: tear down deployment before next scenario
    cd "$REPLICATED_DIR" || exit 1
    # python3 deployment.py down
done

echo "All experiments finished!"