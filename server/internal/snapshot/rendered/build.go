package rendered

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"mime"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/engine"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/Tibz-Dankan/optiki/internal/snapshot/static"
	"github.com/chromedp/cdproto/accessibility"
	"github.com/chromedp/cdproto/cdp"
	"github.com/chromedp/cdproto/dom"
	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
)

// Pages are sampled until this long after navigation starts; controls are stamped as they first appear.
const sampleUntil = 3200 * time.Millisecond

type Result struct {
	FinalURL         string
	HTTPStatus       int
	ContentType      string
	RedirectCount    int
	RenderMs         int
	InputSha256      string
	InputBytes       int
	ViewportWidth    int
	ViewportHeight   int
	Screenshot       []byte
	ScreenshotWidth  int
	ScreenshotHeight int
}

type collected struct {
	OriginalHTML string   `json:"originalHTML"`
	StampedHTML  string   `json:"stampedHTML"`
	Title        string   `json:"title"`
	CLS          float64  `json:"cls"`
	Dialogs      []string `json:"dialogs"`
	ScrollHeight int      `json:"scrollHeight"`
}

type axInfo struct {
	name    string
	ignored bool
}

// Runs before any page script: measures layout shift, replaces native dialogs with recorders, and stamps
// when each control first becomes visible and enabled.
const injectedScript = `(() => {
  const state = { cls: 0, dialogs: [], firstSeen: new WeakMap() };
  Object.defineProperty(window, '__optiki', { value: state, enumerable: false });
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) state.cls += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
  for (const name of ['alert', 'confirm', 'prompt']) {
    window[name] = function () { state.dialogs.push(name); return name === 'confirm' ? false : name === 'prompt' ? null : undefined; };
  }
  const controls = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex],[role=button],[role=link],[role=checkbox],[role=radio],[role=menuitem],[role=tab],[role=switch],[role=option]';
  const shown = (el) => {
    const box = el.getBoundingClientRect();
    if (box.width === 0 || box.height === 0 || el.disabled) return false;
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) return false;
    }
    return true;
  };
  const stamp = () => {
    if (!document.documentElement) return;
    const now = performance.now();
    for (const el of document.querySelectorAll(controls)) if (!state.firstSeen.has(el) && shown(el)) state.firstSeen.set(el, now);
  };
  const timer = setInterval(() => { stamp(); if (performance.now() > 3300) clearInterval(timer); }, 50);
  const frame = () => { stamp(); if (performance.now() < 3300) requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
})();`

// Serialises the page, then stamps every element with its index and rendered facts for the Go side.
const collectScript = `(() => {
  const state = window.__optiki || { cls: 0, dialogs: [], firstSeen: new WeakMap() };
  const originalHTML = document.documentElement.outerHTML;
  const navigation = performance.getEntriesByType('navigation')[0];
  const ready = navigation ? navigation.domContentLoadedEventEnd : 0;
  const visible = (el) => {
    const box = el.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) return false;
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) return false;
    }
    return true;
  };
  const elements = [document.documentElement, ...document.documentElement.querySelectorAll('*')];
  elements.forEach((el, index) => {
    const style = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    el.setAttribute('data-optiki-i', String(index));
    el.setAttribute('data-optiki-font', style.fontSize);
    el.setAttribute('data-optiki-cursor', style.cursor);
    el.setAttribute('data-optiki-visible', visible(el) ? '1' : '0');
    el.setAttribute('data-optiki-box', [box.x + scrollX, box.y + scrollY, box.width, box.height].map((v) => Math.round(v)).join(','));
    if (state.firstSeen.has(el)) el.setAttribute('data-optiki-seen', String(Math.max(0, Math.round(state.firstSeen.get(el) - ready))));
  });
  return JSON.stringify({
    originalHTML,
    stampedHTML: document.documentElement.outerHTML,
    title: document.title,
    cls: Math.round(state.cls * 1000) / 1000,
    dialogs: state.dialogs,
    scrollHeight: Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0),
  });
})()`

func (r *Renderer) render(requestCtx, browserCtx context.Context, targetURL, route string) (engine.Snapshot, Result, error) {
	started := time.Now()
	tabCtx, cancelTab := chromedp.NewContext(browserCtx, chromedp.WithNewBrowserContext())
	defer cancelTab()
	stopWithRequest := context.AfterFunc(requestCtx, cancelTab)
	defer stopWithRequest()
	if err := chromedp.Do(tabCtx); err != nil {
		return engine.Snapshot{}, Result{}, fmt.Errorf("%w: opening a tab: %v", ErrRenderFailed, err)
	}
	ctx, cancel := context.WithTimeout(tabCtx, constants.RENDER_TIMEOUT)
	defer cancel()

	dialogs := watchDialogs(tabCtx)

	err := chromedp.Do(ctx,
		chromedp.EmulateViewport(int64(constants.RENDER_VIEWPORT_WIDTH), int64(constants.RENDER_VIEWPORT_HEIGHT)),
		chromedp.Func(func(ctx context.Context, t *chromedp.Target) error {
			_, err := cdp.Call(ctx, t, page.AddScriptToEvaluateOnNewDocument, page.AddScriptToEvaluateOnNewDocumentParams{Source: injectedScript})
			return err
		}),
	)
	if err != nil {
		return engine.Snapshot{}, Result{}, renderError(ctx, err, nil, started)
	}

	navigationStarted := time.Now()
	navigationCtx, cancelNavigation := context.WithTimeout(ctx, constants.RENDER_NAVIGATION_TIMEOUT)
	response, err := chromedp.Run(navigationCtx, chromedp.NavigateResponse(targetURL))
	cancelNavigation()
	if err != nil {
		return engine.Snapshot{}, Result{}, renderError(navigationCtx, err, r.proxy, started)
	}
	if response != nil {
		if blocked, _ := response.Headers[blockedHeader].(string); blocked != "" {
			return engine.Snapshot{}, Result{}, pkg.ErrBlockedAddress
		}
		mediaType, _, _ := mime.ParseMediaType(response.MimeType)
		if mediaType != "text/html" && mediaType != "application/xhtml+xml" {
			return engine.Snapshot{}, Result{}, pkg.ErrNotHTML
		}
	}

	if remaining := sampleUntil - time.Since(navigationStarted); remaining > 0 {
		if err := chromedp.Do(ctx, chromedp.Sleep(remaining)); err != nil {
			return engine.Snapshot{}, Result{}, renderError(ctx, err, nil, started)
		}
	}

	raw, err := chromedp.Run(ctx, chromedp.Evaluate[string](collectScript))
	if err != nil {
		return engine.Snapshot{}, Result{}, renderError(ctx, err, nil, started)
	}
	var page collected
	if err := json.Unmarshal([]byte(raw), &page); err != nil {
		return engine.Snapshot{}, Result{}, fmt.Errorf("%w: reading the page: %v", ErrRenderFailed, err)
	}

	ax, axErr := accessibilityByIndex(ctx)
	screenshot, height, shotErr := captureScreenshot(ctx, page.ScrollHeight)

	snapshot := assemble(page, targetURL, route, ax, axErr == nil)
	for _, dialog := range dialogs() {
		snapshot.Dialogs = appendUnique(snapshot.Dialogs, dialog)
	}

	sum := sha256.Sum256([]byte(page.OriginalHTML))
	result := Result{
		FinalURL:       targetURL,
		ContentType:    "text/html",
		RenderMs:       int(time.Since(started).Milliseconds()),
		InputSha256:    hex.EncodeToString(sum[:]),
		InputBytes:     len(page.OriginalHTML),
		ViewportWidth:  constants.RENDER_VIEWPORT_WIDTH,
		ViewportHeight: constants.RENDER_VIEWPORT_HEIGHT,
	}
	if response != nil {
		result.FinalURL = response.URL
		result.HTTPStatus = int(response.Status)
		result.ContentType = response.MimeType
	}
	if strings.TrimSuffix(result.FinalURL, "/") != strings.TrimSuffix(targetURL, "/") {
		result.RedirectCount = 1
	}
	if shotErr == nil {
		result.Screenshot = screenshot
		result.ScreenshotWidth = constants.RENDER_VIEWPORT_WIDTH
		result.ScreenshotHeight = height
	}
	return snapshot, result, nil
}

func renderError(ctx context.Context, err error, proxy *forwardProxy, started time.Time) error {
	if errors.Is(ctx.Err(), context.DeadlineExceeded) || errors.Is(err, context.DeadlineExceeded) {
		return ErrRenderTimeout
	}
	var loadErr *chromedp.LoadError
	if errors.As(err, &loadErr) {
		if proxy != nil && proxy.blockedSince(started) {
			return pkg.ErrBlockedAddress
		}
		switch {
		case strings.Contains(loadErr.ErrorText, "ERR_TIMED_OUT"):
			return ErrRenderTimeout
		case strings.Contains(loadErr.ErrorText, "ERR_NAME_NOT_RESOLVED"):
			return pkg.ErrHostNotFound
		}
	}
	return fmt.Errorf("%w: %v", ErrRenderFailed, err)
}

// watchDialogs dismisses any native dialog the in-page override missed, and records its type
func watchDialogs(ctx context.Context) func() []string {
	var mutex sync.Mutex
	var seen []string
	events := chromedp.Events(ctx, page.JavascriptDialogOpening)
	go func() {
		for event, err := range events {
			if err != nil {
				return
			}
			mutex.Lock()
			seen = append(seen, string(event.Type))
			mutex.Unlock()
			_ = chromedp.Do(ctx, chromedp.Func(func(ctx context.Context, t *chromedp.Target) error {
				_, err := cdp.Call(ctx, t, page.HandleJavaScriptDialog, page.HandleJavaScriptDialogParams{Accept: false})
				return err
			}))
		}
	}()
	return func() []string {
		mutex.Lock()
		defer mutex.Unlock()
		return append([]string(nil), seen...)
	}
}

// accessibilityByIndex maps each element's data-optiki-i index to Chrome's accessible name and ignored flag
func accessibilityByIndex(ctx context.Context) (map[int]axInfo, error) {
	document, err := chromedp.Run(ctx, chromedp.Action[dom.GetDocumentResult](func(ctx context.Context, t *chromedp.Target) (dom.GetDocumentResult, error) {
		depth, pierce := int64(-1), false
		return cdp.Call(ctx, t, dom.GetDocument, dom.GetDocumentParams{Depth: &depth, Pierce: &pierce})
	}))
	if err != nil {
		return nil, err
	}
	indexByBackend := map[cdp.BackendNodeID]int{}
	var walk func(node *cdp.Node)
	walk = func(node *cdp.Node) {
		if node == nil {
			return
		}
		for i := 0; i+1 < len(node.Attributes); i += 2 {
			if node.Attributes[i] == "data-optiki-i" {
				if index, err := strconv.Atoi(node.Attributes[i+1]); err == nil {
					indexByBackend[node.BackendNodeID] = index
				}
			}
		}
		for _, child := range node.Children {
			walk(child)
		}
	}
	walk(document.Root)

	tree, err := chromedp.Run(ctx, chromedp.Action[accessibility.GetFullAXTreeResult](func(ctx context.Context, t *chromedp.Target) (accessibility.GetFullAXTreeResult, error) {
		return cdp.Call(ctx, t, accessibility.GetFullAXTree, accessibility.GetFullAXTreeParams{})
	}))
	if err != nil {
		return nil, err
	}
	byIndex := map[int]axInfo{}
	for _, node := range tree.Nodes {
		index, ok := indexByBackend[node.BackendDOMNodeID]
		if !ok {
			continue
		}
		info := axInfo{ignored: node.Ignored}
		if node.Name != nil && len(node.Name.Value) > 0 {
			var name string
			if json.Unmarshal(node.Name.Value, &name) == nil {
				info.name = engine.NormalizeSpace(name)
			}
		}
		byIndex[index] = info
	}
	return byIndex, nil
}

func captureScreenshot(ctx context.Context, scrollHeight int) ([]byte, int, error) {
	height := min(max(scrollHeight, constants.RENDER_VIEWPORT_HEIGHT), constants.SCREENSHOT_MAX_HEIGHT)
	quality := int64(constants.SCREENSHOT_JPEG_QUALITY)
	beyond, surface := true, true
	result, err := chromedp.Run(ctx, chromedp.Action[page.CaptureScreenshotResult](func(ctx context.Context, t *chromedp.Target) (page.CaptureScreenshotResult, error) {
		return cdp.Call(ctx, t, page.CaptureScreenshot, page.CaptureScreenshotParams{
			Format:                page.CaptureScreenshotFormatJpeg,
			Quality:               &quality,
			Clip:                  &page.Viewport{X: 0, Y: 0, Width: float64(constants.RENDER_VIEWPORT_WIDTH), Height: float64(height), Scale: 1},
			CaptureBeyondViewport: &beyond,
			FromSurface:           &surface,
		})
	}))
	if err != nil {
		return nil, 0, err
	}
	return result.Data, height, nil
}

// assemble parses the stamped page with the static parser, so structure and selector paths match static
// scans, moves the stamps into rendered fields, annotates, then lets Chrome's tree decide names and exposure.
func assemble(page collected, targetURL, route string, ax map[int]axInfo, hasAX bool) engine.Snapshot {
	snapshot := static.Parse(page.StampedHTML, targetURL, route)
	snapshot.Mode = engine.ModeRendered
	if page.Title != "" {
		snapshot.Title = engine.NormalizeSpace(page.Title)
	}
	cls := page.CLS
	snapshot.CLS = &cls
	snapshot.Dialogs = append([]string(nil), page.Dialogs...)

	indexOf := make(map[int]int, len(snapshot.Nodes))
	for id := range snapshot.Nodes {
		node := &snapshot.Nodes[id]
		if node.Tag == engine.TextTag {
			continue
		}
		if index, err := strconv.Atoi(node.Attrs["data-optiki-i"]); err == nil {
			indexOf[id] = index
		}
		applyStamps(node)
	}

	engine.Annotate(&snapshot)

	if hasAX {
		snapshot.HasAXTree = true
		for id, index := range indexOf {
			info, ok := ax[index]
			if !ok {
				continue
			}
			node := &snapshot.Nodes[id]
			semantic := node.Role != "" && node.Role != "generic" && node.Role != "paragraph"
			if semantic {
				node.Exposed = !info.ignored && node.HiddenBy == ""
			}
			if !info.ignored && (info.name != "" || semantic) {
				node.Name = info.name
			}
		}
	}
	return snapshot
}

func applyStamps(node *engine.Node) {
	if value, ok := node.Attrs["data-optiki-font"]; ok {
		if size, err := strconv.ParseFloat(strings.TrimSuffix(value, "px"), 64); err == nil {
			node.FontPx = &size
		}
	}
	if value, ok := node.Attrs["data-optiki-cursor"]; ok {
		cursor := value
		node.Cursor = &cursor
	}
	if value, ok := node.Attrs["data-optiki-visible"]; ok {
		visible := value == "1"
		node.Visible = &visible
	}
	if value, ok := node.Attrs["data-optiki-box"]; ok {
		parts := strings.Split(value, ",")
		if len(parts) == 4 {
			numbers := make([]float64, 4)
			for i, part := range parts {
				numbers[i], _ = strconv.ParseFloat(part, 64)
			}
			node.Box = &engine.Rect{X: numbers[0], Y: numbers[1], Width: numbers[2], Height: numbers[3]}
		}
	}
	if value, ok := node.Attrs["data-optiki-seen"]; ok {
		if seen, err := strconv.Atoi(value); err == nil {
			node.FirstSeenMs = &seen
		}
	}

	keys := node.AttrKeys[:0]
	for _, key := range node.AttrKeys {
		if strings.HasPrefix(key, "data-optiki-") {
			delete(node.Attrs, key)
			continue
		}
		keys = append(keys, key)
	}
	node.AttrKeys = keys
}

func appendUnique(values []string, value string) []string {
	for _, existing := range values {
		if existing == value {
			return values
		}
	}
	return append(values, value)
}
