import sys
import string
import subprocess
import json
import os
import re
import argparse
from textwrap import dedent, indent


def load_config(args):
  if args.config_json:
      return json.loads(args.config_json)
  if args.config_json: path = args.config_json
  else:  path = "DistributionConfig.json"
  with open(path, "r") as f:
      return json.load(f)
      
def network_create(external_network_instances):
  for n in external_network_instances:
    print(f"Creating network: {n}...")
    try: 
      subprocess.run(["docker", "network", "create", n], check=True)
    except Exception: pass

def generate_provider(config, external_network_instances):
    port = config["provider_port"]

    # Create external networks (your helper)
    network_create(external_network_instances)

    # Build YAML explicitly to avoid indentation issues
    lines = [
        "name: Provider",
        "services:",
        "  wsserver:",
        "    container_name: wsserver",
        "    build:",
        "      context: ../",
        "      dockerfile: ./Dockerfiles/WSServerDockerfile",
        "    ports:",
        f'      - "{port}:1234"',
        "    environment:",
        f'      PORT: "{port}"',
        '      HOST: "0:0:0:0"',
        "    networks:",
        "      - Provider_net",
    ]
    # attach to each external Grace network
    for n in external_network_instances:
        lines.append(f"      - {n}")

    # networks section
    lines += [
        "",
        "networks:",
        "  Provider_net:",
    ]
    for n in external_network_instances:
        lines += [
            f"  {n}:",
            "    external: true",
        ]

    content = "\n".join(lines) + "\n"

    filename = "docker-compose.provider.yml"
    filepath = f"./Dockerfiles/{filename}"
    with open(filepath, "w") as f:
        f.write(content)
    print(f"Generated {filepath}")
    return filepath
  
  
def generate_compose_file(i, db_conf, config):
    website_port = config["base_website_port"] + i
    protocol_port = config["base_protocol_port"] + i
    app_port = config["base_app_port"] + i
    prometheus_port = config["base_prometheus_port"] + i
    grafana_port = config["base_grafana_port"] + i

    database = db_conf["database"]
    password = db_conf["password"]
    connected_to_provider = db_conf["connected_to_provider"]
    db_user = db_conf["user"]

    db_name = f"{database}{i+1}"
    app_name = f"app{i+1}"
    grace_name = f"Grace{i+1}"
    prometheus_name = f"Prometheus{i+1}"
    grafana_name = f"Grafana{i+1}"
    network_name = f"Grace_net_{i+1}"


    if database == "neo4j":
        db_url = f"bolt://{db_name}:7687"
        databaseService = dedent(f"""
        {db_name}:
          image: neo4j:latest
          container_name: {db_name}
          ports:
            - "{website_port}:7474"
            - "{protocol_port}:7687"
          environment:
            NEO4J_AUTH: neo4j/{password}
            NEO4J_server_config_strict__validation_enabled: false
          healthcheck:
            test: [ "CMD", "bash", "-c", "cypher-shell -u neo4j -p {password} 'RETURN 1'" ]
            interval: 10s
            timeout: 5s
            retries: 10
          networks:
            - {network_name}
        """).strip("\n")
    elif database == "memgraph":  # memgraph
        db_url = f"bolt://{db_name}:7687"
        databaseService = dedent(f"""
        {db_name}:
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
            - "{protocol_port}:7687"
          networks:
            - {network_name}
        lab{i+1}:
          image: memgraph/lab
          pull_policy: always
          container_name: lab{i+1}
          depends_on:
            {db_name}:
              condition: service_healthy
          ports:
            - "{website_port}:3000"
          environment:
            QUICK_CONNECT_MG_HOST: {db_name}
            QUICK_CONNECT_MG_PORT: 7687
          networks:
            - {network_name}
        """).strip("\n")
    elif database == "janusgraph":  # janusgraph
        db_url = f"ws://{db_name}:8182"
        databaseService = dedent(f"""
        {db_name}:
          image: docker.io/janusgraph/janusgraph:latest
          container_name: {db_name}
          healthcheck:
            test: ["CMD-SHELL", "bin/gremlin.sh", "-e", "scripts/remote-connect.groovy"]
            interval: 25s
            timeout: 20s
            retries: 3
          ports:
            - "{protocol_port}:8182"
          networks:
            - {network_name}
        """).strip("\n")

    environment = dedent(f"""
    WS_URI: "ws://wsserver:1234"
    DATABASE_URI: {db_url}
    NEO4J_USER: "neo4j"
    NEO4J_PASSWORD: "{password}"
    USER: {db_user}
    DATABASE: {database.upper()}
    """).strip("\n")

    # indent to exact nesting levels
    databaseService_block = indent(databaseService, "  ")  # under `services:`
    environment_block = indent(environment, "      ")      # under `environment:`


    lines = [
        f"name: GraceReplica{i+1}",
        "services:",
        databaseService_block,
        "",
        f"  {app_name}:",
        "    build:",
        "      context: ../",
        "      dockerfile: ./Dockerfiles/GRACEDockerfile",
        f"    container_name: {grace_name}",
        "    ports:",
        f'      - "{app_port}:3000"',
        "    environment:",
        environment_block,
        "    depends_on:",
        f"      {db_name}:",
        "        condition: service_healthy",
        "    networks:",
        f"      - {network_name}",
        "",
        "  prometheus:",
        "    image: prom/prometheus",
        f"    container_name: {prometheus_name}",
        "    volumes:",
        "      - ./prometheus.yaml:/etc/prometheus/prometheus.yaml",
        "    ports:",
        f'      - "{prometheus_port}:9090"',
        "    networks:",
        f"      - {network_name}",
        "",
        "  grafana:",
        "    image: grafana/grafana",
        f"    container_name: {grafana_name}",
        "    ports:",
        f'      - "{grafana_port}:3000"',
        "    depends_on:",
        "      - prometheus",
        "    networks:",
        f"      - {network_name}",
        "",
        "networks:",
        f"  {network_name}:",
    ]

    content = "\n".join(lines) + "\n"
    filename = f"./Dockerfiles/docker-compose.{i+1}.yml"
    with open(filename, "w") as f:
        f.write(content)
    print(f"Generated {filename}")
    return filename
  
def generate_all(config):
    files = []
    n = len(config['dbs'])
    external_network_instances = []    
    
    for i in range(n):
        files.append(generate_compose_file(i, config['dbs'][i], config))
        if config['dbs'][i]['connected_to_provider']: external_network_instances.append((f"Grace_net_{i+1}"))
    if(config["provider"]):
        provider = generate_provider(config, external_network_instances)
        files.append(provider)
    return files

def up_all(config):
    files = generate_all(config)
    for file in files:
        print(f"Starting containers from {file}...")
        subprocess.run(["docker","compose", "-f", file, "up","--build", "-d", "--force-recreate"], check=True)
    if(config["provider"]):
        subprocess.run(["docker","compose", "-f", './Dockerfiles/docker-compose.provider.yml', "up","--build", "-d", "--force-recreate"], check=True)

    

def down_all(config):
    for i in range(len(config["dbs"])):
        file = f"docker-compose.{i+1}.yml"
        network = f"Grace_net_{i+1}"
        print(f"Stopping containers from {'./Dockerfiles/'+file}...")

        subprocess.run(["docker","compose", "-f", './Dockerfiles/'+file , "down"], check=True)
        print(f"Removing network {network}...")
        subprocess.run(["docker", "network", "rm", network], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if (config["provider"]):
        subprocess.run(["docker","compose", "-f", './Dockerfiles/docker-compose.provider.yml' , "down"], check=True)
        
def force_clean(config):  
  files = [f'./Dockerfiles/docker-compose.{i+1}.yml' for i in range(len(config['dbs']))]
  if config.get('provider'):
    files.append('./Dockerfiles/docker-compose.provider.yml')
    
  for file in files:
    print(f'Tearing down {file} (containers, networks, images, volumes)')
    
    subprocess.run(
      ["docker", "compose", "-f", file, "down", "--remove-orphans", "--volumes", "--rmi", "local"], check = False
    )

  patterns = [
    r"^(Neo4j|memgraph)\d+$",
    r"^lab\d+$",
    r"^Grace\d+$",
    r"^Prometheus\d+$",
    r"^Grafana\d+$",
    r"^wsserver$",
  ]
  try:
    names_output = subprocess.check_output(
      ["docker", "ps", "-a", "--format", "{{.Names}}"], text=True
    )
    for name in names_output.splitlines():
      if any(re.match(p, name) for p in patterns):
          print(f"Removing left-over container {name}...")
          subprocess.run(["docker", "rm", "-f", name],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
  except Exception: pass
  
  net_patterns = [r"^Grace_net_\d+$", r"^Provider_net$"]
  try:
      nets_output = subprocess.check_output(
          ["docker", "network", "ls", "--format", "{{.Name}}"], text=True
      )
      for net in nets_output.splitlines():
          if any(re.match(p, net) for p in net_patterns):
              print(f"Removing network {net}...")
              subprocess.run(["docker", "network", "rm", net],
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
  except Exception: pass
    
  ########Uncomment to remove any unused containers, images and volumes 
   
  subprocess.run(["docker", "container", "prune", "-f"], check=False)
  subprocess.run(["docker", "image", "prune", "-f"], check=False)
  #subprocess.run(["docker", "volume", "prune", "-f"], check=False)
  
def parse_args(argv=None):
    p = argparse.ArgumentParser(description="Manage deployments")
    p.add_argument("command", choices=["generate","up","down","force-clean","rebuild"])
    g = p.add_mutually_exclusive_group()
    g.add_argument("-c","--config-file", help="Path to JSON config")
    g.add_argument("-j","--config-json", help="Inline JSON string for config")
    return p.parse_args(argv)

  
def main(argv=None):
    args = parse_args(argv)
    config = load_config(args)
  
    if len(sys.argv) < 2:
        print("Usage: python manage.py [generate|up|down|force-clean|rebuild]")
        sys.exit(1)

    args.command = sys.argv[1]
    if args.command == "generate":
        generate_all(config)
    elif args.command == "up":
        up_all(config)
    elif args.command == "down":
        down_all(config)
    elif args.command == "force-clean":    
        force_clean(config)
    elif args.command == "rebuild":
        down_all(config)
        up_all(config)
    else:
        print(f"Unknown command: {args.command}")
        sys.exit(1)

if __name__ == "__main__":
    main()