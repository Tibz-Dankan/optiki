package constants

import "errors"

var ErrNotPermitted = "not permitted"
var ErrNotPermittedError = errors.New(ErrNotPermitted)

var ErrNotLoggedIn = "You are not logged in!"
var ErrEmailNotVerified = "Your email is not verified. Please verify your email to gain access."

var ErrReasonEmailNotVerified = "EMAIL_NOT_VERIFIED"
