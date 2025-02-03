package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"strings"

	"github.com/FrancisTCE/server/service"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware checks for the Bearer token in the Authorization header and adds a CSP header with a nonce
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")

		fmt.Println("RECEIVED REQUEST WITH HEADER: " + authHeader)

		// Check if the header is provided and starts with "Bearer "
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header not provided or malformed"})
			c.Abort() // Stop the request
			return
		}

		// Extract the token from the header
		token := strings.TrimPrefix(authHeader, "Bearer ")

		// Validate the token
		if !isValidToken(token) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort() // Stop the request
			return
		}

		// Generate a nonce for this request
		nonce := generateNonce()

		// Set the Content Security Policy header with the nonce
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'nonce-"+nonce+"';")

		// Make the nonce available to handlers and templates if needed
		c.Set("nonce", nonce)

		// Proceed with the request
		c.Next()
	}
}

// generateNonce creates a unique nonce for each request
func generateNonce() string {
	nonce := make([]byte, 16)
	_, err := rand.Read(nonce)
	if err != nil {
		return ""
	}
	return base64.StdEncoding.EncodeToString(nonce)
}

// isValidToken checks if the token is valid (you can replace this with your actual validation logic)
func isValidToken(token string) bool {
	// Check against your session store, or any other validation logic
	for _, t := range service.SESSION_TOKENS {
		if token == t {
			return true
		}
	}
	return false
}
