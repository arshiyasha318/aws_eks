package main

import (
	"flag"
	"fmt"
	"log"

	"github.com/sandipdas/go-doctor-booking/backend/config"
	"github.com/sandipdas/go-doctor-booking/backend/models"
)

func main() {
	// Define command-line flags
	initDB := flag.Bool("initdb", false, "Initialize the database schema")
	seedDB := flag.Bool("seed", false, "Seed the database with initial data")
	flag.Parse()

	// Execute the requested command
	switch {
	case *initDB:
		if err := InitDB(); err != nil {
			log.Fatalf("Failed to initialize database: %v", err)
		}
		log.Println("Database initialized successfully")
	case *seedDB:
		SeedDB()
	default:
		flag.Usage()
	}
}

// InitDB initializes the database schema
func InitDB() error {
	// Load environment variables
	if err := config.LoadEnv(); err != nil {
		return fmt.Errorf("error loading .env file: %w", err)
	}

	// Initialize database
	db, err := config.InitializeDB()
	if err != nil {
		return fmt.Errorf("failed to initialize database: %w", err)
	}

	// Auto migrate models
	if err := db.AutoMigrate(
		&models.User{},
		&models.Doctor{},
		&models.Schedule{},
		&models.Appointment{},
	); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	return nil
}
