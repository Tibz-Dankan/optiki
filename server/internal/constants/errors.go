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
var ErrReasonNoFindings = "NO_FINDINGS"
var ErrReasonFixReportInProgress = "FIX_REPORT_IN_PROGRESS"
var ErrReasonFixReportQueueFull = "FIX_REPORT_QUEUE_FULL"
var ErrReasonFixReportsUnavailable = "FIX_REPORTS_UNAVAILABLE"

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
var ErrFixReportQueueFull = "Too many fix reports are being generated. Try again in a minute."
var ErrFixReportsUnavailable = "Fix reports aren't available on this server."
var ErrNoFindingsToFix = "This scan found no issues to fix."
var ErrFixReportInProgress = "A fix report for this scan is already being generated."
var ErrScanNotCompleted = "Only a completed scan can have a fix report."
