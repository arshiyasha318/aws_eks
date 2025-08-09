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

func setupDoctorRouter(db *gorm.DB) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	// Set up routes
	api := r.Group("/api/v1")
	{
		// Public routes
		api.GET("/doctors", v1.ListDoctors(db))
		api.GET("/doctors/:id", v1.GetDoctorProfile(db))

		// Protected routes
		protected := api.Group("")
		protected.Use(func(c *gin.Context) {
			// Mock authentication middleware
			c.Set("userID", uint(1))
			c.Next()
		})
		protected.GET("/doctors/dashboard", v1.GetDoctorDashboard(db))
		protected.POST("/doctors/schedules", v1.CreateSchedule(db))
	}

	return r
}

func TestListDoctors(t *testing.T) {
	db := testhelper.SetupTestDB(t)
	defer testhelper.CleanupTestDB(db)
	r := setupDoctorRouter(db)

	// Create test doctor
	user := &models.User{
		Name:     "Dr. Test Doctor",
		Email:    "doctor@example.com",
		Password: "testpassword",
		Role:     models.DoctorRole,
		Active:   true,
	}
	db.Create(user)

	doctor := &models.Doctor{
		UserID:          user.ID,
		Specialization:  "Cardiology",
		Qualification:   "MD, DM",
		Experience:      10,
		Bio:            "Senior Cardiologist",
		ConsultationFee: 1000,
		Available:       true,
	}
	db.Create(doctor)

	tests := []struct {
		name           string
		queryParams   string
		expectedStatus int
		expectDoctors bool
	}{
		{
			name:           "List all doctors",
			queryParams:   "",
			expectedStatus: http.StatusOK,
			expectDoctors: true,
		},
		{
			name:           "Filter by specialization",
			queryParams:   "?specialization=Cardiology",
			expectedStatus: http.StatusOK,
			expectDoctors: true,
		},
		{
			name:           "No matching specialization",
			queryParams:   "?specialization=Neurology",
			expectedStatus: http.StatusOK,
			expectDoctors: false,
		},
		{
			name:           "Search by name",
			queryParams:   "?name=Test",
			expectedStatus: http.StatusOK,
			expectDoctors: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", "/api/v1/doctors"+tt.queryParams, nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			if tt.expectDoctors {
				assert.NotEmpty(t, response["data"])
			} else {
				assert.Empty(t, response["data"])
			}
		})
	}
}

func TestGetDoctorProfile(t *testing.T) {
	db := testhelper.SetupTestDB(t)
	defer testhelper.CleanupTestDB(db)
	r := setupDoctorRouter(db)

	// Create test doctor
	user := &models.User{
		Name:     "Dr. Test Doctor",
		Email:    "doctor@example.com",
		Password: "testpassword",
		Role:     models.DoctorRole,
		Active:   true,
	}
	db.Create(user)

	doctor := &models.Doctor{
		UserID:          user.ID,
		Specialization:  "Cardiology",
		Qualification:   "MD, DM",
		Experience:      10,
		Bio:            "Senior Cardiologist",
		ConsultationFee: 1000,
		Available:       true,
	}
	db.Create(doctor)

	tests := []struct {
		name           string
		doctorID      string
		expectedStatus int
		shouldPass    bool
	}{
		{
			name:           "Valid doctor ID",
			doctorID:      "1",
			expectedStatus: http.StatusOK,
			shouldPass:    true,
		},
		{
			name:           "Non-existent doctor ID",
			doctorID:      "999",
			expectedStatus: http.StatusNotFound,
			shouldPass:    false,
		},
		{
			name:           "Invalid doctor ID",
			doctorID:      "invalid",
			expectedStatus: http.StatusNotFound,
			shouldPass:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", "/api/v1/doctors/"+tt.doctorID, nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.shouldPass {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Equal(t, float64(doctor.ID), response["id"])
				// Convert specialization to string for comparison since JSON unmarshals it as string
				assert.Equal(t, string(doctor.Specialization), response["specialization"])
			}
		})
	}
}

func TestGetDoctorDashboard(t *testing.T) {
	db := testhelper.SetupTestDB(t)
	defer testhelper.CleanupTestDB(db)
	r := setupDoctorRouter(db)

	// Create test data
	user := &models.User{
		Name:     "Dr. Test Doctor",
		Email:    "doctor@example.com",
		Password: "testpassword",
		Role:     models.DoctorRole,
		Active:   true,
	}
	db.Create(user)

	doctor := &models.Doctor{
		UserID:          user.ID,
		Specialization:  "Cardiology",
		Available:       true,
	}
	db.Create(doctor)

	// Create test patient
	patientUser := &models.User{
		Name:     "Test Patient",
		Email:    "patient@example.com",
		Password: "testpassword",
		Role:     models.PatientRole,
		Active:   true,
	}
	db.Create(patientUser)

	// Create test appointments
	today := time.Now()
	appointment1 := &models.Appointment{
		PatientID:       patientUser.ID,
		DoctorID:        doctor.ID,
		AppointmentDate: today.Add(2 * time.Hour),
		StartTime:       today.Add(2 * time.Hour),
		EndTime:         today.Add(3 * time.Hour),
		Status:          "scheduled",
	}
	db.Create(appointment1)

	appointment2 := &models.Appointment{
		PatientID:       patientUser.ID,
		DoctorID:        doctor.ID,
		AppointmentDate: today.Add(24 * time.Hour), // Tomorrow
		StartTime:       today.Add(24 * time.Hour),
		EndTime:         today.Add(25 * time.Hour),
		Status:          "scheduled",
	}
	db.Create(appointment2)

	t.Run("Get doctor dashboard", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/v1/doctors/dashboard", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.Equal(t, float64(doctor.ID), response["doctor_id"])
		assert.Equal(t, doctor.User.Name, response["name"])

		// Verify today's appointments
		todayAppointments, ok := response["today_appointments"].([]interface{})
		assert.True(t, ok)
		assert.GreaterOrEqual(t, len(todayAppointments), 0)

		// Verify upcoming appointments
		upcomingAppointments, ok := response["upcoming_appointments"].([]interface{})
		assert.True(t, ok)
		assert.GreaterOrEqual(t, len(upcomingAppointments), 1)
	})
}

func TestCreateSchedule(t *testing.T) {
	db := testhelper.SetupTestDB(t)
	defer testhelper.CleanupTestDB(db)
	r := setupDoctorRouter(db)

	// Create test doctor
	user := &models.User{
		Name:     "Dr. Test Doctor",
		Email:    "doctor@example.com",
		Password: "testpassword",
		Role:     models.DoctorRole,
		Active:   true,
	}
	db.Create(user)

	doctor := &models.Doctor{
		UserID:  user.ID,
		Available: true,
	}
	db.Create(doctor)

	tests := []struct {
		name           string
		payload        map[string]interface{}
		expectedStatus int
		shouldCreate   bool
	}{
		{
			name: "Valid schedule",
			payload: map[string]interface{}{
				"date":       time.Now().Add(24 * time.Hour).Format("2006-01-02"),
				"start_time": "09:00",
				"end_time":   "17:00",
			},
			expectedStatus: http.StatusCreated,
			shouldCreate:   true,
		},
		{
			name: "Invalid date format",
			payload: map[string]interface{}{
				"date":       "invalid-date",
				"start_time": "09:00",
				"end_time":   "17:00",
			},
			expectedStatus: http.StatusBadRequest,
			shouldCreate:   false,
		},
		{
			name: "Invalid time range",
			payload: map[string]interface{}{
				"date":       time.Now().Add(24 * time.Hour).Format("2006-01-02"),
				"start_time": "17:00",
				"end_time":   "09:00",
			},
			expectedStatus: http.StatusBadRequest,
			shouldCreate:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			jsonData, _ := json.Marshal(tt.payload)
			req, _ := http.NewRequest("POST", "/api/v1/doctors/schedules", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.shouldCreate {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Equal(t, "Schedule created successfully", response["message"])

				// Verify schedule was created in the database
				var count int64
				db.Model(&models.Schedule{}).Count(&count)
				assert.Greater(t, count, int64(0))
			}
		})
	}
}
