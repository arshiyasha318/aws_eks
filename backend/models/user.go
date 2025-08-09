package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name           string    `json:"name" gorm:"type:varchar(100);not null"`
	Email          string    `json:"email" gorm:"type:varchar(100);uniqueIndex;not null"`
	Password       string    `json:"-" gorm:"type:varchar(255);not null"`
	Role           UserRole  `json:"role" gorm:"type:varchar(20);not null;default:'patient'"`
	Active         bool      `json:"active" gorm:"default:true"`
	Phone          string    `json:"phone" gorm:"type:varchar(20)"`
	DateOfBirth    time.Time `json:"date_of_birth"`
	Gender         string    `json:"gender" gorm:"type:varchar(10)"`
	Address        string    `json:"address" gorm:"type:text"`
	City           string    `json:"city" gorm:"type:varchar(100)"`
	State          string    `json:"state" gorm:"type:varchar(100)"`
	Country        string    `json:"country" gorm:"type:varchar(100)"`
	PostalCode     string    `json:"postal_code" gorm:"type:varchar(20)"`
	ProfilePicture string    `json:"profile_picture" gorm:"type:varchar(255)"`
	LastLogin      time.Time `json:"last_login"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

// BeforeCreate hook to hash password
func (u *User) BeforeCreate(tx *gorm.DB) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// BeforeUpdate hook to hash password if it's being updated
func (u *User) BeforeUpdate(tx *gorm.DB) error {
	// Check if the password is being updated
	if tx.Statement.Changed("Password") {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		tx.Statement.SetColumn("password", string(hashedPassword))
	}
	return nil
}

// CheckPassword verifies the provided password
func (u *User) CheckPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}
