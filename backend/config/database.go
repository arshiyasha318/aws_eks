package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// DBConfig holds the database configuration
type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// LoadEnv loads environment variables from .env file
func LoadEnv() error {
	// Try to load .env file, but don't fail if it doesn't exist
	_ = godotenv.Load()
	return nil
}

// LoadDBConfig loads the database configuration from environment variables
func LoadDBConfig() DBConfig {
	// Set default values
	config := DBConfig{
		Host:     "localhost",
		Port:     "5432",
		User:     "postgres",
		Password: "postgres",
		DBName:   "doctor_booking",
		SSLMode:  "disable",
	}

	// Override with environment variables if they exist
	if host := os.Getenv("DB_HOST"); host != "" {
		config.Host = host
	}
	if port := os.Getenv("DB_PORT"); port != "" {
		config.Port = port
	}
	if user := os.Getenv("DB_USER"); user != "" {
		config.User = user
	}
	if password := os.Getenv("DB_PASSWORD"); password != "" {
		config.Password = password
	}
	if dbName := os.Getenv("DB_NAME"); dbName != "" {
		config.DBName = dbName
	}
	if sslMode := os.Getenv("DB_SSLMODE"); sslMode != "" {
		config.SSLMode = sslMode
	}

	return config
}

var dbInstance *gorm.DB

// GetDB returns the database instance
func GetDB() (*gorm.DB, error) {
	if dbInstance != nil {
		return dbInstance, nil
	}
	return InitializeDB()
}

// InitializeDB creates a new database connection
func InitializeDB() (*gorm.DB, error) {
	// Load environment variables
	if err := LoadEnv(); err != nil {
		return nil, err
	}

	config := LoadDBConfig()

	dsn := ""
	if config.Password != "" {
		dsn = "host=" + config.Host + " user=" + config.User + " password=" + config.Password + " dbname=" + config.DBName + " port=" + config.Port + " sslmode=" + config.SSLMode
	} else {
		dsn = "host=" + config.Host + " user=" + config.User + " dbname=" + config.DBName + " port=" + config.Port + " sslmode=" + config.SSLMode
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Enable connection pooling
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// Set connection pool parameters
	sqlDB.SetMaxIdleConns(10)                 // Max idle connections
	sqlDB.SetMaxOpenConns(100)                // Max open connections
	sqlDB.SetConnMaxLifetime(0)               // Connection lifetime (0 means unlimited)
	sqlDB.SetConnMaxIdleTime(5 * time.Minute) // Max idle time

	log.Println("Successfully connected to database")
	// Store the database connection in the package variable
	dbInstance = db
	return db, nil
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
