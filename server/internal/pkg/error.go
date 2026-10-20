package pkg

import (
	"errors"
	"log"

	"github.com/gofiber/fiber/v2"
)

// ReasonError is a fiber error that also names a machine-readable reason, e.g. SSRF_BLOCKED
type ReasonError struct {
	Code    int
	Reason  string
	Message string
}

func (e *ReasonError) Error() string {
	return e.Message
}

// NewReasonError returns an error the DefaultErrorHandler renders with reason as the error name
func NewReasonError(code int, reason, message string) error {
	return &ReasonError{Code: code, Reason: reason, Message: message}
}

var DefaultErrorHandler = func(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	status := "error"
	message := "Ooops, something went wrong, try again later!"
	errName := ""

	var reasonErr *ReasonError
	var fiberErr *fiber.Error

	switch {
	case errors.As(err, &reasonErr):
		code = reasonErr.Code
		errName = reasonErr.Reason
	case errors.As(err, &fiberErr):
		code = fiberErr.Code
	}

	if code >= 400 && code < 500 {
		status = "fail"
		message = err.Error()
	}

	if errName == "" {
		errName = StatusCodeName(code)
	}

	log.Printf("ERROR💥: code=%d status=%s error=%s detail=%s", code, status, errName, err.Error())

	c.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
	return c.Status(code).JSON(fiber.Map{
		"status":  status,
		"error":   errName,
		"message": message,
	})
}
