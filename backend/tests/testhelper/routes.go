package testhelper

import (
	"github.com/gin-gonic/gin"
	"github.com/sandipdas/go-doctor-booking/backend/api/v1"
	"github.com/sandipdas/go-doctor-booking/backend/middleware"
	"gorm.io/gorm"
)

func SetupTestRoutes(router *gin.RouterGroup, db *gorm.DB) {
	// Public routes
	auth := router.Group("/auth")
	{
		auth.POST("/register", v1.RegisterUser(db))
		auth.POST("/login", v1.LoginUser(db))
	}

	// Protected routes
	authorized := router.Group("")
	authorized.Use(middleware.AuthMiddleware())
	{
		// User routes
		users := authorized.Group("/users")
		{
			users.GET("/profile", v1.GetUserProfile(db))
			users.PUT("/profile", v1.UpdateUserProfile(db))
		}

		// Doctor routes
		doctors := authorized.Group("/doctors")
		{
			// Public doctor listing (no auth required)
			router.GET("/doctors", v1.ListDoctors(db))
			router.GET("/doctors/:id", v1.GetDoctorProfile(db))

			// Protected doctor routes
			doctorRoutes := doctors.Group("")
			doctorRoutes.Use(middleware.RoleMiddleware("doctor", "admin"))
			{
				doctorRoutes.GET("/dashboard", v1.GetDoctorDashboard(db))
				doctorRoutes.POST("/schedules", v1.CreateSchedule(db))
				doctorRoutes.GET("/appointments", v1.GetDoctorAppointments(db))
				doctorRoutes.PUT("/appointments/:id/status", v1.UpdateAppointmentStatus(db))
			}
		}

		// Patient routes
		patients := authorized.Group("/patients")
		patients.Use(middleware.RoleMiddleware("patient"))
		{
			patients.GET("/doctors", v1.ListDoctors(db))
			patients.GET("/doctors/:id/availability", v1.GetDoctorAvailability(db))
			patients.POST("/appointments", v1.BookAppointment(db))
			patients.GET("/appointments", v1.GetPatientAppointments(db))
			patients.PUT("/appointments/:id/cancel", v1.CancelAppointment(db))
		}

		// Admin routes
		admin := authorized.Group("/admin")
		admin.Use(middleware.RoleMiddleware("admin"))
		{
			admin.GET("/users", v1.ListAllUsers(db))
			admin.PUT("/users/:id/status", v1.UpdateUserStatus(db))
			admin.GET("/appointments", v1.ListAllAppointments(db))
		}
	}
}
