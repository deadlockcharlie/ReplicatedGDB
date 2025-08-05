package module

import (
	"os"
	"os/exec"
 	"io"
	"bytes"
 	"log"
 	"net/http"
	"encoding/json"
	"fmt"
	"context"
    "github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

type TestClass struct {
	CONFIG map[string]any

}
func (p *TestClass) Startup_containers(){

	configJSON, err := json.Marshal(p.CONFIG)
	if err != nil {
		log.Fatalf("failed to encode CONFIG as JSON: %v", err)
	}

	fmt.Print("Reading from provided json config\n")

	cmd := exec.Command("sudo", "python3", "/home/dervishi/ReplicatedGDB/Deployment.py", "up", "--config-json", string(configJSON))
	cmd.Dir = "../.."
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
}

func (p *TestClass) Cypher_query(DB_URL string, DB_USER string, DB_Password string, cypherQuery string, params map[string]any){

	ctx := context.Background()
    driver, err := neo4j.NewDriverWithContext(
        DB_URL,
        neo4j.BasicAuth(DB_USER, DB_Password, ""))
	if err != nil {
		log.Fatal(err)
	}
    defer driver.Close(ctx)

    err = driver.VerifyConnectivity(ctx)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("Connection established.")


	result, err := neo4j.ExecuteQuery(ctx, driver, cypherQuery,
	params, neo4j.EagerResultTransformer,
    neo4j.ExecuteQueryWithDatabase("neo4j"))
	if err != nil {
	   log.Fatal(err)
	}

	// Loop through results and do something with them
	for _, record := range result.Records {
	    name, _ := record.Get("name")  // .Get() 2nd return is whether key is present
	    fmt.Println(name)
	    // or
	    // fmt.Println(record.AsMap())  // get Record as a map
	}

	// Summary information
	fmt.Printf("The query `%v` returned %v records in %+v.\n",
	    result.Summary.Query().Text(), len(result.Records),
	    result.Summary.ResultAvailableAfter())
}
//from go implementation both neo4j and memgraph use the neo4j driver so we can just use this function for both
func (p *TestClass) Api_post_request(REPLICA_URL string, api_request string, request_body map[string]any){
	// Marshal the request body to JSON
	jsonData, err := json.Marshal(request_body)

	if err != nil {
		log.Printf("Error marshaling JSON: %s", err)
		return
	}

	url := fmt.Sprintf("%s/api/%s", REPLICA_URL, api_request)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("HTTP POST request failed: %s", err)
		return
	}
	
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Reading response body failed: %s", err)
		return
	}

	log.Printf("Response: %s", string(body))
}

func (p *TestClass) Start_Provider(){
	cmd := exec.Command("docker","compose", "-f", "./Dockerfiles/docker-compose.provider.yml", "up","--build", "-d", "--force-recreate")
	cmd.Dir = "../.."
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
}

func (p *TestClass) Kill_Containers(){
	cmd := exec.Command("sudo","python3",  "Deployment.py", "down")
	cmd.Dir = ".."
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
}

func (p *TestClass) Concurrent_addVertex_addEdge() {
	//This is for testing what happens when there are concurrent updates in one replica

	p.Startup_containers()

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
	p.Api_post_request(REPLICA_2_URL, "addVertex", vertex1)
	fmt.Print("\n-----------------------Successfully added Vertex1----------------------------------\n")

	fmt.Print("\n-----------------------SConcurrently adding Vertex2 and edge between them----------------------------------\n")
	vertex2 := map[string]any{
 		"label": "ProductItem",
    	"properties":map[string]any{
        	"identifier": "Product2",
        	"name": "Laptop2",
        	"price": 999.99,
        	"inStock": true,
    	},
	}

	edge :=  map[string]any{
		"sourceLabel": "ProductItem",
    	"sourcePropName": "identifier",
    	"sourcePropValue": "Product1",
    	"targetLabel": "ProductItem",
    	"targetPropName": "identifier",
    	"targetPropValue": "Product2",
    	"relationType": "SAME_CATEGORY",
    	"properties": map[string]any{
    	    "identifier":"ProductEdge2",
    	    "relation":[]string{"recommendation"},
    	    },
	}
	go p.Api_post_request(REPLICA_2_URL, "addVertex", vertex2)
	p.Api_post_request(REPLICA_2_URL, "addEdge", edge)
}

func (p *TestClass) Different_properties_merge(){
	p.Startup_containers()
	REPLICA_1_URL := "http://localhost:3000"
	REPLICA_2_URL := "http://localhost:3001"
	vertex_r1 := map[string]any{
 		"label": "ProductItem",
    	"properties":map[string]any{
        	"identifier": "Product1",
        	"name": "Laptop2",
        	"price": 999.99,
        	"inStock": true,
    	},
	}
	vertex_r2 := map[string]any{
 		"label": "ProductItem",
    	"properties":map[string]any{
        	"identifier": "Product1",
        	"name": "Laptop2",
        	"price": 100,
        	"inStock": true,
    	},
	} 

	//send the vertices to different replicas
	p.Api_post_request(REPLICA_1_URL, "addVertex", vertex_r1)
	fmt.Print("\n-----------------------Successfully added Vertex to replica 1----------------------------------\n")
	p.Api_post_request(REPLICA_2_URL, "addVertex", vertex_r2)
	fmt.Print("\n-----------------------Successfully added Vertex to replica 2----------------------------------\n")
	//startup provider
	fmt.Print("\n-----------------------Starting provider----------------------------------\n")
	p.Start_Provider()
}