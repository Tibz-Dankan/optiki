package scan

import (
	"net/url"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

// parseScanURL checks that a scan target is an absolute http(s) address and returns it with its route
func parseScanURL(raw string) (string, string, error) {
	raw = strings.TrimSpace(raw)
	parsed, err := url.Parse(raw)
	if err != nil || len(raw) > constants.MAX_SCAN_URL_LENGTH || parsed.Scheme == "" {
		return "", "", fiber.NewError(fiber.StatusBadRequest, "Enter a full http:// or https:// address!")
	}
	if (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
		return "", "", pkg.NewReasonError(fiber.StatusBadRequest, constants.ErrReasonSSRFBlocked, constants.ErrAddressNotAllowed)
	}
	route := parsed.EscapedPath()
	if route == "" {
		route = "/"
	}
	return parsed.String(), route, nil
}
