package links

import (
	"reflect"
	"testing"

	"github.com/Tibz-Dankan/optiki/internal/snapshot/static"
)

func TestExtract(t *testing.T) {
	tests := []struct {
		name    string
		html    string
		pageURL string
		want    []string
	}{
		{
			name:    "resolves relative, root-relative and absolute links in document order",
			html:    `<a href="/about">About</a><a href="team">Team</a><a href="../up">Up</a><a href="https://example.com/blog/">Blog</a>`,
			pageURL: "https://example.com/company/index.html",
			want: []string{
				"https://example.com/about", "https://example.com/company/team", "https://example.com/up",
				"https://example.com/blog/",
			},
		},
		{
			name:    "strips fragments and queries and keeps each page once",
			html:    `<a href="/pricing?utm=nav">Pricing</a><a href="/pricing#plans">Plans</a><a href="/pricing">Again</a>`,
			pageURL: "https://example.com/",
			want:    []string{"https://example.com/pricing"},
		},
		{
			name: "skips non-web schemes, same-page fragments, empty hrefs and downloads",
			html: `<a href="mailto:hi@example.com">Mail</a><a href="tel:+1">Call</a><a href="javascript:void(0)">JS</a>` +
				`<a href="#top">Top</a><a href="">Self</a><a href="/report" download>Report</a><a>No href</a>` +
				`<a href="ftp://example.com/file">FTP</a><a href="/docs">Docs</a>`,
			pageURL: "https://example.com/",
			want:    []string{"https://example.com/docs"},
		},
		{
			name:    "skips asset and download files",
			html:    `<a href="/guide.pdf">PDF</a><a href="/logo.PNG">Logo</a><a href="/feed.xml">Feed</a><a href="/app.js">JS</a><a href="/v1.2/notes">Notes</a>`,
			pageURL: "https://example.com/",
			want:    []string{"https://example.com/v1.2/notes"},
		},
		{
			name:    "reads area links and hidden links, not svg links",
			html:    `<map><area href="/region" alt="Region"></map><nav hidden><a href="/menu">Menu</a></nav><svg><a href="/vector"><text>V</text></a></svg>`,
			pageURL: "https://example.com/",
			want:    []string{"https://example.com/region", "https://example.com/menu"},
		},
		{
			name:    "resolves against the first base href",
			html:    `<head><base href="https://example.com/docs/"><base href="/ignored/"></head><a href="intro">Intro</a>`,
			pageURL: "https://example.com/",
			want:    []string{"https://example.com/docs/intro"},
		},
		{
			name:    "lowercases the host and drops default ports",
			html:    `<a href="https://EXAMPLE.com:443/a">A</a><a href="http://example.com:80/b">B</a><a href="https://example.com:8443/c">C</a>`,
			pageURL: "https://example.com/",
			want:    []string{"https://example.com/a", "http://example.com/b", "https://example.com:8443/c"},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			snapshot := static.Build(test.html, test.pageURL, "/")
			got := Extract(snapshot, test.pageURL)
			if !reflect.DeepEqual(got, test.want) {
				t.Fatalf("Extract() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestSameSite(t *testing.T) {
	tests := []struct {
		link, origin string
		want         bool
	}{
		{"https://example.com/about", "https://example.com", true},
		{"https://www.example.com/about", "https://example.com", true},
		{"https://example.com/about", "https://www.example.com", true},
		{"http://example.com/about", "https://example.com", true},
		{"https://EXAMPLE.com/about", "https://example.com", true},
		{"https://blog.example.com/", "https://example.com", false},
		{"https://example.org/", "https://example.com", false},
		{"https://example.com:8443/", "https://example.com", false},
		{"https://example.com.evil.test/", "https://example.com", false},
		{"not a url", "https://example.com", false},
	}

	for _, test := range tests {
		if got := SameSite(test.link, test.origin); got != test.want {
			t.Errorf("SameSite(%q, %q) = %v, want %v", test.link, test.origin, got, test.want)
		}
	}
}

func TestKey(t *testing.T) {
	same := []string{"https://example.com/docs", "https://example.com/docs/", "http://www.example.com/docs", "https://EXAMPLE.com:443/docs"}
	for _, raw := range same {
		if got := Key(raw); got != "example.com/docs" {
			t.Errorf("Key(%q) = %q, want %q", raw, got, "example.com/docs")
		}
	}
	if Key("https://example.com/") != Key("https://example.com") {
		t.Error("the root with and without a slash should share a key")
	}
	if Key("https://example.com/Docs") == Key("https://example.com/docs") {
		t.Error("paths are case-sensitive")
	}
}
