package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	v1 "github.com/sandipdas/go-doctor-booking/backend/api/v1"
	"github.com/sandipdas/go-doctor-booking/backend/config"
	"github.com/sandipdas/go-doctor-booking/backend/models"
	"gorm.io/gorm"
)

var db *gorm.DB

func initDB() (*gorm.DB, error) {
	// Load environment variables
	if err := config.LoadEnv(); err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	// Initialize database
	db, err := config.InitializeDB()
	if err != nil {
		return nil, err
	}

	// Auto migrate models
	if err := db.AutoMigrate(
		&models.User{},
		&models.Doctor{},
		&models.Schedule{},
		&models.Appointment{},
	); err != nil {
		return nil, err
	}

	return db, nil
}

func setupRouter() *gin.Engine {
	r := gin.Default()

	// CORS configuration
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowCredentials = true
	corsConfig.AddAllowHeaders("Authorization")
	r.Use(cors.New(corsConfig))

	// Serve Swagger UI from /swagger-ui/ path
	r.Static("/swagger-ui", "./docs")

	// Redirect root to Swagger UI
	r.GET("/swagger", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/swagger-ui/index.html")
	})

	// Serve Swagger JSON
	r.GET("/swagger.json", func(c *gin.Context) {
		c.File("./docs/swagger.json")
	})

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"version": "1.0.0",
		})
	})

	// Setup API v1 routes
	v1.SetupRoutes(r, db)

	return r
}

func main() {
	var err error

	// Initialize database
	db, err = initDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Check for command line arguments
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "migrate":
			log.Println("Database migration completed")
			return
		case "seed":
			log.Println("Seeding database...")
			// Here you can add code to seed the database
			log.Println("Database seeding completed")
			return
		}
	}

	// Set Gin mode
	if os.Getenv("ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	// Initialize router
	r := setupRouter()

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Printf("Server running on port %s", port)
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
