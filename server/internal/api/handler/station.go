package handler

import (
	"encoding/json"
	"net/http"

	"malaysian-radios-server/internal/database"
)

// GetStationsHandler fetches stations from the DB and returns them as JSON
func GetStationsHandler(w http.ResponseWriter, r *http.Request) {
	stations, err := database.GetAllStations()
	if err != nil {
		http.Error(w, "Failed to fetch stations", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(stations); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}
