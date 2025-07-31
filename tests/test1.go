package main

import "os"
import "os/exec"
import "log"

func main() {
	
	cmd := exec.Command("sudo", "python3", "Deployment.py", "up")
	cmd.Dir = ".."
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
}
