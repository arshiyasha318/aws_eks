package v1

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sandipdas/go-doctor-booking/backend/models"
	"gorm.io/gorm"
)

// GetDoctorAppointments returns a list of appointments for the logged-in doctor
func GetDoctorAppointments(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")

		// Get query parameters
		status := c.Query("status")
		startDate := c.Query("start_date")
		endDate := c.Query("end_date")

		// Find doctor by user ID
		var doctor models.Doctor
		if err := db.Where("user_id = ?", userID).First(&doctor).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
			return
		}

		// Build query
		query := db.Model(&models.Appointment{}).
			Where("doctor_id = ?", doctor.ID).
			Preload("Patient").
			Order("appointment_date DESC, start_time DESC")

		// Apply filters
		if status != "" {
			query = query.Where("status = ?", status)
		}
		if startDate != "" {
			query = query.Where("appointment_date >= ?", startDate)
		}
		if endDate != "" {
			query = query.Where("appointment_date <= ?", endDate)
		}

		// Execute query
		var appointments []models.Appointment
		if err := query.Find(&appointments).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch appointments"})
			return
		}

		c.JSON(http.StatusOK, appointments)
	}
}

// UpdateAppointmentStatus updates the status of an appointment
func UpdateAppointmentStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		appointmentID := c.Param("id")

		// Find doctor by user ID
		var doctor models.Doctor
		if err := db.Where("user_id = ?", userID).First(&doctor).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
			return
		}

		// Parse request body
		var request struct {
			Status string `json:"status" binding:"required,oneof=confirmed cancelled completed"`
		}
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Update appointment status
		result := db.Model(&models.Appointment{}).
			Where("id = ? AND doctor_id = ?", appointmentID, doctor.ID).
			Update("status", request.Status)

		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update appointment status"})
			return
		}

		if result.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Appointment status updated successfully"})
	}
}

// GetDoctorAvailability returns available time slots for a doctor
func GetDoctorAvailability(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		doctorID := c.Param("id")
		dateStr := c.DefaultQuery("date", time.Now().Format("2006-01-02"))

		// Parse date
		date, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}

		// Find doctor
		var doctor models.Doctor
		if err := db.First(&doctor, doctorID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
			return
		}

		// Get doctor's working hours (simplified)
		// In a real app, this would come from the doctor's schedule
		startHour := 9
		endHour := 17
		duration := 30 // minutes

		// Generate time slots
		var timeSlots []string
		currentTime := time.Date(date.Year(), date.Month(), date.Day(), startHour, 0, 0, 0, time.UTC)
		endTime := time.Date(date.Year(), date.Month(), date.Day(), endHour, 0, 0, 0, time.UTC)

		for currentTime.Before(endTime) {
			timeSlots = append(timeSlots, currentTime.Format("15:04"))
			currentTime = currentTime.Add(time.Duration(duration) * time.Minute)
		}

		// Get booked appointments for the day
		var bookedAppointments []models.Appointment
		if err := db.Where("doctor_id = ? AND DATE(appointment_date) = ?", doctorID, dateStr).
			Find(&bookedAppointments).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch appointments"})
			return
		}

		// Filter out booked time slots
		availableSlots := make([]string, 0)
		bookedSlots := make(map[string]bool)
		for _, appt := range bookedAppointments {
			t, err := time.Parse("15:04:05", appt.StartTime.Format("15:04:05"))
			if err == nil {
				bookedSlots[t.Format("15:04")] = true
			}
		}

		for _, slot := range timeSlots {
			if !bookedSlots[slot] {
				availableSlots = append(availableSlots, slot)
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"doctor_id":        doctorID,
			"date":            dateStr,
			"available_slots": availableSlots,
		})
	}
}

// BookAppointment creates a new appointment
func BookAppointment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")

		// Parse request body
		var request struct {
			DoctorID    uint      `json:"doctor_id" binding:"required"`
			ScheduledAt time.Time `json:"scheduled_at" binding:"required"`
			Notes       string    `json:"notes"`
		}

		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Check if doctor exists
		var doctor models.Doctor
		if err := db.First(&doctor, request.DoctorID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
			return
		}

		// Check if doctor is available at the requested time
		var existingAppointment models.Appointment
		if err := db.Where("doctor_id = ? AND appointment_date = ? AND start_time = ?", 
			request.DoctorID, request.ScheduledAt, request.ScheduledAt).
			First(&existingAppointment).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Doctor is not available at the requested time"})
			return
		}

		// Create appointment
		appointment := models.Appointment{
			PatientID:       userID.(uint),
			DoctorID:        request.DoctorID,
			AppointmentDate: request.ScheduledAt,
			StartTime:       request.ScheduledAt,
			EndTime:         request.ScheduledAt.Add(30 * time.Minute), // Default 30-minute appointment
			Status:          "pending",
			Notes:           request.Notes,
		}

		if err := db.Create(&appointment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to book appointment"})
			return
		}

		c.JSON(http.StatusCreated, appointment)
	}
}

// GetPatientAppointments returns a list of appointments for the logged-in patient
func GetPatientAppointments(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")

		// Get query parameters
		status := c.Query("status")
		startDate := c.Query("start_date")
		endDate := c.Query("end_date")

		// Build query
		query := db.Model(&models.Appointment{}).
			Where("patient_id = ?", userID).
			Preload("Doctor").
			Preload("Doctor.User").
			Preload("Patient").
			Order("appointment_date DESC, start_time DESC")

		// Apply filters
		if status != "" {
			query = query.Where("status = ?", status)
		}
		if startDate != "" {
			query = query.Where("appointment_date >= ?", startDate)
		}
		if endDate != "" {
			query = query.Where("appointment_date <= ?", endDate)
		}

		// Execute query
		var appointments []models.Appointment
		if err := query.Find(&appointments).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch appointments"})
			return
		}

		c.JSON(http.StatusOK, appointments)
	}
}

// CancelAppointment cancels an appointment
func CancelAppointment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		appointmentID := c.Param("id")

		// Find appointment
		var appointment models.Appointment
		if err := db.Where("id = ? AND patient_id = ?", appointmentID, userID).
			First(&appointment).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
			return
		}

		// Check if appointment can be cancelled
		if appointment.Status == models.StatusCancelled {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Appointment is already cancelled"})
			return
		}

		// Update status to cancelled
		if err := db.Model(&appointment).
			Update("status", models.StatusCancelled).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel appointment"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Appointment cancelled successfully"})
	}
}

// ListAllAppointments returns a list of all appointments (admin only)
func ListAllAppointments(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get query parameters
		status := c.Query("status")
		startDate := c.Query("start_date")
		endDate := c.Query("end_date")
		doctorID := c.Query("doctor_id")
		patientID := c.Query("patient_id")

		// Build query
		query := db.Model(&models.Appointment{}).
			Preload("Doctor").
			Preload("Patient").
			Order("scheduled_at DESC")

		// Apply filters
		if status != "" {
			query = query.Where("status = ?", status)
		}
		if startDate != "" {
			query = query.Where("scheduled_at >= ?", startDate)
		}
		if endDate != "" {
			query = query.Where("scheduled_at <= ?", endDate)
		}
		if doctorID != "" {
			query = query.Where("doctor_id = ?", doctorID)
		}
		if patientID != "" {
			query = query.Where("patient_id = ?", patientID)
		}

		// Pagination
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		offset := (page - 1) * limit

		var total int64
		query.Count(&total)

		var appointments []models.Appointment
		if err := query.Offset(offset).Limit(limit).Find(&appointments).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch appointments"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": appointments,
			"meta": gin.H{
				"total":     total,
				"page":      page,
				"limit":     limit,
				"totalPage": (int(total) + limit - 1) / limit,
			},
		})
	}
}