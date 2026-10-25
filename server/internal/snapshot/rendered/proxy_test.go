package rendered

import (
	"bufio"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/pkg"
)

func TestProxyRefusesPrivateAddresses(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("internal secret"))
	}))
	defer upstream.Close()

	proxy, err := startProxy(pkg.PublicDialer().DialContext, 1<<20, 5*time.Second)
	if err != nil {
		t.Fatal(err)
	}
	defer proxy.close()
	proxyURL, _ := url.Parse(proxy.address())
	client := &http.Client{Transport: &http.Transport{Proxy: http.ProxyURL(proxyURL)}, Timeout: 5 * time.Second}

	for _, target := range []string{upstream.URL, "http://127.0.0.1/", "http://169.254.169.254/latest/meta-data/", "http://10.0.0.1/"} {
		started := time.Now()
		response, err := client.Get(target)
		if err != nil {
			t.Fatalf("%s: %v", target, err)
		}
		response.Body.Close()
		if response.StatusCode != http.StatusForbidden || response.Header.Get(blockedHeader) != "1" {
			t.Errorf("%s: want 403 with %s, got %d", target, blockedHeader, response.StatusCode)
		}
		if !proxy.blockedSince(started) {
			t.Errorf("%s: the block was not recorded", target)
		}
	}

	conn, err := net.Dial("tcp", strings.TrimPrefix(proxy.address(), "http://"))
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	_, _ = conn.Write([]byte("CONNECT 127.0.0.1:443 HTTP/1.1\r\nHost: 127.0.0.1:443\r\n\r\n"))
	response, err := http.ReadResponse(bufio.NewReader(conn), nil)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != http.StatusForbidden {
		t.Errorf("CONNECT to loopback: want 403, got %d", response.StatusCode)
	}
}
