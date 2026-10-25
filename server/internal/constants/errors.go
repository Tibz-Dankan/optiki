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

var ErrInvalidAPIToken = "Invalid API token!"
var ErrAddressNotAllowed = "This address isn't allowed"
var ErrScanNotFound = "Scan not found"
var ErrAPITokenNotFound = "API token not found"
