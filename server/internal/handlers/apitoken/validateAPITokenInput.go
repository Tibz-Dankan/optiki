package apitoken

import (
	"sort"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/data"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/gofiber/fiber/v2"
)

func validateName(raw string) (string, error) {
	name := strings.TrimSpace(raw)
	if name == "" {
		return "", fiber.NewError(fiber.StatusBadRequest, "API token name is required!")
	}
	if len([]rune(name)) > constants.API_TOKEN_MAX_NAME_LENGTH {
		return "", fiber.NewError(fiber.StatusBadRequest, "API token name must be at most 64 characters!")
	}
	return name, nil
}

// resolvePermissions checks each name against the grantable list, drops duplicates, and returns the names
// and their permission row ids
func resolvePermissions(requested []string) ([]string, []string, error) {
	seen := map[string]bool{}
	var names []string
	for _, raw := range requested {
		name := strings.TrimSpace(raw)
		if !data.IsGrantablePermission(name) {
			grantable := make([]string, 0, len(data.APITokenPermissions))
			for _, permission := range data.APITokenPermissions {
				grantable = append(grantable, permission.Name)
			}
			return nil, nil, fiber.NewError(fiber.StatusBadRequest, "Invalid permission \""+name+"\"! Use one of "+strings.Join(grantable, ", ")+".")
		}
		if !seen[name] {
			seen[name] = true
			names = append(names, name)
		}
	}
	if len(names) == 0 {
		return nil, nil, fiber.NewError(fiber.StatusBadRequest, "Select at least one permission!")
	}
	sort.Strings(names)

	permission := models.Permission{}
	rows, err := permission.FindByNames(names)
	if err != nil {
		return nil, nil, fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if len(rows) != len(names) {
		return nil, nil, fiber.NewError(fiber.StatusInternalServerError, "API token permissions are not seeded")
	}
	ids := make([]string, 0, len(rows))
	for _, row := range rows {
		ids = append(ids, row.ID)
	}
	return names, ids, nil
}
