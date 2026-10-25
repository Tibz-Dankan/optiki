package pkg

import (
	"context"
	"errors"
	"fmt"
	"io"
	"mime"
	"net"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"syscall"
	"time"
)

var (
	ErrNotHTML          = errors.New("the address did not return an HTML page")
	ErrPageTooLarge     = errors.New("the page is larger than 2 MB")
	ErrFetchTimeout     = errors.New("the page took too long to load")
	ErrHostNotFound     = errors.New("the address could not be found")
	ErrFetchFailed      = errors.New("the page could not be loaded")
	ErrTooManyRedirects = errors.New("the address redirected too many times")
)

const (
	FetchTimeout     = 8 * time.Second
	MaxFetchBytes    = 2 << 20
	MaxRedirects     = 3
	ScannerUserAgent = "optiki-scanner/0.1 (+https://optikii.netlify.app)"
)

type PublicPage struct {
	Body        []byte
	FinalURL    string
	StatusCode  int
	ContentType string
	Redirects   int
	Duration    time.Duration
}

type publicFetcher struct {
	resolve  func(ctx context.Context, host string) ([]net.IP, error)
	isPublic func(ip net.IP) bool
	ports    map[string]bool
	control  func(network, address string, conn syscall.RawConn) error
	timeout  time.Duration
}

var defaultFetcher = publicFetcher{
	resolve:  resolveHost,
	isPublic: IsPublicIP,
	ports:    map[string]bool{"80": true, "443": true},
	control:  publicOnlyControl,
	timeout:  FetchTimeout,
}

// ValidatePublicURL is the pre-flight check for a user-supplied URL: http(s), ports 80/443, no credentials,
// and a host that resolves only to public addresses
func ValidatePublicURL(ctx context.Context, raw string) (*url.URL, error) {
	return defaultFetcher.validate(ctx, raw)
}

// FetchPublicPage is the only way the server fetches a user-supplied URL: every hop is validated, the dialed
// IP is re-checked, and the response must be HTML under 2 MB within 8 seconds
func FetchPublicPage(ctx context.Context, raw string) (PublicPage, error) {
	return defaultFetcher.fetch(ctx, raw)
}

func resolveHost(ctx context.Context, host string) ([]net.IP, error) {
	addresses, err := net.DefaultResolver.LookupIPAddr(ctx, host)
	if err != nil {
		return nil, err
	}
	ips := make([]net.IP, 0, len(addresses))
	for _, address := range addresses {
		ips = append(ips, address.IP)
	}
	return ips, nil
}

func (f publicFetcher) validate(ctx context.Context, raw string) (*url.URL, error) {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || parsed.Host == "" {
		return nil, ErrBlockedAddress
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return nil, ErrBlockedAddress
	}
	if parsed.User != nil {
		return nil, ErrBlockedAddress
	}
	if port := parsed.Port(); port != "" && !f.ports[port] {
		return nil, ErrBlockedAddress
	}

	host := strings.TrimSuffix(strings.ToLower(parsed.Hostname()), ".")
	if host == "" {
		return nil, ErrBlockedAddress
	}
	if _, err := f.publicIPs(ctx, host); err != nil {
		return nil, err
	}
	return parsed, nil
}

// publicIPs resolves a host and requires every address to be public. Numeric spellings like 2130706433 or
// 0x7f.1 are IPv4 addresses to many resolvers, so they are read as such rather than looked up.
func (f publicFetcher) publicIPs(ctx context.Context, host string) ([]net.IP, error) {
	var ips []net.IP
	if ip := net.ParseIP(host); ip != nil {
		ips = []net.IP{ip}
	} else if ip, ok := parseLegacyIPv4(host); ok {
		ips = []net.IP{ip}
	} else {
		resolved, err := f.resolve(ctx, host)
		if err != nil || len(resolved) == 0 {
			return nil, ErrHostNotFound
		}
		ips = resolved
	}
	for _, ip := range ips {
		if !f.isPublic(ip) {
			return nil, ErrBlockedAddress
		}
	}
	return ips, nil
}

// dial connects to an address this fetcher resolved and checked itself, never to whatever the system
// resolver returns at dial time; the dialer's Control re-checks the IP actually dialed.
func (f publicFetcher) dial(ctx context.Context, network, address string) (net.Conn, error) {
	host, port, err := net.SplitHostPort(address)
	if err != nil || !f.ports[port] {
		return nil, ErrBlockedAddress
	}
	ips, err := f.publicIPs(ctx, strings.TrimSuffix(strings.ToLower(host), "."))
	if err != nil {
		return nil, err
	}
	dialer := &net.Dialer{Timeout: 5 * time.Second, Control: f.control}
	var lastErr error
	for _, ip := range ips {
		conn, err := dialer.DialContext(ctx, network, net.JoinHostPort(ip.String(), port))
		if err == nil {
			return conn, nil
		}
		lastErr = err
	}
	return nil, lastErr
}

func (f publicFetcher) fetch(ctx context.Context, raw string) (PublicPage, error) {
	started := time.Now()
	target, err := f.validate(ctx, raw)
	if err != nil {
		return PublicPage{}, err
	}

	ctx, cancel := context.WithTimeout(ctx, f.timeout)
	defer cancel()

	redirects := 0
	client := &http.Client{
		Transport: &http.Transport{
			Proxy:                 nil,
			DialContext:           f.dial,
			TLSHandshakeTimeout:   5 * time.Second,
			ResponseHeaderTimeout: f.timeout,
			MaxIdleConns:          1,
			DisableKeepAlives:     true,
		},
		CheckRedirect: func(request *http.Request, via []*http.Request) error {
			if len(via) > MaxRedirects {
				return ErrTooManyRedirects
			}
			if _, err := f.validate(request.Context(), request.URL.String()); err != nil {
				return err
			}
			redirects = len(via)
			return nil
		},
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, target.String(), nil)
	if err != nil {
		return PublicPage{}, ErrBlockedAddress
	}
	request.Header.Set("User-Agent", ScannerUserAgent)
	request.Header.Set("Accept", "text/html,application/xhtml+xml;q=0.9")

	response, err := client.Do(request)
	if err != nil {
		return PublicPage{}, classifyFetchError(err)
	}
	defer response.Body.Close()

	contentType := response.Header.Get("Content-Type")
	mediaType, _, _ := mime.ParseMediaType(contentType)
	if mediaType != "text/html" && mediaType != "application/xhtml+xml" {
		return PublicPage{}, ErrNotHTML
	}
	if length := response.ContentLength; length > MaxFetchBytes {
		return PublicPage{}, ErrPageTooLarge
	}

	body, err := io.ReadAll(io.LimitReader(response.Body, MaxFetchBytes+1))
	if err != nil {
		return PublicPage{}, classifyFetchError(err)
	}
	if len(body) > MaxFetchBytes {
		return PublicPage{}, ErrPageTooLarge
	}

	return PublicPage{
		Body:        body,
		FinalURL:    response.Request.URL.String(),
		StatusCode:  response.StatusCode,
		ContentType: contentType,
		Redirects:   redirects,
		Duration:    time.Since(started),
	}, nil
}

func classifyFetchError(err error) error {
	for _, known := range []error{ErrBlockedAddress, ErrTooManyRedirects, ErrHostNotFound} {
		if errors.Is(err, known) {
			return known
		}
	}
	var netErr net.Error
	if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || (errors.As(err, &netErr) && netErr.Timeout()) {
		return ErrFetchTimeout
	}
	var dnsErr *net.DNSError
	if errors.As(err, &dnsErr) {
		return ErrHostNotFound
	}
	return fmt.Errorf("%w: %v", ErrFetchFailed, err)
}

// parseLegacyIPv4 reads inet_aton spellings: 1 to 4 dot-separated parts, each decimal, octal (0…) or hex (0x…)
func parseLegacyIPv4(host string) (net.IP, bool) {
	parts := strings.Split(host, ".")
	if len(parts) > 4 {
		return nil, false
	}
	values := make([]uint64, len(parts))
	for index, part := range parts {
		if part == "" {
			return nil, false
		}
		value, err := strconv.ParseUint(part, 0, 32)
		if err != nil {
			return nil, false
		}
		values[index] = value
	}

	var address uint64
	last := len(values) - 1
	for index := 0; index < last; index++ {
		if values[index] > 255 {
			return nil, false
		}
		address |= values[index] << (8 * (3 - uint(index)))
	}
	if values[last] >= 1<<(8*(4-uint(last))) {
		return nil, false
	}
	address |= values[last]
	return net.IPv4(byte(address>>24), byte(address>>16), byte(address>>8), byte(address)), true
}
