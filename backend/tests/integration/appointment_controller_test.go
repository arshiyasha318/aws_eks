package integration_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"

	"github.com/sandipdas/go-doctor-booking/backend/api/v1"
	"github.com/sandipdas/go-doctor-booking/backend/models"
	"github.com/sandipdas/go-doctor-booking/backend/tests/testhelper"
)

func setupAppointmentRouter(t *testing.T, db *gorm.DB, doctorUserID uint) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	// Setup routes that require authentication
	authGroup := r.Group("/api/v1")
	authGroup.Use(func(c *gin.Context) {
		// Always use the provided doctor's user ID
		c.Set("userID", doctorUserID)
		c.Next()
	})

	// Doctor endpoints
	doctorGroup := authGroup.Group("/doctors")
	{
		// Add a route that gets the current doctor's appointments
		doctorGroup.GET("/me/appointments", v1.GetDoctorAppointments(db))
		doctorGroup.GET("/:id/appointments", v1.GetDoctorAppointments(db))
		doctorGroup.PUT("/appointments/:id/status", v1.UpdateAppointmentStatus(db))
	}

	// Patient endpoints
	patientGroup := authGroup.Group("/patients")
	{
		patientGroup.GET("/appointments", v1.GetPatientAppointments(db))
		patientGroup.POST("/appointments", v1.BookAppointment(db))
		patientGroup.DELETE("/appointments/:id", v1.CancelAppointment(db))
	}

	// Public endpoints
	publicGroup := r.Group("/api/v1")
	{
		publicGroup.GET("/doctors/:id/availability", v1.GetDoctorAvailability(db))
	}

	// Admin endpoints
	adminGroup := authGroup.Group("/admin")
	{
		adminGroup.GET("/appointments", v1.ListAllAppointments(db))
	}

	return r
}

func createTestDoctor(t *testing.T, db *gorm.DB, email string) *models.Doctor {
	user, err := testhelper.CreateTestUser(db, "Test Doctor", email, "password123", models.DoctorRole)
	if err != nil {
		t.Fatalf("Failed to create test doctor: %v", err)
	}

	doctor := &models.Doctor{
		UserID:        user.ID,
		Specialization: "Cardiology",
	}
	if err := db.Create(doctor).Error; err != nil {
		t.Fatalf("Failed to create doctor: %v", err)
	}
	return doctor
}

func createTestPatient(t *testing.T, db *gorm.DB, email string) *models.User {
	user, err := testhelper.CreateTestUser(db, "Test Patient", email, "password123", models.PatientRole)
	if err != nil {
		t.Fatalf("Failed to create test patient: %v", err)
	}
	return user
}

func TestGetDoctorAppointments(t *testing.T) {
	db := testhelper.SetupTestDB(t)
	defer testhelper.CleanupTestDB(db)

	// Create test data
	patient := createTestPatient(t, db, "patient@example.com")
	doctor := createTestDoctor(t, db, "doctor@example.com")
	
	// Debug: Print the created doctor
	t.Logf("Created doctor - ID: %d, UserID: %d, Email: %s", doctor.ID, doctor.UserID, "doctor@example.com")
	
	// Create router with the doctor's user ID
	r := setupAppointmentRouter(t, db, doctor.UserID)

	// Create test appointments
	appointments := []models.Appointment{
		{
			PatientID:       patient.ID,
			DoctorID:        doctor.ID, // Use doctor.ID instead of doctor.UserID
			AppointmentDate: time.Now().Add(24 * time.Hour),
			StartTime:       time.Now().Add(24 * time.Hour),
			EndTime:         time.Now().Add(25 * time.Hour),
			Status:          "scheduled",
		},
		{
			PatientID:       patient.ID,
			DoctorID:        doctor.ID, // Use doctor.ID instead of doctor.UserID
			AppointmentDate: time.Now().Add(48 * time.Hour),
			StartTime:       time.Now().Add(48 * time.Hour),
			EndTime:         time.Now().Add(49 * time.Hour),
			Status:          "scheduled",
		},
	}
	for i := range appointments {
		if err := db.Create(&appointments[i]).Error; err != nil {
			t.Fatalf("Failed to create appointment: %v", err)
		}
	}

	tests := []struct {
		name           string
		url            string
		statusCode     int
		expectedLength int
	}{
		{
			name:           "Get all appointments",
			url:            "/api/v1/doctors/me/appointments",
			statusCode:     http.StatusOK,
			expectedLength: 2,
		},
		{
			name:           "Filter by status",
			url:            "/api/v1/doctors/me/appointments?status=scheduled",
			statusCode:     http.StatusOK,
			expectedLength: 2,
		},
		{
			name:           "Filter by date range",
			url:            "/api/v1/doctors/me/appointments?start_date=" + time.Now().Format("2006-01-02") + "&end_date=" + time.Now().Add(48*time.Hour).Format("2006-01-02"),
			statusCode:     http.StatusOK,
			expectedLength: 2,
		},
	}

	// Router is already set up with the doctor's user ID

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest(http.MethodGet, tt.url, nil)
			w := httptest.NewRecorder()

			// No need to set user ID in context as it's set by the router middleware

			r.ServeHTTP(w, req)

			assert.Equal(t, tt.statusCode, w.Code, "Unexpected status code")

			if w.Code == http.StatusOK {
				var response []models.Appointment
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err, "Failed to unmarshal response")
				assert.GreaterOrEqual(t, len(response), tt.expectedLength, "Unexpected number of appointments")
			}
		})
	}
}

func TestBookAppointment(t *testing.T) {
	db := testhelper.SetupTestDB(t)
	defer testhelper.CleanupTestDB(db)

	// Create test data
	patient := createTestPatient(t, db, "patient@example.com")
	doctor := createTestDoctor(t, db, "doctor@example.com")
	
	// Create router with the doctor's user ID
	r := setupAppointmentRouter(t, db, doctor.UserID)
	_ = patient // Use the patient variable to avoid unused variable error

	tests := []struct {
		name       string
		payload    map[string]interface{}
		statusCode int
		contains   string
	}{
		{
			name: "Valid appointment",
			payload: map[string]interface{}{
				"doctor_id":    1,
				"scheduled_at": time.Now().Add(24 * time.Hour).Format(time.RFC3339),
				"notes":        "Test appointment",
			},
			statusCode: http.StatusCreated,
			contains:   "Test appointment",
		},
		{
			name: "Missing required fields",
			payload: map[string]interface{}{
				"notes": "Test appointment",
			},
			statusCode: http.StatusBadRequest,
		},
		{
			name: "Invalid doctor ID",
			payload: map[string]interface{}{
				"doctor_id":    999,
				"scheduled_at": time.Now().Add(24 * time.Hour).Format(time.RFC3339),
			},
			statusCode: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			jsonData, _ := json.Marshal(tt.payload)
			req, _ := http.NewRequest("POST", "/api/v1/patients/appointments", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			assert.Equal(t, tt.statusCode, w.Code)

			if tt.contains != "" {
				assert.Contains(t, w.Body.String(), tt.contains)
			}
		})
	}
}
