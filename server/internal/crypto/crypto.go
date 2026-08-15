package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"os"
	"time"
)

// TokenPayload represents the data inside the encrypted token
type TokenPayload struct {
	Exp int64 `json:"exp"`
}

// getEncryptionKey derives a 32-byte key from CLIENT_SECRET + SERVER_SECRET
func getEncryptionKey() []byte {
	clientSecret := os.Getenv("CLIENT_SECRET")
	serverSecret := os.Getenv("SERVER_SECRET")
	hash := sha256.Sum256([]byte(clientSecret + serverSecret))
	return hash[:]
}

// GenerateToken creates an AES-GCM encrypted token expiring in 1 hour
func GenerateToken() (string, error) {
	payload := TokenPayload{
		Exp: time.Now().Add(1 * time.Hour).Unix(),
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	key := getEncryptionKey()
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := aesGCM.Seal(nonce, nonce, data, nil)
	return base64.URLEncoding.EncodeToString(ciphertext), nil
}

// VerifyToken decrypts and validates the token
func VerifyToken(tokenStr string) error {
	ciphertext, err := base64.URLEncoding.DecodeString(tokenStr)
	if err != nil {
		return err
	}

	key := getEncryptionKey()
	block, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return err
	}

	nonceSize := aesGCM.NonceSize()
	if len(ciphertext) < nonceSize {
		return errors.New("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return errors.New("invalid or tampered token")
	}

	var payload TokenPayload
	if err := json.Unmarshal(plaintext, &payload); err != nil {
		return err
	}

	if time.Now().Unix() > payload.Exp {
		return errors.New("token expired")
	}

	return nil
}
