package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"malaysian-radios-server/internal/crypto"
)

// TokenAuthMiddleware protects routes by requiring a valid token
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
