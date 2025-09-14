#!/bin/sh
# setup-latency.sh
# Usage: ./setup-latency.sh <local_name> <peer1_name> <peer1_delay> <peer2_name> <peer2_delay>
# Example for mongo1: ./setup-latency.sh mongo1 mongo2 50 mongo3 100

LOCAL=$1
PEER1=$2
DELAY1=$3
PEER2=$4
DELAY2=$5


# get container IPs of peers
PEER1_IP=$(getent hosts $PEER1 | awk '{print $1}')
PEER2_IP=$(getent hosts $PEER2 | awk '{print $1}')

echo "[$LOCAL] Setting up latency to $PEER1 ($DELAY1 ms) and $PEER2 ($DELAY2 ms)"

# create root priority qdisc
tc qdisc add dev eth0 root handle 1: prio

# add delay to PEER1
tc qdisc add dev eth0 parent 1:1 handle 10: netem delay ${DELAY1}ms
tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 match ip dst $PEER1_IP flowid 1:1

# add delay to PEER2
tc qdisc add dev eth0 parent 1:2 handle 20: netem delay ${DELAY2}ms
tc filter add dev eth0 protocol ip parent 1:0 prio 2 u32 match ip dst $PEER2_IP flowid 1:2

echo "[$LOCAL] Latency setup complete"
tc qdisc show
