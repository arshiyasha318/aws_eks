package v1

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sandipdas/go-doctor-booking/backend/middleware"
	"github.com/sandipdas/go-doctor-booking/backend/models"
	"gorm.io/gorm"
)

type RegisterRequest struct {
	Name            string  `json:"name" binding:"required"`
	Email           string  `json:"email" binding:"required,email"`
	Password        string  `json:"password" binding:"required,min=8"`
	Role            string  `json:"role" binding:"required,oneof=patient doctor"`
	// Doctor specific fields
	Specialization  string  `json:"specialization,omitempty"`
	Qualification   string  `json:"qualification,omitempty"`
	Experience      int     `json:"experience,omitempty"`
	Bio             string  `json:"bio,omitempty"`
	ConsultationFee float64 `json:"consultation_fee,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  struct {
		ID    uint   `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
		Role  string `json:"role"`
	} `json:"user"`
}

// RegisterUser handles user registration
func RegisterUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Check if user already exists
		var existingUser models.User
		if err := db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email already registered"})
			return
		}

		// Create new user
		user := models.User{
			Name:     req.Name,
			Email:    req.Email,
			Password: req.Password,
			Role:     models.UserRole(req.Role),
			Active:   true,
		}

		// Start a transaction
		tx := db.Begin()

		// Create user
		if err := tx.Create(&user).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		// If user is a doctor, create doctor profile
		if user.Role == models.DoctorRole {
			doc := models.Doctor{
				UserID:           user.ID,
				Specialization:   models.Specialization(req.Specialization),
				Qualification:    req.Qualification,
				Experience:       req.Experience,
				Bio:              req.Bio,
				ConsultationFee:  req.ConsultationFee,
				Available:        true,
			}

			if err := tx.Create(&doc).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create doctor profile"})
				return
			}
		}

		// Commit the transaction
		if err := tx.Commit().Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete registration"})
			return
		}

		// Generate JWT token
		token, err := middleware.GenerateToken(user.ID, user.Email, string(user.Role))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		// Prepare response
		var resp AuthResponse
		resp.Token = token
		resp.User.ID = user.ID
		resp.User.Name = user.Name
		resp.User.Email = user.Email
		resp.User.Role = string(user.Role)

		c.JSON(http.StatusCreated, resp)
	}
}

// LoginUser handles user login
func LoginUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Find user by email
		var user models.User
		if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
			log.Printf("User not found with email: %s, error: %v", req.Email, err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}

		log.Printf("Found user: ID=%d, Email=%s, Active=%v", user.ID, user.Email, user.Active)

		// Check password
		log.Printf("Checking password for user: %s", user.Email)
		log.Printf("Stored password hash: %s", user.Password)
		log.Printf("Provided password: %s", req.Password)

		if err := user.CheckPassword(req.Password); err != nil {
			log.Printf("Password check failed: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}

		log.Printf("Password check successful for user: %s", user.Email)

		// Check if user is active
		if !user.Active {
			c.JSON(http.StatusForbidden, gin.H{"error": "Account is deactivated"})
			return
		}

		// Generate JWT token
		token, err := middleware.GenerateToken(user.ID, user.Email, string(user.Role))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		// Prepare response
		var resp AuthResponse
		resp.Token = token
		resp.User.ID = user.ID
		resp.User.Name = user.Name
		resp.User.Email = user.Email
		resp.User.Role = string(user.Role)

		c.JSON(http.StatusOK, resp)
	}
}
