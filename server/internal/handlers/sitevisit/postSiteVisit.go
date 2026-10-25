package sitevisit

import (
	"log"
	"strings"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type PostSiteVisitInput struct {
	Path        string `json:"path"`
	CapturedAt  string `json:"capturedAt"`
	AnonymousID string `json:"anonymousID"`
	Device      string `json:"device"`
}

var PostSiteVisit = func(c *fiber.Ctx) error {
	device := models.Device{}
	location := models.Location{}
	siteVisit := models.SiteVisit{}

	input := PostSiteVisitInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if !strings.HasPrefix(input.Path, "/") || len(input.Path) > constants.MAX_SITE_VISIT_PATH_LENGTH {
		return fiber.NewError(fiber.StatusBadRequest, constants.ErrInvalidSiteVisitPath)
	}

	capturedAt, err := time.Parse(time.RFC3339, input.CapturedAt)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, constants.ErrInvalidCapturedAt)
	}

	anonymousID, err := uuid.Parse(input.AnonymousID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, constants.ErrInvalidAnonymousID)
	}

	deviceName := []rune(strings.TrimSpace(input.Device))
	if len(deviceName) == 0 {
		deviceName = []rune(constants.UNKNOWN_DEVICE_NAME)
	}
	if len(deviceName) > constants.MAX_DEVICE_NAME_LENGTH {
		deviceName = deviceName[:constants.MAX_DEVICE_NAME_LENGTH]
	}

	var userID *string
	if user, ok := c.Locals("user").(models.User); ok {
		userID = &user.ID
	}

	savedDevice, err := device.FindOrCreate(userID, string(deviceName))
	if err != nil {
		log.Printf("Error finding or creating the site visit device: %v", err)
	}

	clientIP, _ := c.Locals("clientIP").(string)
	savedLocation, err := location.GetOrCreateByIP(clientIP)
	if err != nil {
		log.Printf("Error resolving the site visit location: %v", err)
	}

	siteVisit.UserID = userID
	siteVisit.AnonymousID = anonymousID.String()
	siteVisit.Page = pkg.ResolvePageName(input.Path)
	siteVisit.Path = input.Path
	siteVisit.CapturedAt = capturedAt
	if savedDevice.ID != "" {
		siteVisit.DeviceID = &savedDevice.ID
	}
	if savedLocation.ID != "" {
		siteVisit.LocationID = &savedLocation.ID
	}

	newSiteVisit, err := siteVisit.Create(siteVisit)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	response := fiber.Map{
		"status":  "success",
		"message": "Visit created successfully!",
		"data": fiber.Map{
			"id":         newSiteVisit.ID,
			"page":       newSiteVisit.Page,
			"path":       newSiteVisit.Path,
			"capturedAt": newSiteVisit.CapturedAt,
		},
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}
