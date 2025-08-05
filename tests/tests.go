package main

import (
	"tests/module"
)


func main() {
	//the config we want to give for the test
	CONFIG := map[string]any{
		"base_website_port":    7474,
		"base_protocol_port":   7687,
		"base_app_port":        3000,
		"base_prometheus_port": 9090,
		"base_grafana_port":    5000,
		"provider_port":        1234,
		"provider":             false,
		"dbs": []map[string]any{
			{
				"database":              "memgraph",
				"connected_to_provider": true,
				"password":              "verysecretpassword",
				"user":                  "memgraph",
			},
			{
				"database":              "Neo4j",
				"connected_to_provider": false,
				"password":              "verysecretpassword",
				"user":                  "neo4j",
			},
		},
	}

	//initiating the test
	tester := module.TestClass{
		CONFIG: CONFIG,
	}

	//running the tests
	//tester.Concurrent_addVertex_addEdge();
	//tester.Kill_Containers()
	tester.Different_properties_merge()
}

