package rendered

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/engine"
	"github.com/Tibz-Dankan/optiki/internal/engine/rules"
	"github.com/Tibz-Dankan/optiki/internal/gym"
)

// The integration tests drive the real Chromium against the embedded Gym pages on a loopback server, so
// they bypass the proxy (which rightly refuses loopback). They skip when no Chrome is installed.
func requireChrome(t *testing.T) {
	t.Helper()
	if testing.Short() {
		t.Skip("rendered integration tests are skipped with -short")
	}
	if ChromePath() == "" {
		t.Skip("no Chrome or Chromium found")
	}
}

func gymServer(t *testing.T) *httptest.Server {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/gym/pages/"), ".html")
		page, ok := gym.Page(id)
		if !ok {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(page))
	}))
	t.Cleanup(server.Close)
	return server
}

func TestRenderedGymPages(t *testing.T) {
	requireChrome(t)
	server := gymServer(t)
	renderer := NewRenderer(false)
	defer renderer.Close()
	full, _ := rules.Set(rules.RuleSetFull)

	cases := []struct {
		page    string
		failing []string
		passing []string
	}{
		{"opt-204-broken", []string{"OPT-204"}, nil},
		{"opt-204-fixed", nil, []string{"OPT-204"}},
		{"opt-301-broken", []string{"OPT-301"}, nil},
		{"opt-301-fixed", nil, []string{"OPT-301"}},
		{"opt-302-broken", []string{"OPT-302"}, nil},
		{"opt-302-fixed", nil, []string{"OPT-302"}},
		{"opt-101-broken", []string{"OPT-101"}, nil},
		{"opt-107-broken", []string{"OPT-107"}, nil},
	}
	for _, c := range cases {
		t.Run(c.page, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			snapshot, result, err := renderer.Build(ctx, server.URL+gym.Route(c.page), gym.Route(c.page))
			if err != nil {
				t.Fatal(err)
			}
			if snapshot.Mode != engine.ModeRendered || !snapshot.HasAXTree {
				t.Fatalf("want a rendered snapshot with Chrome's tree, got mode=%s ax=%v", snapshot.Mode, snapshot.HasAXTree)
			}
			report := engine.Scan(snapshot, full)
			results := map[string]string{}
			for _, rule := range report.Rules {
				results[rule.RuleID] = rule.Result
			}
			for _, id := range c.failing {
				if results[id] != engine.ResultFail {
					t.Errorf("%s: want FAIL, got %s (findings %+v)", id, results[id], report.Findings)
				}
			}
			for _, id := range c.passing {
				if results[id] != engine.ResultPass {
					t.Errorf("%s: want PASS, got %s (findings %+v)", id, results[id], report.Findings)
				}
			}
			for _, finding := range report.Findings {
				if !contains(c.failing, finding.RuleID) {
					t.Errorf("unexpected finding on %s: %s %s", c.page, finding.RuleID, finding.Message)
				}
			}
			if result.HTTPStatus != 200 || result.InputSha256 == "" || result.InputBytes == 0 {
				t.Errorf("result metadata: %+v", result)
			}
			if !bytes.HasPrefix(result.Screenshot, []byte{0xFF, 0xD8}) || result.ScreenshotWidth != 1280 || result.ScreenshotHeight < 800 {
				t.Errorf("want a JPEG screenshot 1280 wide, got %d bytes %dx%d", len(result.Screenshot), result.ScreenshotWidth, result.ScreenshotHeight)
			}
		})
	}
}

func TestRenderedKitchenSinkFailsEveryRule(t *testing.T) {
	requireChrome(t)
	server := gymServer(t)
	renderer := NewRenderer(false)
	defer renderer.Close()
	full, _ := rules.Set(rules.RuleSetFull)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	snapshot, _, err := renderer.Build(ctx, server.URL+gym.Route(gym.KitchenSink), gym.Route(gym.KitchenSink))
	if err != nil {
		t.Fatal(err)
	}
	report := engine.Scan(snapshot, full)
	if report.Counts.RulesFailed != 17 {
		for _, rule := range report.Rules {
			if rule.Result != engine.ResultFail {
				t.Logf("%s: %s", rule.RuleID, rule.Result)
			}
		}
		t.Fatalf("a rendered kitchen-sink scan must fail all 17 rules, failed %d", report.Counts.RulesFailed)
	}

	perfect, _, err := renderer.Build(ctx, server.URL+gym.Route(gym.Perfect), gym.Route(gym.Perfect))
	if err != nil {
		t.Fatal(err)
	}
	if report := engine.Scan(perfect, full); len(report.Findings) != 0 || *report.Scores.Overall != 100 {
		t.Fatalf("a rendered perfect page must score 100, got %v %+v", *report.Scores.Overall, report.Findings)
	}
}

func contains(values []string, value string) bool {
	for _, candidate := range values {
		if candidate == value {
			return true
		}
	}
	return false
}
