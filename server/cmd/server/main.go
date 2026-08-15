package main

import (
	"log"
	"net/http"

	"malaysian-radios-server/api"
	"malaysian-radios-server/internal/config"
)

func main() {
	// Load the config (port, etc.)
	cfg := config.LoadConfig()

	log.Printf("Local server starting on http://localhost:%s...\n", cfg.Port)

	err := http.ListenAndServe(":"+cfg.Port, http.HandlerFunc(api.Handler))
	if err != nil {
		log.Fatalf("Server failed to start: %v\n", err)
	}
}
