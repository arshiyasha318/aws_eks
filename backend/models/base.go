package models

import (
	"time"
	"gorm.io/gorm"
)

// BaseModel contains common fields for all models
type BaseModel struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// UserRole defines the type for user roles
type UserRole string

// Role constants
const (
	PatientRole UserRole = "patient"
	DoctorRole  UserRole = "doctor"
	AdminRole   UserRole = "admin"
)

// Status constants for appointments
const (
	StatusPending    = "pending"
	StatusConfirmed  = "confirmed"
	StatusCancelled = "cancelled"
	StatusCompleted  = "completed"
)

// TimeSlot represents an available time slot for appointments
type TimeSlot struct {
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

// Pagination holds pagination information
type Pagination struct {
	Page     int `json:"page"`
	PageSize int `json:"page_size"`
	Total    int `json:"total"`
}

// ErrorResponse represents a standardized error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

// SuccessResponse represents a standardized success response
type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}
