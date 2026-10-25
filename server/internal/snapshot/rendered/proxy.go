package rendered

import (
	"context"
	"errors"
	"io"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/pkg"
)

const blockedHeader = "X-Optiki-Blocked"

var hopByHopHeaders = []string{
	"Connection", "Keep-Alive", "Proxy-Authenticate", "Proxy-Authorization", "Proxy-Connection", "Te", "Trailer",
	"Transfer-Encoding", "Upgrade",
}

type dialFunc func(ctx context.Context, network, address string) (net.Conn, error)

// forwardProxy carries every request Chrome makes. It dials only through the public-only dialer, so the
// private-address rule covers subresources, redirects, fetches and WebSockets, not just the first URL.
type forwardProxy struct {
	listener  net.Listener
	server    *http.Server
	dial      dialFunc
	transport *http.Transport
	maxBytes  int64
	timeout   time.Duration

	mutex   sync.Mutex
	blocked time.Time
}

func startProxy(dial dialFunc, maxBytes int64, timeout time.Duration) (*forwardProxy, error) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, err
	}
	proxy := &forwardProxy{listener: listener, dial: dial, maxBytes: maxBytes, timeout: timeout}
	proxy.transport = &http.Transport{
		Proxy:                 nil,
		DialContext:           dial,
		ResponseHeaderTimeout: timeout,
		TLSHandshakeTimeout:   5 * time.Second,
		IdleConnTimeout:       30 * time.Second,
		MaxIdleConnsPerHost:   4,
	}
	proxy.server = &http.Server{Handler: proxy, ReadHeaderTimeout: 5 * time.Second}
	go func() { _ = proxy.server.Serve(listener) }()
	return proxy, nil
}

func (p *forwardProxy) address() string {
	return "http://" + p.listener.Addr().String()
}

func (p *forwardProxy) close() {
	_ = p.server.Close()
	p.transport.CloseIdleConnections()
}

// blockedSince reports whether the proxy refused a private address since t
func (p *forwardProxy) blockedSince(t time.Time) bool {
	p.mutex.Lock()
	defer p.mutex.Unlock()
	return !p.blocked.Before(t)
}

func (p *forwardProxy) recordBlock() {
	p.mutex.Lock()
	p.blocked = time.Now()
	p.mutex.Unlock()
}

func (p *forwardProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodConnect {
		p.tunnel(w, r)
		return
	}
	if !r.URL.IsAbs() || r.URL.Scheme != "http" {
		p.refuse(w)
		return
	}
	p.forward(w, r)
}

func (p *forwardProxy) refuse(w http.ResponseWriter) {
	p.recordBlock()
	w.Header().Set(blockedHeader, "1")
	http.Error(w, "optikí only loads public web addresses", http.StatusForbidden)
}

func (p *forwardProxy) tunnel(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	upstream, err := p.dial(ctx, "tcp", r.Host)
	if err != nil {
		if errors.Is(err, pkg.ErrBlockedAddress) {
			p.refuse(w)
			return
		}
		http.Error(w, "upstream unreachable", http.StatusBadGateway)
		return
	}

	hijacker, ok := w.(http.Hijacker)
	if !ok {
		upstream.Close()
		http.Error(w, "tunnelling unsupported", http.StatusInternalServerError)
		return
	}
	client, buffered, err := hijacker.Hijack()
	if err != nil {
		upstream.Close()
		return
	}
	deadline := time.Now().Add(p.timeout)
	_ = client.SetDeadline(deadline)
	_ = upstream.SetDeadline(deadline)
	if _, err := client.Write([]byte("HTTP/1.1 200 Connection established\r\n\r\n")); err != nil {
		client.Close()
		upstream.Close()
		return
	}

	done := make(chan struct{}, 2)
	go func() {
		_, _ = io.Copy(upstream, io.MultiReader(buffered, client))
		done <- struct{}{}
	}()
	go func() {
		_, _ = io.Copy(client, io.LimitReader(upstream, p.maxBytes))
		done <- struct{}{}
	}()
	<-done
	client.Close()
	upstream.Close()
}

func (p *forwardProxy) forward(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), p.timeout)
	defer cancel()
	outgoing := r.Clone(ctx)
	outgoing.RequestURI = ""
	for _, header := range hopByHopHeaders {
		outgoing.Header.Del(header)
	}

	response, err := p.transport.RoundTrip(outgoing)
	if err != nil {
		if errors.Is(err, pkg.ErrBlockedAddress) {
			p.refuse(w)
			return
		}
		http.Error(w, "upstream unreachable", http.StatusBadGateway)
		return
	}
	defer response.Body.Close()

	for _, header := range hopByHopHeaders {
		response.Header.Del(header)
	}
	for key, values := range response.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}
	w.WriteHeader(response.StatusCode)
	_, _ = io.Copy(w, io.LimitReader(response.Body, p.maxBytes))
}
