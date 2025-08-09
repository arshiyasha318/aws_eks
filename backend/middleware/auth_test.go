package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/golang-jwt/jwt/v5"
)

// Test claims structure for testing
type TestClaims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func setupRouter() *gin.Engine {
	r := gin.Default()
	// Use the same secret key as in the test
	r.Use(func(c *gin.Context) {
		c.Set("jwtSecret", "test-secret-key")
		c.Next()
	})
	r.Use(AuthMiddleware())

	r.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "protected"})
	})

	return r
}

func TestAuthMiddleware(t *testing.T) {
	// Set the JWT secret for testing
	secretKey := "test-secret-key"
	t.Setenv("JWT_SECRET", secretKey)

	testCases := []struct {
		name           string
		setupAuth     func(*http.Request)
		expectedStatus int
		debug         bool
	}{
		{
			name: "No Authorization header",
			setupAuth: func(req *http.Request) {
				// No auth header set
			},
			expectedStatus: http.StatusUnauthorized,
			debug:         false,
		},
		{
			name: "Invalid token format",
			setupAuth: func(req *http.Request) {
				req.Header.Set("Authorization", "Bearer")
			},
			expectedStatus: http.StatusUnauthorized,
			debug:         false,
		},
		{
			name: "Invalid token",
			setupAuth: func(req *http.Request) {
				req.Header.Set("Authorization", "Bearer invalid.token.here")
			},
			expectedStatus: http.StatusUnauthorized,
			debug:         false,
		},
		{
			name: "Valid token",
			setupAuth: func(req *http.Request) {
				token := jwt.NewWithClaims(jwt.SigningMethodHS256, &TestClaims{
					UserID: 1,
					Email:  "test@example.com",
					Role:   "patient",
					RegisteredClaims: jwt.RegisteredClaims{
						ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
					},
				})

				tokenString, err := token.SignedString([]byte(secretKey))
				if err != nil {
					t.Fatalf("Failed to generate token: %v", err)
				}

				req.Header.Set("Authorization", "Bearer "+tokenString)
			},
			expectedStatus: http.StatusOK,
			debug:         true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			r := setupRouter()

			req, _ := http.NewRequest("GET", "/protected", nil)
			tc.setupAuth(req)

			if tc.debug {
				t.Logf("Authorization header: %s", req.Header.Get("Authorization"))
			}

			w := httptest.NewRecorder()

			r.ServeHTTP(w, req)

			if tc.debug {
				t.Logf("Response status: %d", w.Code)
				t.Logf("Response body: %s", w.Body.String())
			}

			assert.Equal(t, tc.expectedStatus, w.Code)
		})
	}
}

func TestRoleMiddleware(t *testing.T) {
	testCases := []struct {
		name           string
		allowedRoles  []string
		userRole      string
		setupAuth     func(*http.Request, string)
		expectedStatus int
	}{
		{
			name:          "Role allowed",
			allowedRoles:  []string{"admin", "doctor"},
			userRole:      "doctor",
			setupAuth:     setupAuth,
			expectedStatus: http.StatusOK,
		},
		{
			name:          "Role not allowed",
			allowedRoles:  []string{"admin"},
			userRole:      "patient",
			setupAuth:     setupAuth,
			expectedStatus: http.StatusForbidden,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			r := gin.Default()
			r.Use(func(c *gin.Context) {
				c.Set("userRole", tc.userRole)
				c.Next()
			})
			r.Use(RoleMiddleware(tc.allowedRoles...))

			r.GET("/role-protected", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "role protected"})
			})

			req, _ := http.NewRequest("GET", "/role-protected", nil)
			tc.setupAuth(req, tc.userRole)

			w := httptest.NewRecorder()

			r.ServeHTTP(w, req)


			assert.Equal(t, tc.expectedStatus, w.Code)
		})
	}
}

func setupAuth(request *http.Request, role string) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &TestClaims{
		UserID: 1,
		Email:  "test@example.com",
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	})

	tokenString, err := token.SignedString([]byte("test-secret-key"))
	if err != nil {
		panic(err) // Should not happen in tests
	}

	request.Header.Set("Authorization", "Bearer "+tokenString)
}
