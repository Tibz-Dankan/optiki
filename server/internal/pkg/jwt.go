package pkg

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// SignJWTToken signs a JWT for userID that expires at expiresAt; the random jti keeps two tokens issued in the same second distinct
func SignJWTToken(userID string, expiresAt time.Time) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userID": userID,
		"exp":    expiresAt.Unix(),
		"iat":    time.Now().Unix(),
		"jti":    uuid.New().String(),
	})

	signedToken, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return "", fmt.Errorf("failed to sign JWT token: %v", err)
	}

	return signedToken, nil
}

// DecodeJWT verifies the signature and expiry of a JWT and returns its userID
func DecodeJWT(signedToken string) (string, error) {
	token, err := jwt.Parse(signedToken, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	if err != nil {
		return "", err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", errors.New("invalid token")
	}

	userID, ok := claims["userID"].(string)
	if !ok || userID == "" {
		return "", errors.New("invalid token payload")
	}

	return userID, nil
}
