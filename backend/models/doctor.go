package models

import (
	"time"

	"gorm.io/gorm"
)

type Specialization string

const (
	Cardiology    Specialization = "cardiology"
	Dermatology   Specialization = "dermatology"
	Neurology     Specialization = "neurology"
	Pediatrics    Specialization = "pediatrics"
	Orthopedics   Specialization = "orthopedics"
	Ophthalmology Specialization = "ophthalmology"
	Psychiatry    Specialization = "psychiatry"
)

type Doctor struct {
	gorm.Model
	UserID           uint           `json:"user_id" gorm:"not null;uniqueIndex"`
	Specialization   Specialization `json:"specialization" gorm:"type:varchar(100);not null"`
	Qualification    string         `json:"qualification" gorm:"type:varchar(255);not null"`
	Experience       int            `json:"experience" gorm:"not null;default:0"`
	Bio              string         `json:"bio" gorm:"type:text"`
	ConsultationFee  float64        `json:"consultation_fee" gorm:"not null;default:0"`
	Available        bool           `json:"available" gorm:"default:true"`
	AverageRating    float64        `json:"average_rating" gorm:"default:0"`
	TotalRatings     int            `json:"total_ratings" gorm:"default:0"`
	HospitalAffiliation string       `json:"hospital_affiliation" gorm:"type:varchar(255)"`
	Languages        string        `json:"languages" gorm:"type:varchar(255)"`
	Education        string        `json:"education" gorm:"type:text"`
	Awards           string        `json:"awards" gorm:"type:text"`
	User             User          `json:"user" gorm:"foreignKey:UserID"`
	Schedules        []Schedule    `json:"schedules,omitempty" gorm:"foreignKey:DoctorID"`
	Appointments     []Appointment `json:"appointments,omitempty" gorm:"foreignKey:DoctorID"`
	CreatedAt        time.Time     `json:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`
}
