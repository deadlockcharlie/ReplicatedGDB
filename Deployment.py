import sys
import subprocess
import json
import os
from textwrap import dedent


def load_config(path="DistributionConfig.json"):
    with open(path, "r") as f:
        return json.load(f)

def generate_compose_file(i, config):
    http_port = config["base_http_port"] + i
    bolt_port = config["base_bolt_port"] + i
    app_port = config["base_app_port"] + i
    prometheus_port = config["base_prometheus_port"] + i
    grafana_port= config["base_grafana_port"] + i
    database = config["database"]
    password = config["password"]

    db_name = f"{database}{i+1}"
    app_name = f"app{i+1}"
    grace_name = f"Grace{i+1}"
    prometheus_name = f"Prometheus{i+1}"
    grafana_name = f"Grafana{i+1}"
    network_name = f"Grace_net_{i+1}"

    databaseService = ""
    if(database == "Neo4j"):
        databaseService = dedent(
        f"""{db_name}:
        image: neo4j:latest
        container_name: {db_name}
        ports:
          - "{http_port}:7474"
          - "{bolt_port}:7687"
        environment:
          NEO4J_AUTH: neo4j/{password}
        healthcheck:
          test: [ "CMD", "bash", "-c", "cypher-shell -u neo4j -p {password} 'RETURN 1'" ]
          interval: 10s
          timeout: 5s
          retries: 10
        networks:
          - {network_name}
          """)
    elif (database == "memgraph"):
      databaseService = dedent(
        f"""{db_name}:
        image: memgraph/memgraph:latest
        container_name: {db_name}
        command: ["--log-level=TRACE"]
        pull_policy: always
        healthcheck:
          test: ["CMD-SHELL", "echo 'RETURN 0;' | mgconsole || exit 1"]
          interval: 10s
          timeout: 5s
          retries: 3
          start_period: 0s
        ports:
          - "{bolt_port}:7687"
        networks:
          - {network_name}
      lab{i+1}:
        image: memgraph/lab
        pull_policy: always
        depends_on:
          {db_name}:
            condition: service_healthy
        ports:
          - "{http_port}:3000"
        environment:
          QUICK_CONNECT_MG_HOST: {db_name}
          QUICK_CONNECT_MG_PORT: 7687
        networks:
          - {network_name}
        
          """)

    content = dedent(f"""
    services:
      {databaseService}

      {app_name}:
        build:
          context: ../
          dockerfile: ./Dockerfiles/GRACEDockerfile
        container_name: {grace_name}
        ports:
          - "{app_port}:3000"
        environment:
          WS_URI: "ws://wsserver:1234"
          NEO4J_URI: "bolt://{db_name}:7687"
          NEO4J_USER: "neo4j"
          NEO4J_PASSWORD: "{password}"
        depends_on:
          {db_name}:
            condition: service_healthy
        networks:
          - {network_name}

      prometheus:
        image: prom/prometheus
        container_name: {prometheus_name}
        volumes:
          - ./prometheus.yaml:/etc/prometheus/prometheus.yaml
        ports:
          - "{prometheus_port}:9090"
        networks:
          - {network_name}

      grafana:
        image: grafana/grafana
        container_name: {grafana_name}
        ports:
          - "{grafana_port}:3000"
        depends_on:
          - prometheus
        networks:
          - {network_name}

    networks:
      {network_name}:
    """)

    filename = f"docker-compose.{i+1}.yml"
    with open('./Dockerfiles/'+filename, "w") as f:
        f.write(content.strip())
    print(f"Generated {'./Dockerfiles/'+filename}")
    return './Dockerfiles/'+filename

def generate_all():
    config = load_config()
    files = []
    for i in range(config["n"]):
        files.append(generate_compose_file(i, config))
    return files

def up_all():
    config = load_config()
    files = generate_all()
    for file in files:
        print(f"Starting containers from {file}...")
        subprocess.run(["docker-compose", "-f", file, "up","--build", "-d", "--force-recreate"], check=True)
    if(config["provider"]):
        subprocess.run(["docker-compose", "-f", './Dockerfiles/docker-compose.provider.yaml', "up","--build", "-d", "--force-recreate"], check=True)
    

def down_all():
    config = load_config()
    for i in range(config["n"]):
        file = f"docker-compose.{i+1}.yml"
        network = f"grace_net_{i+1}"
        print(f"Stopping containers from {'./Dockerfiles/'+file}...")
        subprocess.run(["docker-compose", "-f", './Dockerfiles/'+file , "down"], check=True)
        print(f"Removing network {network}...")
        subprocess.run(["docker", "network", "rm", network], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if (config["provider"]):
        subprocess.run(["docker-compose", "-f", './Dockerfiles/docker-compose.provider.yaml' , "down"], check=True)
    

def main():
    if len(sys.argv) < 2:
        print("Usage: python manage.py [generate|up|down]")
        sys.exit(1)

    command = sys.argv[1]
    if command == "generate":
        generate_all()
    elif command == "up":
        up_all()
    elif command == "down":
        down_all()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()