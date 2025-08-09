package models

import (
	"time"
	"gorm.io/gorm"
)

type Appointment struct {
	gorm.Model
	PatientID        uint             `json:"patient_id" gorm:"not null;index"`
	Patient          User             `json:"patient" gorm:"foreignKey:PatientID"`
	DoctorID         uint             `json:"doctor_id" gorm:"not null;index"`
	Doctor           Doctor           `json:"doctor" gorm:"foreignKey:DoctorID"`
	AppointmentDate  time.Time        `json:"appointment_date" gorm:"not null;index"`
	StartTime        time.Time        `json:"start_time" gorm:"not null"`
	EndTime          time.Time        `json:"end_time" gorm:"not null"`
	Status           string           `json:"status" gorm:"type:varchar(20);default:'pending'"`
	Reason           string           `json:"reason" gorm:"type:text"`
	Notes            string           `json:"notes" gorm:"type:text"`
	IsFollowUp       bool             `json:"is_follow_up" gorm:"default:false"`
	FollowUpNotes    string           `json:"follow_up_notes" gorm:"type:text"`
	IsPaid           bool             `json:"is_paid" gorm:"default:false"`
	PaymentAmount    float64          `json:"payment_amount" gorm:"default:0"`
	PaymentReference string           `json:"payment_reference" gorm:"type:varchar(255)"`
	CancellationReason string         `json:"cancellation_reason" gorm:"type:text"`
	CreatedAt        time.Time        `json:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
	DeletedAt        gorm.DeletedAt   `json:"-" gorm:"index"`
}

type Schedule struct {
	gorm.Model
	DoctorID    uint      `json:"doctor_id" gorm:"not null;index"`
	Doctor      Doctor    `json:"-" gorm:"foreignKey:DoctorID"`
	Date        time.Time `json:"date" gorm:"not null"`
	StartTime   string    `json:"start_time"` // Format: "15:04"
	EndTime     string    `json:"end_time"`   // Format: "15:04"
	IsAvailable bool      `json:"is_available" gorm:"default:true"`
}
