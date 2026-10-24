package middlewares

import (
	"strconv"
	"sync"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/gofiber/fiber/v2"
)

// One long-lived container serves the API, so a per-process window is enough.
type rateLimiter struct {
	mutex   sync.Mutex
	limit   int
	window  time.Duration
	windows map[string]rateWindow
}

type rateWindow struct {
	count   int
	resetAt time.Time
}

var authRateLimiter = &rateLimiter{
	limit:   constants.AUTH_RATE_LIMIT,
	window:  constants.AUTH_RATE_LIMIT_WINDOW,
	windows: make(map[string]rateWindow),
}

func (rl *rateLimiter) take(key string) (allowed bool, remaining int, resetAt time.Time) {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()
	window, exists := rl.windows[key]
	if !exists || now.After(window.resetAt) {
		window = rateWindow{resetAt: now.Add(rl.window)}
	}

	window.count++
	rl.windows[key] = window

	if len(rl.windows) > 10000 {
		for windowKey, savedWindow := range rl.windows {
			if now.After(savedWindow.resetAt) {
				delete(rl.windows, windowKey)
			}
		}
	}

	return window.count <= rl.limit, max(0, rl.limit-window.count), window.resetAt
}

// AuthRateLimit caps credential and code endpoints per client IP and route
func AuthRateLimit(c *fiber.Ctx) error {
	clientIP, _ := c.Locals("clientIP").(string)

	allowed, remaining, resetAt := authRateLimiter.take(clientIP + " " + c.Route().Path)

	resetSeconds := strconv.Itoa(int(time.Until(resetAt).Seconds()) + 1)
	c.Set("RateLimit-Limit", strconv.Itoa(authRateLimiter.limit))
	c.Set("RateLimit-Remaining", strconv.Itoa(remaining))
	c.Set("RateLimit-Reset", resetSeconds)

	if !allowed {
		c.Set("Retry-After", resetSeconds)
		return fiber.NewError(fiber.StatusTooManyRequests, "You have made too many requests! Please try again later.")
	}

	return c.Next()
}
