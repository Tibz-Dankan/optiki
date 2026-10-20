package pkg

import (
	"fmt"
	"strconv"

	"github.com/Tibz-Dankan/optiki/internal/constants"
)

// ValidateQueryLimit parses limitParam and rejects it when outside the allowed bounds
func ValidateQueryLimit(limitParam string) (float64, error) {
	minimum := constants.QUERY_MINIMUM_LIMIT
	maximum := constants.QUERY_MAXIMUM_LIMIT

	if limitParam == "" {
		return constants.QUERY_DEFAULT_LIMIT, nil
	}

	limit, err := strconv.ParseFloat(limitParam, 64)
	if err != nil || limit < minimum || limit > maximum {
		return constants.QUERY_DEFAULT_LIMIT, fmt.Errorf("Provided limit is out of range, min %d and max %d", int(minimum), int(maximum))
	}

	return limit, nil
}
