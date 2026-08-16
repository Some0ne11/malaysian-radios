package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"time"

	"malaysian-radios-server/internal/config"
	"malaysian-radios-server/internal/crypto"
)

func main() {
	// Load environment variables (CLIENT_SECRET, SERVER_SECRET)
	config.LoadConfig()

	if len(os.Args) < 2 {
		fmt.Println("Malaysian Radios - Token CLI Utility")
		fmt.Println("Usage:")
		fmt.Println("  go run cmd/token/main.go generate")
		fmt.Println("  go run cmd/token/main.go verify <token>")
		os.Exit(1)
	}

	command := os.Args[1]

	clientSecret := os.Getenv("CLIENT_SECRET")
	serverSecret := os.Getenv("SERVER_SECRET")
	hash := sha256.Sum256([]byte(clientSecret + serverSecret))
	key := hash[:]

	switch command {
	case "generate":
		// Do the generation locally so we can print the breakdown
		payload := crypto.TokenPayload{
			Exp: time.Now().Add(1 * time.Hour).Unix(),
		}

		data, err := json.Marshal(payload)
		if err != nil {
			fmt.Println("Error marshalling payload:", err)
			os.Exit(1)
		}

		block, err := aes.NewCipher(key)
		if err != nil {
			fmt.Println("Error creating cipher:", err)
			os.Exit(1)
		}

		aesGCM, err := cipher.NewGCM(block)
		if err != nil {
			fmt.Println("Error creating GCM:", err)
			os.Exit(1)
		}

		nonce := make([]byte, aesGCM.NonceSize())
		if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
			fmt.Println("Error reading random nonce:", err)
			os.Exit(1)
		}

		fmt.Println("--- GENERATION BREAKDOWN ---")
		fmt.Println("1. Raw JSON Payload:    ", string(data))
		fmt.Printf("2. Random Nonce (Hex):   %x\n", nonce)
		
		ciphertext := aesGCM.Seal(nil, nonce, data, nil)
		fmt.Printf("3. Encrypted Payload:    %x\n", ciphertext)

		// Stitching nonce and ciphertext
		stitched := append(nonce, ciphertext...)
		fmt.Printf("4. Stitched Bytes:       %x\n", stitched)

		finalToken := base64.URLEncoding.EncodeToString(stitched)
		fmt.Println("\n✨ Final Base64 Token:")
		fmt.Println(finalToken)
		
	case "verify":
		if len(os.Args) < 3 {
			fmt.Println("Please provide a token to verify.")
			os.Exit(1)
		}
		token := os.Args[2]
		
		fmt.Println("--- DECRYPTION BREAKDOWN ---")
		ciphertext, err := base64.URLEncoding.DecodeString(token)
		if err != nil {
			fmt.Println("❌ Error decoding base64:", err)
			os.Exit(1)
		}
		fmt.Printf("1. Original Stitched:    %x\n", ciphertext)

		block, err := aes.NewCipher(key)
		if err != nil {
			fmt.Println("❌ Error creating cipher:", err)
			os.Exit(1)
		}

		aesGCM, err := cipher.NewGCM(block)
		if err != nil {
			fmt.Println("❌ Error creating GCM:", err)
			os.Exit(1)
		}

		nonceSize := aesGCM.NonceSize()
		if len(ciphertext) < nonceSize {
			fmt.Println("❌ Error: Ciphertext too short")
			os.Exit(1)
		}

		nonce, actualCiphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
		fmt.Printf("2. Sliced Nonce:         %x\n", nonce)
		fmt.Printf("3. Sliced Ciphertext:    %x\n", actualCiphertext)

		plaintext, err := aesGCM.Open(nil, nonce, actualCiphertext, nil)
		if err != nil {
			fmt.Println("❌ Error decrypting:", err)
			os.Exit(1)
		}
		fmt.Println("4. Decrypted Payload:   ", string(plaintext))

		var payload crypto.TokenPayload
		if err := json.Unmarshal(plaintext, &payload); err == nil {
			t := time.Unix(payload.Exp, 0)
			fmt.Println("5. Readable Expiration: ", t.Format(time.RFC1123))
			
			fmt.Println("\n--- FINAL VERIFICATION ---")
			if time.Now().Unix() > payload.Exp {
				fmt.Println("❌ Token is EXPIRED.")
			} else {
				fmt.Println("✅ Token is VALID!")
			}
		} else {
			fmt.Println("❌ Failed to parse JSON:", err)
		}
		
	default:
		fmt.Println("Unknown command:", command)
	}
}
