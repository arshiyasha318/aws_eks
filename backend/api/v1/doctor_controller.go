package v1

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sandipdas/go-doctor-booking/backend/models"
	"gorm.io/gorm"
)

// ListDoctors returns a list of all doctors with optional filters
func ListDoctors(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var doctors []models.Doctor
		query := db.Model(&models.Doctor{}).Preload("User").Where("available = ?", true)

		// Apply filters
		if specialization := c.Query("specialization"); specialization != "" {
			query = query.Where("specialization = ?", specialization)
		}

		if name := c.Query("name"); name != "" {
			query = query.Joins("JOIN users ON users.id = doctors.user_id AND users.name ILIKE ?", "%"+name+"%")
		}

		// Pagination
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		offset := (page - 1) * limit

		var total int64
		query.Count(&total)

		query = query.Offset(offset).Limit(limit)


		if err := query.Find(&doctors).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch doctors"})
			return
		}

		// Prepare response
		type DoctorResponse struct {
			ID              uint    `json:"id"`
			Name            string  `json:"name"`
			Specialization  string  `json:"specialization"`
			Qualification   string  `json:"qualification"`
			Experience      int     `json:"experience"`
			Bio             string  `json:"bio"`
			ConsultationFee float64 `json:"consultation_fee"`
		}

		var response []DoctorResponse
		for _, d := range doctors {
			response = append(response, DoctorResponse{
				ID:              d.ID,
				Name:            d.User.Name,
				Specialization:  string(d.Specialization),
				Qualification:   d.Qualification,
				Experience:      d.Experience,
				Bio:             d.Bio,
				ConsultationFee: d.ConsultationFee,
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"data":  response,
			"total": total,
			"page":  page,
			"limit": limit,
		})
	}
}

// GetDoctorProfile returns a doctor's profile by ID
func GetDoctorProfile(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var doctor models.Doctor

		if err := db.Preload("User").First(&doctor, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"id":               doctor.ID,
			"name":             doctor.User.Name,
			"email":            doctor.User.Email,
			"specialization":   doctor.Specialization,
			"qualification":    doctor.Qualification,
			"experience":       doctor.Experience,
			"bio":              doctor.Bio,
			"consultation_fee": doctor.ConsultationFee,
		})
	}
}

// GetDoctorDashboard returns doctor's dashboard data
func GetDoctorDashboard(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")

		var doctor models.Doctor
		if err := db.Where("user_id = ?", userID).First(&doctor).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Doctor profile not found"})
			return
		}

		// Get today's appointments
		var todayAppointments []models.Appointment
		today := time.Now().Format("2006-01-02")
		if err := db.Preload("Patient").
			Where("doctor_id = ? AND DATE(appointment_date) = ?", doctor.ID, today).
			Find(&todayAppointments).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch appointments"})
			return
		}

		// Get upcoming appointments
		var upcomingAppointments []models.Appointment
		if err := db.Preload("Patient").
			Where("doctor_id = ? AND appointment_date > ?", doctor.ID, time.Now()).
			Order("appointment_date ASC").
			Limit(10).
			Find(&upcomingAppointments).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch upcoming appointments"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"doctor_id":            doctor.ID,
			"name":                 doctor.User.Name,
			"today_appointments":   todayAppointments,
			"upcoming_appointments": upcomingAppointments,
		})
	}
}

// CreateSchedule allows doctors to add available time slots
func CreateSchedule(db *gorm.DB) gin.HandlerFunc {
	type ScheduleRequest struct {
		Date      string   `json:"date" binding:"required"` // Format: "2006-01-02"
		StartTime string   `json:"start_time" binding:"required"` // Format: "15:04"
		EndTime   string   `json:"end_time" binding:"required"`   // Format: "15:04"
		Slots     []string `json:"slots"` // Optional: specific time slots
	}

	return func(c *gin.Context) {
		userID, _ := c.Get("userID")

		// Verify user is a doctor
		var doctor models.Doctor
		if err := db.Where("user_id = ?", userID).First(&doctor).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only doctors can create schedules"})
			return
		}

		var req ScheduleRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Parse date and times
		date, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}

		startTime, err := time.Parse("15:04", req.StartTime)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start time format. Use HH:MM"})
			return
		}

		endTime, err := time.Parse("15:04", req.EndTime)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end time format. Use HH:MM"})
			return
		}

		// Validate time range
		if !endTime.After(startTime) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "End time must be after start time"})
			return
		}

		// Create schedule
		schedule := models.Schedule{
			DoctorID:    doctor.ID,
			Date:        date,
			StartTime:   req.StartTime,
			EndTime:     req.EndTime,
			IsAvailable: true,
		}

		if err := db.Create(&schedule).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create schedule"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message":  "Schedule created successfully",
			"schedule": schedule,
		})
	}
}
