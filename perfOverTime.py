import re
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

# ---------- Log Parsing ----------
log_file = "workload.log"

timestamps = []
latencies = []
throughputs = []

pattern = re.compile(
    r'(\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}) .*Last \[(\d{2}):(\d{2}\.\d{3}) .*?\], Throughput .*?\[(\d+\.\d+)\]'
)

with open(log_file) as f:
    for line in f:
        match = pattern.search(line)
        if match:
            ts_str, m, s_ms, throughput = match.groups()
            timestamps.append(datetime.strptime(ts_str, "%Y/%m/%d %H:%M:%S"))
            latency = int(m)*60 + float(s_ms)
            latencies.append(latency)
            throughputs.append(float(throughput))

df = pd.DataFrame({
    "Time": timestamps,
    "Latency_sec": latencies,
    "Throughput": throughputs
})

# ---------- Failure Intervals ----------
# Define failures: list of tuples (start_time, duration_in_seconds)
failures = [
    (df['Time'][3], 5),  # example: failure starts at 4th timestamp and lasts 5s
    (df['Time'][10], 3)  # another failure
]

# ---------- Plot ----------
fig, ax1 = plt.subplots(figsize=(12,6))

# Plot Throughput
color = 'tab:blue'
ax1.set_xlabel('Time')
ax1.set_ylabel('Throughput', color=color)
ax1.plot(df['Time'], df['Throughput'], color=color, label='Throughput')
ax1.tick_params(axis='y', labelcolor=color)

# Plot Latency
ax2 = ax1.twinx()
color = 'tab:red'
ax2.set_ylabel('Latency (s)', color=color)
ax2.plot(df['Time'], df['Latency_sec'], color=color, label='Latency')
ax2.tick_params(axis='y', labelcolor=color)

# Add vertical bars for failures
for start, duration in failures:
    ax1.axvspan(start, start + timedelta(seconds=duration), color='gray', alpha=0.3)

fig.tight_layout()
plt.title('Throughput and Latency over Time with Failures')
plt.show()
