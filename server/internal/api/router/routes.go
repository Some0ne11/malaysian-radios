package router

import (
	"github.com/go-chi/chi/v5"

	"malaysian-radios-server/internal/api/handler"
)

// SetupRoutes registers all API endpoints onto the router
func SetupRoutes(r chi.Router) {
	r.Get("/api/stations", handler.GetStationsHandler)
}
