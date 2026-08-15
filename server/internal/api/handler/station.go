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
	l := r.URL.Query().Get("limit")
	o := r.URL.Query().Get("offset")

	if l == "" || o == "" {
		http.Error(w, "Missing required query parameters", http.StatusBadRequest)
		return
	}

	limit, err := strconv.Atoi(l)
	if err != nil || limit < 0 {
		http.Error(w, "Invalid 'limit' parameter", http.StatusBadRequest)
		return
	}

	offset, err := strconv.Atoi(o)
	if err != nil || offset < 0 {
		http.Error(w, "Invalid 'offset' parameter", http.StatusBadRequest)
		return
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
