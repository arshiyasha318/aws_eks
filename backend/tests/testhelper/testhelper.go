package testhelper

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/sandipdas/go-doctor-booking/backend/config"
	"github.com/sandipdas/go-doctor-booking/backend/models"
	"gorm.io/gorm"
)

type TestUser struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
	Token string `json:"token"`
}

func SetupTestRouter(db *gorm.DB) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	// Initialize routes
	api := r.Group("/api/v1")
	SetupTestRoutes(api, db)

	return r
}

func CreateTestUser(db *gorm.DB, name, email, password string, role models.UserRole) (*models.User, error) {
	user := &models.User{
		Name:     name,
		Email:    email,
		Password: password, // The password will be hashed by the BeforeCreate hook
		Role:     role,
		Active:   true,
	}

	if err := db.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

func LoginTestUser(t *testing.T, router *gin.Engine, email, password string) string {
	loginData := map[string]string{
		"email":    email,
		"password": password,
	}
	jsonData, _ := json.Marshal(loginData)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status code %d, got %d", http.StatusOK, w.Code)
	}

	var response struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse login response: %v", err)
	}

	return response.Token
}

func SetupTestDB(t *testing.T) *gorm.DB {
	// Load test configuration
	config.LoadEnv()

	// Initialize test database
	db, err := config.InitializeDB()
	if err != nil {
		t.Fatalf("Failed to initialize test database: %v", err)
	}

	// Migrate models
	err = db.AutoMigrate(
		&models.User{},
		&models.Doctor{},
		&models.Schedule{},
		&models.Appointment{},
	)
	if err != nil {
		t.Fatalf("Failed to migrate test database: %v", err)
	}

	return db
}

func CleanupTestDB(db *gorm.DB) {
	db.Exec("DROP SCHEMA public CASCADE")
	db.Exec("CREATE SCHEMA public")
}
