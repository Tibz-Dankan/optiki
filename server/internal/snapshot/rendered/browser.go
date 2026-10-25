package rendered

import (
	"context"
	"errors"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/engine"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/chromedp/chromedp"
)

var (
	ErrRendererBusy  = errors.New("every render slot is busy")
	ErrRenderTimeout = errors.New("the page took too long to render")
	ErrRenderFailed  = errors.New("the page could not be rendered")
)

// Renderer owns one long-lived Chromium. Each render gets its own incognito browser context, and at most
// MAX_CONCURRENT_RENDERS run at once.
type Renderer struct {
	useProxy bool
	slots    chan struct{}

	mutex      sync.Mutex
	browserCtx context.Context
	stop       func()
	proxy      *forwardProxy
}

var defaultRenderer = NewRenderer(true)

func NewRenderer(useProxy bool) *Renderer {
	return &Renderer{useProxy: useProxy, slots: make(chan struct{}, constants.MAX_CONCURRENT_RENDERS)}
}

// Build renders a public URL in the server's Chromium and returns its snapshot, metadata and screenshot
func Build(ctx context.Context, targetURL, route string) (engine.Snapshot, Result, error) {
	return defaultRenderer.Build(ctx, targetURL, route)
}

func (r *Renderer) Build(ctx context.Context, targetURL, route string) (engine.Snapshot, Result, error) {
	wait := time.NewTimer(constants.RENDER_SLOT_WAIT)
	defer wait.Stop()
	select {
	case r.slots <- struct{}{}:
	case <-wait.C:
		return engine.Snapshot{}, Result{}, ErrRendererBusy
	case <-ctx.Done():
		return engine.Snapshot{}, Result{}, ctx.Err()
	}
	defer func() { <-r.slots }()

	browserCtx, err := r.browser()
	if err != nil {
		return engine.Snapshot{}, Result{}, fmt.Errorf("%w: starting Chromium: %v", ErrRenderFailed, err)
	}
	snapshot, result, err := r.render(ctx, browserCtx, targetURL, route)
	if err != nil && browserCtx.Err() != nil {
		r.reset()
	}
	return snapshot, result, err
}

func (r *Renderer) browser() (context.Context, error) {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	if r.browserCtx != nil && r.browserCtx.Err() == nil {
		return r.browserCtx, nil
	}

	options := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.WindowSize(constants.RENDER_VIEWPORT_WIDTH, constants.RENDER_VIEWPORT_HEIGHT),
		chromedp.DisableGPU,
		chromedp.UserAgent(pkg.ScannerUserAgent),
		chromedp.Flag("force-webrtc-ip-handling-policy", "disable_non_proxied_udp"),
		chromedp.Flag("dns-prefetch-disable", true),
		chromedp.Flag("mute-audio", true),
		chromedp.Flag("hide-scrollbars", true),
	)
	if binary := os.Getenv("CHROME_BIN"); binary != "" {
		options = append(options, chromedp.ExecPath(binary))
	}
	if os.Getenv("CHROMEDP_NO_SANDBOX") == "true" {
		options = append(options, chromedp.NoSandbox)
	}
	if r.useProxy {
		if r.proxy == nil {
			proxy, err := startProxy(pkg.PublicDialer().DialContext, constants.RENDER_MAX_BYTES_PER_CONNECTION, constants.RENDER_TIMEOUT)
			if err != nil {
				return nil, err
			}
			r.proxy = proxy
		}
		// <-loopback> removes Chrome's implicit bypass, so localhost goes through the proxy and is refused too.
		options = append(options, chromedp.ProxyServer(r.proxy.address()), chromedp.Flag("proxy-bypass-list", "<-loopback>"))
	}

	allocCtx, cancelAlloc := chromedp.NewExecAllocator(context.Background(), options...)
	browserCtx, cancelBrowser := chromedp.NewContext(allocCtx)
	if err := chromedp.Do(browserCtx); err != nil {
		cancelBrowser()
		cancelAlloc()
		return nil, err
	}
	r.browserCtx = browserCtx
	r.stop = func() {
		cancelBrowser()
		cancelAlloc()
	}
	return browserCtx, nil
}

func (r *Renderer) reset() {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	if r.stop != nil {
		r.stop()
	}
	r.browserCtx, r.stop = nil, nil
}

// Close stops the browser and the proxy
func (r *Renderer) Close() {
	r.reset()
	r.mutex.Lock()
	defer r.mutex.Unlock()
	if r.proxy != nil {
		r.proxy.close()
		r.proxy = nil
	}
}
