import json
import csv
import sys
from pathlib import Path

def json_to_csv(json_file, out_dir="import"):
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # --- Vertices ---
    vertices = data.get("vertices", [])
    if vertices:
        # Collect all possible keys (besides id)
        extra_fields = sorted({k for v in vertices for k in v.keys() if k not in ["_id"]})
        fieldnames = [":ID", "id"] + extra_fields

        with open(out_path / "nodes.csv", "w", newline="", encoding="utf-8") as f_nodes:
            writer = csv.DictWriter(f_nodes, fieldnames=fieldnames)
            writer.writeheader()
            for v in vertices:
                row = {":ID": v.get("_id"), "id": v.get("_id")}
                for k in extra_fields:
                    row[k] = v.get(k, "")
                writer.writerow(row)

    # --- Edges ---
    edges = data.get("edges", [])
    if edges:
        # Collect all possible keys (besides id, source, target)
        extra_fields = sorted({k for e in edges for k in e.keys() if k not in ["_id", "_outV", "_inV"]})
        fieldnames = ["id", ":START_ID", ":END_ID", "source", "target"] + extra_fields

        with open(out_path / "relationships.csv", "w", newline="", encoding="utf-8") as f_edges:
            writer = csv.DictWriter(f_edges, fieldnames=fieldnames)
            writer.writeheader()
            for e in edges:
                row = {
                    "id": e.get("_id"),
                    "source": e.get("_outV"),
                    "target": e.get("_inV"),
                    ":START_ID": e.get("_outV"),
                    ":END_ID": e.get("_inV"),
                    "_type": e.get("_type"),
                }
                for k in extra_fields:
                    row[k] = e.get(k, "")
                writer.writerow(row)

    print(f"✅ Export complete. Files are in: {out_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python json_to_csv.py graph.json [output_dir]")
        sys.exit(1)

    json_file = sys.argv[1]
    out_dir = sys.argv[2] if len(sys.argv) > 2 else "import"
    json_to_csv(json_file, out_dir)
