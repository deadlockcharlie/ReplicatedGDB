#!/bin/bash

# Directories (adjust paths if needed)
REPLICATED_DIR="$HOME/ReplicatedGDB"
YCSB_DIR="$HOME/YCSB"

# List of scenarios (DistributionConfig.json files)
SCENARIOS=("scenario1.json" "scenario2.json" "scenario3.json")

# Path where your scenario configs are stored
CONFIG_DIR="$HOME/scenario-configs"

# Benchmark parameters (edit as needed)
CLIENT1_CMD="./bin/ycsb run gdbClient1 -P workloads/workloada -threads 10"
CLIENT2_CMD="./bin/ycsb run gdbClient2 -P workloads/workloada -threads 10"

# Chart generation command (edit as needed)
CHART_CMD="python3 generate_chart.py"

# Loop over each scenario
for SCENARIO in "${SCENARIOS[@]}"; do
    echo "======================================="
    echo " Running benchmark for $SCENARIO"
    echo "======================================="

    # Copy config file
    cp "$CONFIG_DIR/$SCENARIO" "$REPLICATED_DIR/DistributionConfig.json"

    # Deploy
    cd "$REPLICATED_DIR" || exit 1
    python3 deployment.py up

    # Run benchmarks with two DB-specific YCSB clients
    cd "$YCSB_DIR" || exit 1
    echo "Executing benchmarks for $SCENARIO ..."

    $CLIENT1_CMD > "results_${SCENARIO%.json}_client1.txt" &
    PID1=$!

    $CLIENT2_CMD > "results_${SCENARIO%.json}_client2.txt" &
    PID2=$!

    # Wait for both clients to finish
    wait $PID1
    wait $PID2

    # Generate chart (combine both results)
    echo "Generating chart for $SCENARIO ..."
    $CHART_CMD "results_${SCENARIO%.json}_client1.txt" \
               "results_${SCENARIO%.json}_client2.txt" \
               "chart_${SCENARIO%.json}.png"

    echo "Completed $SCENARIO"
    echo
done

echo "All experiments finished!"