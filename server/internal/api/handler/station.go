package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"malaysian-radios-server/internal/database"
)

// GetStationsHandler fetches stations from the DB and returns them as JSON
func GetStationsHandler(w http.ResponseWriter, r *http.Request) {
	// Pagination
	limit := 20
	offset := 0
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if parsedOffset, err := strconv.Atoi(o); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	stations, err := database.GetStations(limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch stations", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(stations); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

// GetStationByIDHandler fetches a single station by ID (protected by token middleware)
func GetStationByIDHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Missing station ID", http.StatusBadRequest)
		return
	}

	station, err := database.GetStationByID(id)
	if err != nil {
		http.Error(w, "Failed to fetch station", http.StatusInternalServerError)
		return
	}
	if station == nil {
		http.Error(w, "Station not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(station); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}
