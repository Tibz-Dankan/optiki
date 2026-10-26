package links

import (
	"net"
	"net/url"
	"path"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/engine"
)

var assetExtensions = map[string]bool{
	".pdf": true, ".zip": true, ".gz": true, ".tgz": true, ".tar": true, ".rar": true, ".7z": true, ".dmg": true,
	".exe": true, ".msi": true, ".apk": true, ".iso": true, ".bin": true,
	".png": true, ".jpg": true, ".jpeg": true, ".gif": true, ".webp": true, ".avif": true, ".svg": true,
	".ico": true, ".bmp": true, ".tif": true, ".tiff": true, ".heic": true,
	".mp3": true, ".mp4": true, ".m4a": true, ".m4v": true, ".wav": true, ".ogg": true, ".webm": true,
	".mov": true, ".avi": true, ".mkv": true, ".flac": true,
	".css": true, ".js": true, ".mjs": true, ".map": true, ".json": true, ".xml": true, ".rss": true,
	".atom": true, ".txt": true, ".csv": true, ".ics": true, ".wasm": true,
	".doc": true, ".docx": true, ".xls": true, ".xlsx": true, ".ppt": true, ".pptx": true, ".odt": true,
	".ods": true, ".odp": true, ".rtf": true, ".epub": true,
	".woff": true, ".woff2": true, ".ttf": true, ".otf": true, ".eot": true,
}

// Extract returns a snapshot's page links in document order: absolute http(s) URLs without fragment or
// query, asset files left out, each once. Links resolve against the first <base href>, else pageURL.
func Extract(snapshot engine.Snapshot, pageURL string) []string {
	base, err := url.Parse(pageURL)
	if err != nil {
		return nil
	}
	for _, node := range snapshot.Nodes {
		if node.Tag != "base" || node.Namespace != "" {
			continue
		}
		if href := strings.TrimSpace(node.Attrs["href"]); href != "" {
			if resolved, err := base.Parse(href); err == nil {
				base = resolved
			}
			break
		}
	}

	seen := map[string]bool{}
	found := []string{}
	for _, node := range snapshot.Nodes {
		if node.Namespace != "" || (node.Tag != "a" && node.Tag != "area") {
			continue
		}
		href, ok := node.Attrs["href"]
		if !ok {
			continue
		}
		if _, download := node.Attrs["download"]; download {
			continue
		}
		link, ok := normalize(base, href)
		if !ok || seen[link] {
			continue
		}
		seen[link] = true
		found = append(found, link)
	}
	return found
}

func normalize(base *url.URL, href string) (string, bool) {
	href = strings.TrimSpace(href)
	if href == "" || strings.HasPrefix(href, "#") {
		return "", false
	}
	resolved, err := base.Parse(href)
	if err != nil {
		return "", false
	}
	scheme := strings.ToLower(resolved.Scheme)
	if (scheme != "http" && scheme != "https") || resolved.Hostname() == "" || resolved.User != nil {
		return "", false
	}
	pagePath := resolved.EscapedPath()
	if pagePath == "" {
		pagePath = "/"
	}
	if assetExtensions[strings.ToLower(path.Ext(pagePath))] {
		return "", false
	}
	return scheme + "://" + hostWithPort(resolved, false) + pagePath, true
}

// SameSite reports whether a link stays on the origin's site: the same host, ignoring a leading "www.",
// and the same port, where a scheme's default port counts as none
func SameSite(raw, origin string) bool {
	link, err := url.Parse(raw)
	if err != nil {
		return false
	}
	site, err := url.Parse(origin)
	if err != nil {
		return false
	}
	return link.Hostname() != "" && hostWithPort(link, true) == hostWithPort(site, true)
}

// Key identifies a page within a site: host without "www." and path without a trailing slash, so
// http/https, www and trailing-slash variants of one page count once
func Key(raw string) string {
	parsed, err := url.Parse(raw)
	if err != nil {
		return raw
	}
	return hostWithPort(parsed, true) + strings.TrimSuffix(parsed.EscapedPath(), "/")
}

func hostWithPort(parsed *url.URL, stripWWW bool) string {
	host := strings.TrimSuffix(strings.ToLower(parsed.Hostname()), ".")
	if stripWWW {
		host = strings.TrimPrefix(host, "www.")
	}
	port := parsed.Port()
	scheme := strings.ToLower(parsed.Scheme)
	if (scheme == "http" && port == "80") || (scheme == "https" && port == "443") {
		port = ""
	}
	if port != "" {
		return net.JoinHostPort(host, port)
	}
	if strings.Contains(host, ":") {
		return "[" + host + "]"
	}
	return host
}
