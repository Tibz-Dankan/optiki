package scan

import (
	"errors"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

type CreateScanInput struct {
	HTML        *string `json:"html"`
	URL         *string `json:"url"`
	Gym         *string `json:"gym"`
	Route       *string `json:"route"`
	Title       *string `json:"title"`
	Repository  *string `json:"repository"`
	Branch      *string `json:"branch"`
	CommitSHA   *string `json:"commitSHA"`
	PRNumber    *int    `json:"prNumber"`
	RunURL      *string `json:"runURL"`
	AnonymousID *string `json:"anonymousID"`

	MultiplePageScan *bool `json:"multiplePageScan"`
}

var CreateScan = func(c *fiber.Ctx) error {
	if !c.Is("json") {
		return fiber.NewError(fiber.StatusUnsupportedMediaType, "Send the scan as JSON (Content-Type: application/json)!")
	}
	if len(c.Body()) == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "Provide exactly one of html, url or gym!")
	}

	input := CreateScanInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "The request body isn't valid JSON!")
	}

	caller := resolveScanCaller(c)
	request, err := validateScanInput(input, caller)
	if err != nil {
		return err
	}

	if request.multiplePageScan {
		if caller.apiToken == nil {
			user, signedIn := c.Locals("user").(models.User)
			if !signedIn {
				return fiber.NewError(fiber.StatusUnauthorized, "Sign in to scan multiple pages!")
			}
			if !user.EmailVerified {
				return pkg.NewReasonError(fiber.StatusForbidden, constants.ErrReasonEmailNotVerified, "Verify your email to scan multiple pages!")
			}
		}
		return createMultiplePageScan(c, caller, request)
	}

	if request.anonymousID != nil {
		scanModel := models.Scan{}
		count, err := scanModel.CountUnclaimedByAnonymousID(*request.anonymousID)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		if count >= constants.ANONYMOUS_SCAN_LIMIT {
			return pkg.NewReasonError(fiber.StatusForbidden, constants.ErrReasonAnonymousScanLimit, constants.ErrAnonymousScanLimit)
		}
	}

	scan, err := runScan(c.UserContext(), caller, request)
	if err != nil {
		var reason *pkg.ReasonError
		if errors.As(err, &reason) && reason.Reason == constants.ErrReasonRendererBusy {
			c.Set(fiber.HeaderRetryAfter, "10")
		}
		return err
	}

	response := fiber.Map{
		"status":  "success",
		"message": "Scan completed",
		"data":    scanReportData(c.UserContext(), scan, viewerID(c)),
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}
