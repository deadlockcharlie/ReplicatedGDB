#!/usr/bin/env python3
import random
import time
import subprocess

# Shared network for inter-app communication
SHARED_NET = "Shared_net"

# Fault timing
FAULT_DURATION = 120
COOLDOWN = 300000

# Name (or prefix) of your provider container
PROVIDER_NAME = "Provider"

def run(cmd):
    """Run a shell command and return output"""
    print(">", " ".join(cmd))
    try:
        return subprocess.check_output(cmd, stderr=subprocess.STDOUT).decode().strip()
    except subprocess.CalledProcessError as e:
        print("⚠️ Error:", e.output.decode())
        return None

def list_replicas():
    """List all running replica containers (names starting with 'Grace')"""
    out = run(["docker", "ps", "--format", "{{.Names}}"])
    if not out:
        return []
    return [name for name in out.splitlines() if name.startswith("Grace")]

def main():
    while True:
        replicas = list_replicas()
        if not replicas:
            print("⚠️ No replicas running")
            time.sleep(10)
            continue

        # Pick a random replica
        replica = random.choice(replicas)
        if(replica=="Grace1"):
            continue

        # Partition replica from shared network
        print(f"🚫 Disconnecting {replica} from {SHARED_NET}")
        run(["docker", "network", "disconnect", SHARED_NET, replica])

        time.sleep(FAULT_DURATION)

        # Heal (reconnect to network)
        print(f"✨ Reconnecting {replica} to {SHARED_NET}")
        run(["docker", "network", "connect", SHARED_NET, replica])

        print("⏳ Cooling down...")
        time.sleep(COOLDOWN)

if __name__ == "__main__":
    main()
