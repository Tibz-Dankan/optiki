package pkg

import (
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"

	"github.com/Tibz-Dankan/optiki/internal/constants"
)

var ipGeolocationClient = &http.Client{Timeout: constants.IP_GEOLOCATION_TIMEOUT}

// LookupIPGeolocation returns ip-api.com's JSON for a public IP, and nil without a lookup for any other address
func LookupIPGeolocation(ip string) (json.RawMessage, error) {
	parsedIP := net.ParseIP(ip)
	if parsedIP == nil || !IsPublicIP(parsedIP) {
		return nil, nil
	}

	response, err := ipGeolocationClient.Get(constants.IP_GEOLOCATION_URL + parsedIP.String())
	if err != nil {
		return nil, fmt.Errorf("geolocation lookup failed: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("geolocation lookup answered %d", response.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(response.Body, constants.IP_GEOLOCATION_MAX_BYTES))
	if err != nil {
		return nil, fmt.Errorf("reading geolocation response: %w", err)
	}

	var result struct {
		Status string `json:"status"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("geolocation response is not valid JSON: %w", err)
	}
	if result.Status != "success" {
		return nil, fmt.Errorf("geolocation lookup answered status %q", result.Status)
	}

	return body, nil
}
