package router

import (
	"github.com/go-chi/chi/v5"

	"malaysian-radios-server/internal/api/handler"
	"malaysian-radios-server/internal/middleware"
)

// SetupRoutes registers all API endpoints onto the router
func SetupRoutes(r chi.Router) {
	// Public endpoint to generate token using CLIENT_SECRET
	r.Get("/api/token", middleware.GetTokenHandler)

	// Protected by token middleware
	r.Route("/api/stations", func(r chi.Router) {
		r.Use(middleware.TokenAuthMiddleware) // Applies to all routes in this group
		r.Get("/", handler.GetStationsHandler)       // Maps to GET /api/stations
		r.Get("/{id}", handler.GetStationByIDHandler) // Maps to GET /api/stations/{id}
	})
}
