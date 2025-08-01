package main

import (
	"tests/module"
)


func main() {
	//config for starting containers
	CONFIG := map[string]any{
		"base_website_port":    7474,
		"base_protocol_port":   7687,
		"base_app_port":        3000,
		"base_prometheus_port": 9090,
		"base_grafana_port":    5000,
		"provider_port":        1234,
		"provider":             true,
		"dbs": []map[string]any{
			{
				"database":              "memgraph",
				"connected_to_provider": true,
				"database_url":          "bolt://memgraph:7687",
				"user":                  "memgraph",
			},
			{
				"database":              "Neo4j",
				"connected_to_provider": false,
				"password":              "verysecretpassword",
				"database_url":          "bolt://memgraph:7687",
				"user":                  "neo4j",
			},
		},
	}

	tester := module.TestClass{
		CONFIG: CONFIG,
	}
	tester.Startup_containers()

	//replica urls for query endpoints
	//REPLICA_1_URL = "http://localhost:3000"
	REPLICA_2_URL := "http://localhost:3001"
	vertex1 := map[string]any{
 		"label": "ProductItem",
    	"properties":map[string]any{
        	"identifier": "Product1",
        	"name": "Laptop2",
        	"price": 999.99,
        	"inStock": true,
    	},
	}
	tester.Api_post_request(REPLICA_2_URL, "addVertex", vertex1)

}

