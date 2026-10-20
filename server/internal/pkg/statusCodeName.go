package pkg

import "github.com/gofiber/fiber/v2"

var statusCodeNames = map[int]string{
	fiber.StatusContinue:           "CONTINUE",
	fiber.StatusSwitchingProtocols: "SWITCHING_PROTOCOLS",
	fiber.StatusProcessing:         "PROCESSING",
	fiber.StatusEarlyHints:         "EARLY_HINTS",

	fiber.StatusOK:                          "OK",
	fiber.StatusCreated:                     "CREATED",
	fiber.StatusAccepted:                    "ACCEPTED",
	fiber.StatusNonAuthoritativeInformation: "NON_AUTHORITATIVE_INFORMATION",
	fiber.StatusNoContent:                   "NO_CONTENT",
	fiber.StatusResetContent:                "RESET_CONTENT",
	fiber.StatusPartialContent:              "PARTIAL_CONTENT",
	fiber.StatusMultiStatus:                 "MULTI_STATUS",
	fiber.StatusAlreadyReported:             "ALREADY_REPORTED",
	fiber.StatusIMUsed:                      "IM_USED",

	fiber.StatusMultipleChoices:   "MULTIPLE_CHOICES",
	fiber.StatusMovedPermanently:  "MOVED_PERMANENTLY",
	fiber.StatusFound:             "FOUND",
	fiber.StatusSeeOther:          "SEE_OTHER",
	fiber.StatusNotModified:       "NOT_MODIFIED",
	fiber.StatusUseProxy:          "USE_PROXY",
	fiber.StatusSwitchProxy:       "SWITCH_PROXY",
	fiber.StatusTemporaryRedirect: "TEMPORARY_REDIRECT",
	fiber.StatusPermanentRedirect: "PERMANENT_REDIRECT",

	fiber.StatusBadRequest:                   "BAD_REQUEST",
	fiber.StatusUnauthorized:                 "UNAUTHORIZED",
	fiber.StatusPaymentRequired:              "PAYMENT_REQUIRED",
	fiber.StatusForbidden:                    "FORBIDDEN",
	fiber.StatusNotFound:                     "NOT_FOUND",
	fiber.StatusMethodNotAllowed:             "METHOD_NOT_ALLOWED",
	fiber.StatusNotAcceptable:                "NOT_ACCEPTABLE",
	fiber.StatusProxyAuthRequired:            "PROXY_AUTHENTICATION_REQUIRED",
	fiber.StatusRequestTimeout:               "REQUEST_TIMEOUT",
	fiber.StatusConflict:                     "CONFLICT",
	fiber.StatusGone:                         "GONE",
	fiber.StatusLengthRequired:               "LENGTH_REQUIRED",
	fiber.StatusPreconditionFailed:           "PRECONDITION_FAILED",
	fiber.StatusRequestEntityTooLarge:        "CONTENT_TOO_LARGE",
	fiber.StatusRequestURITooLong:            "URI_TOO_LONG",
	fiber.StatusUnsupportedMediaType:         "UNSUPPORTED_MEDIA_TYPE",
	fiber.StatusRequestedRangeNotSatisfiable: "RANGE_NOT_SATISFIABLE",
	fiber.StatusExpectationFailed:            "EXPECTATION_FAILED",
	fiber.StatusTeapot:                       "IM_A_TEAPOT",
	fiber.StatusMisdirectedRequest:           "MISDIRECTED_REQUEST",
	fiber.StatusUnprocessableEntity:          "UNPROCESSABLE_CONTENT",
	fiber.StatusLocked:                       "LOCKED",
	fiber.StatusFailedDependency:             "FAILED_DEPENDENCY",
	fiber.StatusTooEarly:                     "TOO_EARLY",
	fiber.StatusUpgradeRequired:              "UPGRADE_REQUIRED",
	fiber.StatusPreconditionRequired:         "PRECONDITION_REQUIRED",
	fiber.StatusTooManyRequests:              "TOO_MANY_REQUESTS",
	fiber.StatusRequestHeaderFieldsTooLarge:  "REQUEST_HEADER_FIELDS_TOO_LARGE",
	fiber.StatusUnavailableForLegalReasons:   "UNAVAILABLE_FOR_LEGAL_REASONS",

	fiber.StatusInternalServerError:           "INTERNAL_SERVER_ERROR",
	fiber.StatusNotImplemented:                "NOT_IMPLEMENTED",
	fiber.StatusBadGateway:                    "BAD_GATEWAY",
	fiber.StatusServiceUnavailable:            "SERVICE_UNAVAILABLE",
	fiber.StatusGatewayTimeout:                "GATEWAY_TIMEOUT",
	fiber.StatusHTTPVersionNotSupported:       "HTTP_VERSION_NOT_SUPPORTED",
	fiber.StatusVariantAlsoNegotiates:         "VARIANT_ALSO_NEGOTIATES",
	fiber.StatusInsufficientStorage:           "INSUFFICIENT_STORAGE",
	fiber.StatusLoopDetected:                  "LOOP_DETECTED",
	fiber.StatusNotExtended:                   "NOT_EXTENDED",
	fiber.StatusNetworkAuthenticationRequired: "NETWORK_AUTHENTICATION_REQUIRED",
}

// StatusCodeName returns the SCREAMING_SNAKE name of an HTTP status code
func StatusCodeName(code int) string {
	if name, ok := statusCodeNames[code]; ok {
		return name
	}

	switch code / 100 {
	case 1:
		return "INFORMATIONAL"
	case 2:
		return "SUCCESS"
	case 3:
		return "REDIRECTION"
	case 4:
		return "CLIENT_ERROR"
	case 5:
		return "SERVER_ERROR"
	default:
		return "UNKNOWN_ERROR"
	}
}
