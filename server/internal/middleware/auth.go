package middleware

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"malaysian-radios-server/internal/crypto"
	"malaysian-radios-server/internal/database"
)

var (
	blockedTokensCache = make(map[string]bool)
	cacheMutex         sync.RWMutex

	// rate limit tracking
	tokenRates = make(map[string][]time.Time)
	rateMutex  sync.Mutex
)

// InitBlockedTokensCache loads the blocked tokens from the database into memory
func InitBlockedTokensCache() {
	blocked, err := database.LoadBlockedTokens()
	if err != nil {
		log.Printf("Warning: Failed to load blocked tokens: %v", err)
		return
	}
	cacheMutex.Lock()
	blockedTokensCache = blocked
	cacheMutex.Unlock()
	log.Printf("Loaded %d blocked tokens into cache", len(blocked))
}

func isTokenBlocked(token string) bool {
	cacheMutex.RLock()
	defer cacheMutex.RUnlock()
	return blockedTokensCache[token]
}

func banToken(token string) {
	err := database.BlockToken(token, "Spam detected (>3 requests per second)")
	if err != nil {
		log.Printf("Failed to insert blocked token to DB: %v", err)
	} else {
		log.Printf("Successfully permanently banned token: %s", token)
	}

	cacheMutex.Lock()
	blockedTokensCache[token] = true
	cacheMutex.Unlock()
}

func isSpamming(token string) bool {
	rateMutex.Lock()
	defer rateMutex.Unlock()

	now := time.Now()
	var active []time.Time

	for _, t := range tokenRates[token] {
		if now.Sub(t) <= time.Second {
			active = append(active, t)
		}
	}

	active = append(active, now)
	tokenRates[token] = active

	return len(active) > 3
}

// TokenAuthMiddleware protects routes by requiring a valid token and enforces rate limits
func TokenAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.URL.Query().Get("token")
		if token == "" {
			// Try Authorization header
			authHeader := r.Header.Get("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") {
				token = strings.TrimPrefix(authHeader, "Bearer ")
			}
		}

		if token == "" {
			http.Error(w, "Unauthorized: missing token", http.StatusUnauthorized)
			return
		}

		if err := crypto.VerifyToken(token); err != nil {
			http.Error(w, fmt.Sprintf("Unauthorized: %v", err), http.StatusUnauthorized)
			return
		}

		// 1. Check if token is permanently banned
		if isTokenBlocked(token) {
			http.Error(w, "Forbidden: token is permanently banned", http.StatusForbidden)
			return
		}

		// 2. Check if token is spamming
		if isSpamming(token) {
			banToken(token)
			http.Error(w, "Forbidden: token is permanently banned for spamming", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// GetTokenHandler validates the client secret and returns an encrypted token
func GetTokenHandler(w http.ResponseWriter, r *http.Request) {
	clientSecret := r.URL.Query().Get("hmac")
	if clientSecret == "" {
		clientSecret = r.Header.Get("X-Client-Secret")
	}
	if clientSecret != os.Getenv("CLIENT_SECRET") {
		http.Error(w, "Unauthorized client secret", http.StatusUnauthorized)
		return
	}

	token, err := crypto.GenerateToken()
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": token})
}
