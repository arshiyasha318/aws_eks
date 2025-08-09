package main

import (
	"log"
	"time"

	"github.com/sandipdas/go-doctor-booking/backend/config"
	"github.com/sandipdas/go-doctor-booking/backend/models"
	"golang.org/x/crypto/bcrypt"
)

// SeedDB populates the database with initial data
func SeedDB() {
	// Load environment variables
	if err := config.LoadEnv(); err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	// Initialize database
	db, err := config.GetDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto migrate models
	if err := db.AutoMigrate(
		&models.User{},
		&models.Doctor{},
		&models.Schedule{},
		&models.Appointment{},
	); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Create admin user
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	admin := models.User{
		Name:     "Admin User",
		Email:    "admin@example.com",
		Password: string(hashedPassword),
		Role:     models.AdminRole,
		Active:   true,
	}

	if err := db.FirstOrCreate(&admin, models.User{Email: admin.Email}).Error; err != nil {
		log.Printf("Error creating admin user: %v", err)
	} else {
		log.Println("Database seeded successfully")
	}

	// Create sample doctors
	doctors := []struct {
		name          string
		email         string
		specialization models.Specialization
		qualification string
		experience    int
		bio           string
		fee           float64
	}{
		{
			"Dr. Sarah Johnson",
			"sarah.johnson@example.com",
			models.Cardiology,
			"MD, Cardiology",
			10,
			"Senior Cardiologist with 10+ years of experience in interventional cardiology.",
			150.00,
		},
		{
			"Dr. Michael Chen",
			"michael.chen@example.com",
			models.Neurology,
			"MD, Neurology",
			8,
			"Neurologist specializing in movement disorders and neurophysiology.",
			175.00,
		},
		{
			"Dr. Emily Wilson",
			"emily.wilson@example.com",
			models.Pediatrics,
			"MD, Pediatrics",
			12,
			"Pediatrician with extensive experience in child healthcare and development.",
			125.00,
		},
	}

	for _, d := range doctors {
		// Create user
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("doctor123"), bcrypt.DefaultCost)
		user := models.User{
			Name:     d.name,
			Email:    d.email,
			Password: string(hashedPassword),
			Role:     models.DoctorRole,
			Active:   true,
		}

		if err := db.FirstOrCreate(&user, models.User{Email: user.Email}).Error; err != nil {
			log.Printf("Error creating doctor user %s: %v", d.email, err)
			continue
		}

		// Create doctor profile
		doctor := models.Doctor{
			UserID:           user.ID,
			Specialization:   d.specialization,
			Qualification:    d.qualification,
			Experience:       d.experience,
			Bio:              d.bio,
			ConsultationFee:  d.fee,
			Available:        true,
		}

		if err := db.Create(&doctor).Error; err != nil {
			log.Printf("Error creating doctor profile for %s: %v", d.email, err)
		}

		log.Printf("Created doctor: %s", d.name)

		// Create sample schedules for the next 7 days
		for i := 0; i < 7; i++ {
			date := time.Now().AddDate(0, 0, i)
			// Skip weekends
			if date.Weekday() == time.Saturday || date.Weekday() == time.Sunday {
				continue
			}

			// Create morning and afternoon slots
			for _, period := range []struct {
				start string
				end   string
			}{
				{"09:00", "12:00"},
				{"14:00", "17:00"},
			} {
				schedule := models.Schedule{
					DoctorID:    doctor.ID,
					Date:        date,
					StartTime:   period.start,
					EndTime:     period.end,
					IsAvailable: true,
				}

				if err := db.Create(&schedule).Error; err != nil {
					log.Printf("Error creating schedule: %v", err)
				}
			}
		}
	}

	log.Println("Database seeding completed successfully!")
}
