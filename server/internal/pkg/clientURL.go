package pkg

// GetClientBaseURL returns the frontend origin for the current
//
//	environment, with no trailing slash.
func GetClientBaseURL() string {
	appEnv := GetAppEnv()

	switch appEnv {
	case "local_development":
		return "http://localhost:5173"
	case "deployed_production":
		return "https://optikii.netlify.app"
	}

	return ""
}

// GetClientAppBaseURL returns the origin of the given frontend for the current
//
//	environment, with no trailing slash.
func GetClientAppBaseURL() string {
	return GetClientBaseURL()
}
