package integration_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/sandipdas/go-doctor-booking/backend/api/v1"
	"github.com/sandipdas/go-doctor-booking/backend/middleware"
	"github.com/sandipdas/go-doctor-booking/backend/models"
	"github.com/sandipdas/go-doctor-booking/backend/tests/testhelper"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

func setupAuthRouter(db *gorm.DB) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	// Setup routes
	api := r.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", v1.RegisterUser(db))
			auth.POST("/login", v1.LoginUser(db))
		}

		// Protected route for testing
		api.GET("/protected", middleware.AuthMiddleware(), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "protected"})
		})
	}

	return r
}

func TestRegisterUser(t *testing.T) {
	// Setup
	db := testhelper.SetupTestDB(t)
	defer testhelper.CleanupTestDB(db)
	r := setupAuthRouter(db)

	// Create a user for duplicate email test
	_, err := testhelper.CreateTestUser(db, "Existing User", "test-existing@example.com", "password123", "patient")
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	tests := []struct {
		name           string
		payload        map[string]interface{}
		expectedStatus int
		expectToken   bool
	}{
		{
			name: "Valid registration - patient",
			payload: map[string]interface{}{
				"name":     "Test Patient",
				"email":    "patient@example.com",
				"password": "password123",
				"role":     "patient",
			},
			expectedStatus: http.StatusCreated,
			expectToken:   true,
		},
		{
			name: "Valid registration - doctor",
			payload: map[string]interface{}{
				"name":             "Test Doctor",
				"email":            "doctor@example.com",
				"password":         "password123",
				"role":            "doctor",
				"specialization":   "cardiology",
				"qualification":    "MD, Cardiology",
				"experience":       5,
				"bio":             "Experienced cardiologist",
				"consultation_fee": 100.00,
			},
			expectedStatus: http.StatusCreated,
			expectToken:   true,
		},
		{
			name: "Duplicate email",
			payload: map[string]interface{}{
				"name":     "Test User",
				"email":    "test-existing@example.com",
				"password": "password123",
				"role":     "patient",
			},
			expectedStatus: http.StatusBadRequest,
			expectToken:   false,
		},
		{
			name: "Invalid role",
			payload: map[string]interface{}{
				"name":     "Test User",
				"email":    "invalid-role@example.com",
				"password": "password123",
				"role":     "invalid-role",
			},
			expectedStatus: http.StatusBadRequest,
			expectToken:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Convert payload to JSON
			jsonData, err := json.Marshal(tt.payload)
			if err != nil {
				t.Fatalf("Failed to marshal payload: %v", err)
			}

			req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			// Parse response
			var response map[string]interface{}
			json.Unmarshal(w.Body.Bytes(), &response)

			if tt.expectToken {
				assert.NotEmpty(t, response["token"])
				assert.NotEmpty(t, response["user"])

				userData := response["user"].(map[string]interface{})
				assert.Equal(t, tt.payload["email"], userData["email"])
				assert.Equal(t, tt.payload["name"], userData["name"])
				assert.Equal(t, tt.payload["role"], userData["role"])
			}
		})
	}
}

func TestLoginUser(t *testing.T) {
	// Setup
	db := testhelper.SetupTestDB(t)
	defer testhelper.CleanupTestDB(db)
	r := setupAuthRouter(db)

	// Create test user with hashed password
	testPassword := "testpassword123"
	user, err := testhelper.CreateTestUser(db, "Test User", "login@example.com", testPassword, models.PatientRole)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Ensure user is active
	user.Active = true
	if err := db.Save(user).Error; err != nil {
		t.Fatalf("Failed to activate test user: %v", err)
	}

	// Log the created user for debugging
	var dbUser models.User
	if err := db.First(&dbUser, user.ID).Error; err != nil {
		t.Fatalf("Failed to fetch test user from DB: %v", err)
	}
	t.Logf("Created test user in DB: ID=%d, Email=%s, Active=%v, PasswordHash=%s", 
		dbUser.ID, dbUser.Email, dbUser.Active, dbUser.Password)

	tests := []struct {
		name           string
		payload        map[string]string
		expectedStatus int
		expectToken   bool
	}{
		{
			name: "Valid login",
			payload: map[string]string{
				"email":    "login@example.com",
				"password": testPassword,
			},
			expectedStatus: http.StatusOK,
			expectToken:   true,
		},
		{
			name: "Invalid password",
			payload: map[string]string{
				"email":    "login@example.com",
				"password": "wrongpassword",
			},
			expectedStatus: http.StatusUnauthorized,
			expectToken:   false,
		},
		{
			name: "Non-existent user",
			payload: map[string]string{
				"email":    "nonexistent@example.com",
				"password": "password123",
			},
			expectedStatus: http.StatusUnauthorized,
			expectToken:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Convert payload to JSON
			jsonData, err := json.Marshal(tt.payload)
			if err != nil {
				t.Fatalf("Failed to marshal payload: %v", err)
			}

			// Log the request payload
			t.Logf("Sending login request: %s", string(jsonData))

			req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			t.Logf("Response status: %d", w.Code)
			t.Logf("Response body: %s", w.Body.String())

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			// Always parse the response for debugging
			var response map[string]interface{}
			if w.Body.Len() > 0 {
				t.Logf("Response body: %s", w.Body.String())
				if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
					t.Logf("Failed to parse response: %v", err)
				}
			}

			// Check if we expected a successful login
			if tt.expectToken {
				if w.Code != http.StatusOK {
					// Log detailed error information for debugging
					t.Logf("Expected status code %d but got %d", http.StatusOK, w.Code)
					if errorMsg, ok := response["error"]; ok {
						t.Logf("Error message: %v", errorMsg)
					}
				}
				assert.Equal(t, http.StatusOK, w.Code, "Expected successful login status code")

				// Check token and user data in response
				if w.Code == http.StatusOK {
					assert.NotEmpty(t, response["token"], "Token should not be empty")
					assert.NotEmpty(t, response["user"], "User data should not be empty")

					// Verify user data in the response
					if userData, ok := response["user"].(map[string]interface{}); ok {
						assert.Equal(t, tt.payload["email"], userData["email"], "Email should match")
					} else {
						t.Error("User data is not in expected format")
					}
				}
			} else {
				// For failed login attempts, just log the response
				t.Logf("Login failed as expected with status: %d", w.Code)
			}
		})
	}
}

func TestAuthMiddleware(t *testing.T) {
	// Set JWT secret for testing
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	db := testhelper.SetupTestDB(t)
	defer testhelper.CleanupTestDB(db)
	r := setupAuthRouter(db)

	tests := []struct {
		name           string
		setupAuth     func(*http.Request)
		expectedStatus int
	}{
		{
			name: "No token",
			setupAuth: func(req *http.Request) {
				// No auth header
			},
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name: "Invalid token",
			setupAuth: func(req *http.Request) {
				req.Header.Set("Authorization", "Bearer invalid-token")
			},
			expectedStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", "/api/v1/protected", nil)
			tt.setupAuth(req)

			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			t.Logf("Response status: %d", w.Code)
			t.Logf("Response body: %s", w.Body.String())

			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}
