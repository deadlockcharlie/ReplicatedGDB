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
)

type TestClass struct {
	CONFIG map[string]any

}
func (p *TestClass) Startup_containers(){

	configJSON, err := json.Marshal(p.CONFIG)
	if err != nil {
		log.Fatalf("failed to encode CONFIG as JSON: %v", err)
	}

	fmt.Print("Reading from provided json config")

	cmd := exec.Command("sudo", "python3", "Deployment.py", "up", "--config-json", string(configJSON))
	cmd.Dir = ".."
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
}

func (p *TestClass) Neo4j_query(){
}

func (p *TestClass) Memgraph_query(){
}

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
	cmd.Dir = ".."
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
}

	
