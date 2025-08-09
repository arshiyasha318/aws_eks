package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/sandipdas/go-doctor-booking/backend/middleware"
	"gorm.io/gorm"
)

// SetupRoutes initializes all the API routes
func SetupRoutes(router *gin.Engine, db *gorm.DB) {
	api := router.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", RegisterUser(db))
			auth.POST("/login", LoginUser(db))
		}

		// Protected routes
		authorized := api.Group("/")
		authorized.Use(middleware.AuthMiddleware())
		{
			// User routes
			users := authorized.Group("/users")
			{
				users.GET("/profile", GetUserProfile(db))
				users.PUT("/profile", UpdateUserProfile(db))
			}

			// Doctor routes
			doctors := authorized.Group("/doctors")
			{
				// Public doctor listing (no auth required)
				api.GET("/doctors", ListDoctors(db))
				api.GET("/doctors/:id", GetDoctorProfile(db))

				// Protected doctor routes
				doctors.Use(middleware.RoleMiddleware("doctor", "admin"))
				{
					doctors.GET("/dashboard", GetDoctorDashboard(db))
					doctors.POST("/schedules", CreateSchedule(db))
					doctors.GET("/appointments", GetDoctorAppointments(db))
					doctors.PUT("/appointments/:id/status", UpdateAppointmentStatus(db))
				}
			}

			// Patient routes
			patients := authorized.Group("/patients")
			patients.Use(middleware.RoleMiddleware("patient"))
			{
				patients.GET("/doctors", ListDoctors(db))
				patients.GET("/doctors/:id/availability", GetDoctorAvailability(db))
				patients.POST("/appointments", BookAppointment(db))
				patients.GET("/appointments", GetPatientAppointments(db))
				patients.PUT("/appointments/:id/cancel", CancelAppointment(db))
			}

			// Admin routes
			admin := authorized.Group("/admin")
			admin.Use(middleware.RoleMiddleware("admin"))
			{
				admin.GET("/users", ListAllUsers(db))
				admin.PUT("/users/:id/status", UpdateUserStatus(db))
				admin.GET("/appointments", ListAllAppointments(db))
			}
		}
	}
}
