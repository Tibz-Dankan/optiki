package scan

import (
	"net/url"
	"regexp"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/gym"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

var commitSHAPattern = regexp.MustCompile(`^[0-9a-fA-F]{7,64}$`)
var repositoryPattern = regexp.MustCompile(`^[A-Za-z0-9_.-]{1,39}/[A-Za-z0-9_.-]{1,100}$`)

// scanRequest is a validated create-scan input.
type scanRequest struct {
	inputType   string
	html        string
	url         string
	gymID       string
	route       string
	title       *string
	repository  *string
	branch      *string
	commitSHA   *string
	prNumber    *int
	runURL      *string
	anonymousID *string
}

func validateScanInput(input CreateScanInput, caller scanCaller) (scanRequest, error) {
	request := scanRequest{}
	provided := 0
	if input.HTML != nil {
		provided++
	}
	if input.URL != nil {
		provided++
	}
	if input.Gym != nil {
		provided++
	}
	if provided != 1 {
		return request, fiber.NewError(fiber.StatusBadRequest, "Provide exactly one of html, url or gym!")
	}

	switch {
	case input.HTML != nil:
		if len(*input.HTML) > constants.MAX_SCAN_HTML_BYTES {
			return request, pkg.NewReasonError(fiber.StatusRequestEntityTooLarge, constants.ErrReasonTooLarge, "The HTML is larger than 2 MB!")
		}
		if strings.TrimSpace(*input.HTML) == "" {
			return request, fiber.NewError(fiber.StatusBadRequest, "The HTML is empty!")
		}
		request.inputType = constants.SCAN_INPUT_HTML
		request.html = *input.HTML
		request.route = "/"
	case input.URL != nil:
		raw := strings.TrimSpace(*input.URL)
		parsed, err := url.Parse(raw)
		if err != nil || len(raw) > constants.MAX_SCAN_URL_LENGTH || parsed.Scheme == "" {
			return request, fiber.NewError(fiber.StatusBadRequest, "Enter a full http:// or https:// address!")
		}
		if (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
			return request, pkg.NewReasonError(fiber.StatusBadRequest, constants.ErrReasonSSRFBlocked, constants.ErrAddressNotAllowed)
		}
		request.inputType = constants.SCAN_INPUT_URL
		request.url = parsed.String()
		request.route = parsed.EscapedPath()
		if request.route == "" {
			request.route = "/"
		}
	case input.Gym != nil:
		id := strings.TrimSpace(*input.Gym)
		if _, ok := gym.Page(id); !ok {
			return request, fiber.NewError(fiber.StatusBadRequest, "Unknown Gym page \""+id+"\"!")
		}
		request.inputType = constants.SCAN_INPUT_GYM
		request.gymID = id
		request.route = gym.Route(id)
	}

	if input.Route != nil {
		route := strings.TrimSpace(*input.Route)
		if !strings.HasPrefix(route, "/") || len(route) > constants.MAX_SCAN_ROUTE_LENGTH {
			return request, fiber.NewError(fiber.StatusBadRequest, "The route must start with / and be at most 512 characters!")
		}
		request.route = route
	}
	if input.Title != nil {
		title := strings.TrimSpace(*input.Title)
		if len([]rune(title)) > constants.MAX_SCAN_TITLE_LENGTH {
			return request, fiber.NewError(fiber.StatusBadRequest, "The title must be at most 120 characters!")
		}
		if title != "" {
			request.title = &title
		}
	}

	hasCIFields := input.Repository != nil || input.Branch != nil || input.CommitSHA != nil || input.PRNumber != nil || input.RunURL != nil
	if hasCIFields && caller.apiToken == nil {
		return request, fiber.NewError(fiber.StatusBadRequest, "Only API tokens can set CI fields!")
	}
	if input.Repository != nil {
		if !repositoryPattern.MatchString(*input.Repository) {
			return request, fiber.NewError(fiber.StatusBadRequest, "The repository must look like owner/name!")
		}
		request.repository = input.Repository
	}
	if input.Branch != nil {
		branch := strings.TrimSpace(*input.Branch)
		if branch == "" || len(branch) > 255 {
			return request, fiber.NewError(fiber.StatusBadRequest, "The branch must be 1 to 255 characters!")
		}
		request.branch = &branch
	}
	if input.CommitSHA != nil {
		if !commitSHAPattern.MatchString(*input.CommitSHA) {
			return request, fiber.NewError(fiber.StatusBadRequest, "The commitSHA must be 7 to 64 hex characters!")
		}
		sha := strings.ToLower(*input.CommitSHA)
		request.commitSHA = &sha
	}
	if input.PRNumber != nil {
		if *input.PRNumber < 1 {
			return request, fiber.NewError(fiber.StatusBadRequest, "The prNumber must be a positive number!")
		}
		request.prNumber = input.PRNumber
	}
	if input.RunURL != nil {
		parsed, err := url.Parse(*input.RunURL)
		if err != nil || (parsed.Scheme != "https" && parsed.Scheme != "http") || len(*input.RunURL) > constants.MAX_SCAN_URL_LENGTH {
			return request, fiber.NewError(fiber.StatusBadRequest, "The runURL must be an http(s) address!")
		}
		request.runURL = input.RunURL
	}
	if caller.triggeredBy == constants.SCAN_TRIGGERED_BY_ANONYMOUS {
		if input.AnonymousID == nil {
			return request, fiber.NewError(fiber.StatusBadRequest, constants.ErrInvalidAnonymousID)
		}
		parsed, err := uuid.Parse(*input.AnonymousID)
		if err != nil {
			return request, fiber.NewError(fiber.StatusBadRequest, constants.ErrInvalidAnonymousID)
		}
		anonymousID := parsed.String()
		request.anonymousID = &anonymousID
	}
	return request, nil
}
