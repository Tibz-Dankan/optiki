package constants

import "errors"

var ErrNotPermitted = "not permitted"
var ErrNotPermittedError = errors.New(ErrNotPermitted)

var ErrNotLoggedIn = "You are not logged in!"
var ErrEmailNotVerified = "Your email is not verified. Please verify your email to gain access."

var ErrReasonEmailNotVerified = "EMAIL_NOT_VERIFIED"

var ErrReasonSSRFBlocked = "SSRF_BLOCKED"
var ErrReasonTooLarge = "TOO_LARGE"
var ErrReasonNotHTML = "NOT_HTML"
var ErrReasonFetchTimeout = "FETCH_TIMEOUT"
var ErrReasonRenderTimeout = "RENDER_TIMEOUT"
var ErrReasonRendererBusy = "RENDERER_BUSY"
var ErrReasonTokenRevoked = "TOKEN_REVOKED"
var ErrReasonTokenExpired = "TOKEN_EXPIRED"
var ErrReasonMissingPermission = "MISSING_PERMISSION"
var ErrReasonAnonymousScanLimit = "ANONYMOUS_SCAN_LIMIT"
var ErrReasonScanQueueFull = "SCAN_QUEUE_FULL"

var ErrInvalidAPIToken = "Invalid API token!"
var ErrAddressNotAllowed = "This address isn't allowed"
var ErrScanNotFound = "Scan not found"
var ErrAPITokenNotFound = "API token not found"
var ErrInvalidSiteVisitPath = "Path must start with / and be at most 512 characters!"
var ErrInvalidCapturedAt = "Invalid capturedAt format! Must be an ISO 8601 string."
var ErrInvalidAnonymousID = "anonymousID must be a UUID!"
var ErrAnonymousIDLinkedElsewhere = "This anonymous ID is already linked to another account!"
var ErrAnonymousScanLimit = "Sign in to scan more than 3 pages!"
var ErrMultiplePageScanNotFound = "Multiple-page scan not found"
var ErrScanQueueFull = "Too many multiple-page scans are waiting. Try again in a minute."
