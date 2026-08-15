package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/tursodatabase/libsql-client-go/libsql"
)

// Station matches the schema in database.sql
type Station struct {
	ID               string  `json:"id"`
	Name             string  `json:"name"`
	CategoryID       *string `json:"category_id"`
	StreamURL        string  `json:"stream_url"`
	LogoURL          *string `json:"logo_url"`
	Status           string  `json:"status"`
	ClearKeys        *string `json:"clear_keys"`
	SubscriptionType string  `json:"subscription_type"`
}

var DB *sql.DB

// Connect establishes a connection to the Turso database
func Connect(dbUrl, authToken string) error {
	if dbUrl == "" || authToken == "" {
		return fmt.Errorf("missing turso credentials")
	}

	connStr := fmt.Sprintf("%s?authToken=%s", dbUrl, authToken)
	db, err := sql.Open("libsql", connStr)
	if err != nil {
		return err
	}

	if err := db.Ping(); err != nil {
		return err
	}

	DB = db
	log.Println("Successfully connected to Turso database")
	return nil
}

// GetAllStations fetches all radio stations from the database
func GetAllStations() ([]Station, error) {
	if DB == nil {
		return nil, fmt.Errorf("database connection is not initialized")
	}

	query := `SELECT id, name, category_id, stream_url, logo_url, status, clear_keys, subscription_type FROM stations`
	rows, err := DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stations []Station
	for rows.Next() {
		var s Station
		err := rows.Scan(
			&s.ID,
			&s.Name,
			&s.CategoryID,
			&s.StreamURL,
			&s.LogoURL,
			&s.Status,
			&s.ClearKeys,
			&s.SubscriptionType,
		)
		if err != nil {
			log.Printf("Error scanning station row: %v\n", err)
			continue
		}
		stations = append(stations, s)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Ensure we return an empty array instead of null in JSON if no stations exist
	if stations == nil {
		stations = []Station{}
	}

	return stations, nil
}
