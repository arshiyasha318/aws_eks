package config

import "os"

// Config holds the application configuration
type Config struct {
	// Add any application-wide configuration here
}

// NewConfig creates a new configuration instance
func NewConfig() *Config {
	return &Config{
		// Initialize with default values
	}
}

// Load loads the configuration from environment variables
func (c *Config) Load() error {
	// Load any configuration from environment variables here
	return nil
}

// GetEnv returns the value of the environment variable named by the key.
// If the variable is not set, it returns the default value.
func GetEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
