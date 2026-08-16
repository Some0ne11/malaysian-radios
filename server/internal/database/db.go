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

// GetStations fetches a paginated list of radio stations from the database
func GetStations(limit, offset int) ([]Station, error) {
	if DB == nil {
		return nil, fmt.Errorf("database connection is not initialized")
	}

	query := `SELECT id, name, category_id, stream_url, logo_url, status, clear_keys, subscription_type 
			  FROM stations 
			  LIMIT ? OFFSET ?`
	rows, err := DB.Query(query, limit, offset)
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

	if stations == nil {
		stations = []Station{}
	}

	return stations, nil
}

// GetStationByID fetches a single radio station by its ID
func GetStationByID(id string) (*Station, error) {
	if DB == nil {
		return nil, fmt.Errorf("database connection is not initialized")
	}

	query := `SELECT id, name, category_id, stream_url, logo_url, status, clear_keys, subscription_type 
			  FROM stations 
			  WHERE id = ?`
	row := DB.QueryRow(query, id)

	var s Station
	err := row.Scan(
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
		if err == sql.ErrNoRows {
			return nil, nil // Not found
		}
		return nil, err
	}

	return &s, nil
}

// BlockToken inserts a token into the blocked_tokens table
func BlockToken(token string, reason string) error {
	if DB == nil {
		return fmt.Errorf("database connection is not initialized")
	}

	query := `INSERT INTO blocked_tokens (token, reason) VALUES (?, ?) ON CONFLICT(token) DO NOTHING`
	_, err := DB.Exec(query, token, reason)
	return err
}

// LoadBlockedTokens fetches all blocked tokens to populate the in-memory cache
func LoadBlockedTokens() (map[string]bool, error) {
	if DB == nil {
		return nil, fmt.Errorf("database connection is not initialized")
	}

	query := `SELECT token FROM blocked_tokens`
	rows, err := DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	blocked := make(map[string]bool)
	for rows.Next() {
		var token string
		if err := rows.Scan(&token); err != nil {
			log.Printf("Error scanning blocked token: %v\n", err)
			continue
		}
		blocked[token] = true
	}

	return blocked, rows.Err()
}
