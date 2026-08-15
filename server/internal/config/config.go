package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	TursoDBUrl     string
	TursoAuthToken string
}

func LoadConfig() *Config {
	// We intentionally ignore the error.
	// In production (e.g. Vercel), .env won't exist because variables are injected directly into the environment.
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbUrl := os.Getenv("TURSO_DATABASE_URL")
	authToken := os.Getenv("TURSO_AUTH_TOKEN")

	if dbUrl == "" || authToken == "" {
		log.Println("Warning: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables must be set")
	}

	return &Config{
		Port:           port,
		TursoDBUrl:     dbUrl,
		TursoAuthToken: authToken,
	}
}
