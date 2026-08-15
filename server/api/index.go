package api

import (
	"log"
	"net/http"
	"sync"

	"malaysian-radios-server/internal/config"
	"malaysian-radios-server/internal/database"
	"malaysian-radios-server/internal/api/router"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/rs/cors"
)

var (
	appHandler http.Handler
	once       sync.Once
)

// initApp initializes the database connection and HTTP router exactly once.
// This is essential for serverless environments like Vercel where the instance
// might be kept alive across multiple requests.
func initApp() {
	cfg := config.LoadConfig()

	// Connect to Turso
	if err := database.Connect(cfg.TursoDBUrl, cfg.TursoAuthToken); err != nil {
		log.Printf("Failed to connect to database: %v\n", err)
	}

	// Setup Router using Chi
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	
	router.SetupRoutes(r)

	// Setup CORS to allow the frontend to access the API
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"}, // Adjust in production if needed
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
	})

	appHandler = c.Handler(r)
}

// Handler is the main entry point for Vercel Serverless Functions.
// It lazily initializes the app on the first request and serves via the mux.
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(initApp)
	appHandler.ServeHTTP(w, r)
}
