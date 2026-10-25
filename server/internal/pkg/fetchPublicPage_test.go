package pkg

import (
	"context"
	"errors"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"syscall"
	"testing"
	"time"
)

var stubIPs = map[string][]string{
	"example.com":    {"93.184.216.34"},
	"localhost":      {"127.0.0.1"},
	"rebind.test":    {"93.184.216.34", "10.0.0.7"},
	"internal.test":  {"10.0.0.1"},
	"metadata.test":  {"169.254.169.254"},
	"v6-local.test":  {"fd00::1"},
	"public-v6.test": {"2606:4700:4700::1111"},
}

func stubResolve(_ context.Context, host string) ([]net.IP, error) {
	addresses, ok := stubIPs[host]
	if !ok {
		return nil, &net.DNSError{Err: "no such host", Name: host, IsNotFound: true}
	}
	ips := make([]net.IP, 0, len(addresses))
	for _, address := range addresses {
		ips = append(ips, net.ParseIP(address))
	}
	return ips, nil
}

func productionRules() publicFetcher {
	fetcher := defaultFetcher
	fetcher.resolve = stubResolve
	return fetcher
}

func TestValidatePublicURL(t *testing.T) {
	fetcher := productionRules()
	cases := []struct {
		url  string
		want error
	}{
		{"https://example.com/pricing", nil},
		{"http://example.com:80/", nil},
		{"https://public-v6.test/", nil},
		{"http://127.0.0.1/", ErrBlockedAddress},
		{"http://localhost/", ErrBlockedAddress},
		{"http://169.254.169.254/latest/meta-data/", ErrBlockedAddress},
		{"http://[::1]/", ErrBlockedAddress},
		{"http://[::ffff:127.0.0.1]/", ErrBlockedAddress},
		{"http://10.0.0.1/", ErrBlockedAddress},
		{"http://100.64.0.1/", ErrBlockedAddress},
		{"http://0.0.0.0/", ErrBlockedAddress},
		{"http://2130706433/", ErrBlockedAddress},
		{"http://0x7f000001/", ErrBlockedAddress},
		{"http://0177.0.0.1/", ErrBlockedAddress},
		{"http://127.1/", ErrBlockedAddress},
		{"http://internal.test/", ErrBlockedAddress},
		{"http://metadata.test/", ErrBlockedAddress},
		{"http://v6-local.test/", ErrBlockedAddress},
		{"http://rebind.test/", ErrBlockedAddress},
		{"file:///etc/passwd", ErrBlockedAddress},
		{"ftp://example.com/", ErrBlockedAddress},
		{"gopher://example.com/", ErrBlockedAddress},
		{"https://example.com:8443/", ErrBlockedAddress},
		{"https://user:pass@example.com/", ErrBlockedAddress},
		{"not a url", ErrBlockedAddress},
		{"https://nowhere.test/", ErrHostNotFound},
	}
	for _, c := range cases {
		t.Run(c.url, func(t *testing.T) {
			_, err := fetcher.validate(context.Background(), c.url)
			if c.want == nil && err != nil || c.want != nil && !errors.Is(err, c.want) {
				t.Fatalf("want %v, got %v", c.want, err)
			}
		})
	}
}

func TestPublicOnlyControl(t *testing.T) {
	cases := map[string]bool{
		"93.184.216.34:443":  true,
		"93.184.216.34:80":   true,
		"93.184.216.34:8080": false,
		"127.0.0.1:80":       false,
		"10.1.2.3:443":       false,
		"[::1]:443":          false,
		"[fe80::1]:80":       false,
		"169.254.169.254:80": false,
	}
	for address, allowed := range cases {
		if err := publicOnlyControl("tcp", address, nil); (err == nil) != allowed {
			t.Errorf("%s: allowed=%v, got err=%v", address, allowed, err)
		}
	}
}

func TestDialRefusesPrivateAddresses(t *testing.T) {
	fetcher := productionRules()
	for _, address := range []string{"internal.test:80", "127.0.0.1:443", "example.com:22", "rebind.test:443"} {
		if _, err := fetcher.dial(context.Background(), "tcp", address); !errors.Is(err, ErrBlockedAddress) {
			t.Errorf("%s: want ErrBlockedAddress, got %v", address, err)
		}
	}
}

// localFetcher reaches the loopback test server as "site.test": only that one address and port count as
// public, so every other rule (redirect re-validation, size, type, time) is the production one.
func localFetcher(t *testing.T, server *httptest.Server, timeout time.Duration) (publicFetcher, string) {
	t.Helper()
	_, port, _ := net.SplitHostPort(strings.TrimPrefix(server.URL, "http://"))
	loopback := net.ParseIP("127.0.0.1")
	fetcher := publicFetcher{
		resolve: func(ctx context.Context, host string) ([]net.IP, error) {
			if host == "site.test" {
				return []net.IP{loopback}, nil
			}
			return stubResolve(ctx, host)
		},
		isPublic: func(ip net.IP) bool { return ip.Equal(loopback) || IsPublicIP(ip) },
		ports:    map[string]bool{port: true, "80": true, "443": true},
		control:  func(string, string, syscall.RawConn) error { return nil },
		timeout:  timeout,
	}
	return fetcher, "http://site.test:" + port
}

func TestFetchPublicPage(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/page", func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("User-Agent") != ScannerUserAgent {
			http.Error(w, "missing user agent", http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte("<!doctype html><title>Hi</title>"))
	})
	mux.HandleFunc("/hop", func(w http.ResponseWriter, r *http.Request) { http.Redirect(w, r, "/page", http.StatusFound) })
	mux.HandleFunc("/json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	})
	mux.HandleFunc("/huge", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		_, _ = w.Write([]byte(strings.Repeat("a", MaxFetchBytes+10)))
	})
	mux.HandleFunc("/slow", func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(600 * time.Millisecond)
		w.Header().Set("Content-Type", "text/html")
	})
	mux.HandleFunc("/to-private", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "http://internal.test/", http.StatusFound)
	})
	mux.HandleFunc("/loop", func(w http.ResponseWriter, r *http.Request) { http.Redirect(w, r, "/loop", http.StatusFound) })
	server := httptest.NewServer(mux)
	defer server.Close()

	fetcher, base := localFetcher(t, server, 400*time.Millisecond)
	cases := []struct {
		path      string
		want      error
		redirects int
	}{
		{"/page", nil, 0},
		{"/hop", nil, 1},
		{"/json", ErrNotHTML, 0},
		{"/huge", ErrPageTooLarge, 0},
		{"/slow", ErrFetchTimeout, 0},
		{"/to-private", ErrBlockedAddress, 0},
		{"/loop", ErrTooManyRedirects, 0},
	}
	for _, c := range cases {
		t.Run(c.path, func(t *testing.T) {
			page, err := fetcher.fetch(context.Background(), base+c.path)
			if c.want != nil {
				if !errors.Is(err, c.want) {
					t.Fatalf("want %v, got %v", c.want, err)
				}
				return
			}
			if err != nil || !strings.Contains(string(page.Body), "<title>Hi</title>") || page.StatusCode != 200 {
				t.Fatalf("want the page, got %v %+v", err, page)
			}
			if page.Redirects != c.redirects || !strings.HasSuffix(page.FinalURL, "/page") {
				t.Errorf("redirects=%d finalURL=%s", page.Redirects, page.FinalURL)
			}
		})
	}
}
