package scan

import (
	"errors"
	"strconv"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

var GetScans = func(c *fiber.Ctx) error {
	scan := models.Scan{}
	limitParam := c.Query("limit")
	cursorParam := c.Query("cursor")

	user, ok := c.Locals("user").(models.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, constants.ErrNotLoggedIn)
	}

	limit, err := pkg.ValidateQueryLimit(limitParam)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	filters, err := scanFilters(c)
	if err != nil {
		return err
	}

	scans, err := scan.FindAllByUser(user.ID, filters, limit+1, cursorParam)
	if errors.Is(err, models.ErrCursorNotFound) {
		return fiber.NewError(fiber.StatusBadRequest, "Unknown cursor!")
	}
	if err != nil {
		return pkg.ListQueryError(err)
	}

	var nextCursor string = ""
	var hasNextItems bool = false
	if len(scans) > int(limit) {
		scans = scans[:len(scans)-1]
		nextCursor = scans[len(scans)-1].ID
		hasNextItems = true
	}

	data := []fiber.Map{}
	for _, savedScan := range scans {
		data = append(data, scanSummaryData(c.UserContext(), savedScan, user.ID))
	}

	pagination := map[string]interface{}{
		"limit":        limit,
		"nextCursor":   nextCursor,
		"hasNextItems": hasNextItems,
		"count":        len(data),
	}

	response := fiber.Map{
		"status":     "success",
		"data":       data,
		"pagination": pagination,
	}

	return c.Status(fiber.StatusOK).JSON(response)
}

func scanFilters(c *fiber.Ctx) (models.ScanFilters, error) {
	filters := models.ScanFilters{
		Status:      strings.ToUpper(c.Query("status")),
		InputType:   strings.ToUpper(c.Query("inputType")),
		TriggeredBy: strings.ToUpper(c.Query("triggeredBy")),
		CommitSHA:   strings.ToLower(c.Query("commitSHA")),
	}
	allowed := map[string][]string{
		"status":      {constants.SCAN_STATUS_RUNNING, constants.SCAN_STATUS_COMPLETED, constants.SCAN_STATUS_FAILED},
		"inputType":   {constants.SCAN_INPUT_HTML, constants.SCAN_INPUT_URL, constants.SCAN_INPUT_GYM},
		"triggeredBy": {constants.SCAN_TRIGGERED_BY_USER, constants.SCAN_TRIGGERED_BY_API_TOKEN},
	}
	for name, value := range map[string]string{"status": filters.Status, "inputType": filters.InputType, "triggeredBy": filters.TriggeredBy} {
		if value != "" && !oneOf(value, allowed[name]) {
			return filters, fiber.NewError(fiber.StatusBadRequest, "Unknown "+name+" \""+value+"\"! Use one of "+strings.Join(allowed[name], ", ")+".")
		}
	}
	if filters.CommitSHA != "" && !commitSHAPattern.MatchString(filters.CommitSHA) {
		return filters, fiber.NewError(fiber.StatusBadRequest, "The commitSHA must be 7 to 64 hex characters!")
	}
	if raw := c.Query("prNumber"); raw != "" {
		number, err := strconv.Atoi(raw)
		if err != nil || number < 1 {
			return filters, fiber.NewError(fiber.StatusBadRequest, "The prNumber must be a positive number!")
		}
		filters.PRNumber = &number
	}
	return filters, nil
}

func oneOf(value string, options []string) bool {
	for _, option := range options {
		if value == option {
			return true
		}
	}
	return false
}
