package data

// SiteVisitPageNames maps each client route to the page name a site visit records
var SiteVisitPageNames = map[string]string{
	"/":                      "Home",
	"/scan":                  "Scan",
	"/scans/:id":             "Scan Report",
	"/rules":                 "Rules",
	"/rules/:id":             "Rule Detail",
	"/gym":                   "Gym",
	"/auth/signin":           "Sign In",
	"/auth/signup":           "Sign Up",
	"/auth/forgot-password":  "Forgot Password",
	"/auth/verify-otp":       "Verify OTP",
	"/auth/reset-password":   "Reset Password",
	"/auth/verify-email":     "Verify Email",
	"/u/home":                "User Home",
	"/u/scan":                "Scan",
	"/u/scans":               "Scans",
	"/u/scans/:id":           "Scan Report",
	"/u/settings":            "General Settings",
	"/u/settings/account":    "Account Settings",
	"/u/settings/api-tokens": "API Token Settings",
	"*":                      "Page Not Found",
}
