package v1

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sandipdas/go-doctor-booking/backend/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// GetUserProfile returns the profile of the logged-in user
func GetUserProfile(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")

		var user models.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Don't return password hash
		user.Password = ""

		// If user is a doctor, include doctor profile
		if user.Role == models.DoctorRole {
			var doctor models.Doctor
			if err := db.Where("user_id = ?", userID).First(&doctor).Error; err == nil {
				c.JSON(http.StatusOK, gin.H{
					"user":   user,
					"doctor": doctor,
				})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{"user": user})
	}
}

// UpdateUserProfile updates the profile of the logged-in user
type UpdateProfileRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// hashPassword hashes a password using bcrypt
func hashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

func UpdateUserProfile(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")

		var req UpdateProfileRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Start transaction
		tx := db.Begin()

		// Get user
		var user models.User
		if err := tx.First(&user, userID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Update user fields
		if req.Name != "" {
			user.Name = req.Name
		}
		if req.Email != "" && req.Email != user.Email {
			// Check if email is already taken
			var existingUser models.User
			if err := tx.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": "Email already in use"})
				return
			}
			user.Email = req.Email
		}
		if req.Password != "" {
			hashedPassword, err := hashPassword(req.Password)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
				return
			}
			user.Password = hashedPassword
		}

		if err := tx.Save(&user).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
			return
		}

		tx.Commit()

		// Don't return password hash
		user.Password = ""

		c.JSON(http.StatusOK, gin.H{
			"message": "Profile updated successfully",
			"user":    user,
		})
	}
}

// ListAllUsers returns a list of all users (admin only)
func ListAllUsers(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var users []models.User
		query := db.Model(&models.User{})

		// Apply filters
		if role := c.Query("role"); role != "" {
			query = query.Where("role = ?", role)
		}
		if active := c.Query("active"); active != "" {
			query = query.Where("active = ?", active == "true")
		}

		// Pagination
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		offset := (page - 1) * limit

		var total int64
		query.Count(&total)

		query = query.Offset(offset).Limit(limit)

		if err := query.Find(&users).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
			return
		}

		// Don't return password hashes
		for i := range users {
			users[i].Password = ""
		}

		c.JSON(http.StatusOK, gin.H{
			"data":  users,
			"total": total,
			"page":  page,
			"limit": limit,
		})
	}
}

// UpdateUserStatus updates a user's active status (admin only)
type UpdateUserStatusRequest struct {
	Active bool `json:"active"`
}

func UpdateUserStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Param("id")

		var req UpdateUserStatusRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Update user status
		if err := db.Model(&models.User{}).Where("id = ?", userID).
			Update("active", req.Active).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user status"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "User status updated successfully",
		})
	}
}
