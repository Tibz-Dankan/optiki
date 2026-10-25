# Rendered snapshots

`internal/snapshot/rendered` turns a live page in the server's Chromium into an `engine.Snapshot` with the rendered-only fields filled in, plus a `Result`: final URL, status, timings and the screenshot. Verified users and API tokens get one for URL scans; anonymous scans and HTML/Gym input stay static.

The SSRF-safe proxy, launch flags, render slots and budgets are in the backend skill's `references/scans.md`. This file covers what is collected and how it becomes a `Snapshot`.

## Pipeline (`build.go`)

1. **New browser context** (`chromedp.WithNewBrowserContext`, incognito) and viewport 1280×800.
2. **Before any page script** (`page.AddScriptToEvaluateOnNewDocument`), one injected script:
   - sums `layout-shift` entries without `hadRecentInput` (buffered `PerformanceObserver`);
   - replaces `alert`/`confirm`/`prompt` with recorders, so no native dialog blocks the page (OPT-107). A CDP dialog watcher dismisses any that slip through;
   - stamps when each control first becomes visible and enabled — box > 0, no `display:none`/`visibility:hidden`/`opacity < 0.1` up the tree, not `disabled`. It checks every 50 ms and on every animation frame until 3.3 s.
3. **Navigate** with `chromedp.NavigateResponse` (8 s timeout). That gives the document's status, MIME type and final URL.
   - A response carrying the proxy's `X-Optiki-Blocked` header, or a tunnel failure while the proxy recorded a block, is `pkg.ErrBlockedAddress`.
   - A non-HTML MIME type is `pkg.ErrNotHTML`.
4. **Wait** until 3.2 s after navigation started, so the samples cover the first look and the late arrivals.
5. **Collect** with one script that:
   - serialises `document.documentElement.outerHTML` first, for `inputSha256`/`inputBytes`;
   - stamps every element with `data-optiki-i` (its index), `-font` (computed font-size), `-cursor`, `-visible`, `-box` (page coordinates) and `-seen` (first-visible time **measured from DOMContentLoaded**, so a slow server doesn't make every control "late");
   - returns the stamped HTML, `document.title`, CLS, recorded dialogs and scroll height.
6. **Map Chrome's tree.** `dom.GetDocument` (depth −1) maps backend node IDs to `data-optiki-i`. `accessibility.GetFullAXTree` then gives each element Chrome's accessible name and its ignored flag.
7. **Screenshot.** `page.CaptureScreenshot`: JPEG quality 80, clip 1280 × `min(max(scrollHeight, 800), 6000)`, `captureBeyondViewport`.
8. **Assemble.** Parse the stamped HTML with the **static parser** (`static.Parse`), so structure, document order and selector paths are identical to a static scan. Then:
   - move the stamps into `FontPx`, `Cursor`, `Visible`, `Box` and `FirstSeenMs`, and strip the `data-optiki-*` attributes;
   - run `engine.Annotate`;
   - overlay Chrome: for semantic roles, `Exposed = !ignored`; for nodes Chrome exposes, `Name` = Chrome's name;
   - set `HasAXTree`. `NameFrom` stays the static one, which OPT-106 and OPT-201 rely on.

If the AX tree call fails, the snapshot keeps the static names and roles over the rendered DOM (`HasAXTree = false`). It is still a rendered snapshot with every rendered field.

## Fields nil in static mode

| Field | Rule that reads it |
|---|---|
| `Visible` | everywhere through `IsHiddenFromEveryone`; OPT-101 skips controls nobody can see |
| `FontPx` | OPT-204 (controls, labels and headings below 12 CSS px) |
| `Cursor` | OPT-104 rendered branch (an element that sets `cursor:pointer` itself, outside any control, with none inside) |
| `FirstSeenMs` | OPT-301 (first visible more than 1,000 ms after DOMContentLoaded) |
| `Box` | evidence only (`box`), never a rule's condition |
| `Snapshot.CLS` | OPT-302 (CLS > 0.1) |
| `Snapshot.Dialogs` | OPT-107 rendered branch (a page-level finding) |
| `Snapshot.HasAXTree` | OPT-101's `IGNORED` case (Chrome drops a visible control for a reason static mode can't see) |

A rendered-only rule is `NEEDS_RENDERED` in a static scan. In a rendered scan it is `NOT_APPLICABLE` when its field is absent (no CLS measured, no control sampled).

## Determinism and tests

The engine is deterministic for a given snapshot. The *snapshot* of a live page is not, because animation timing and network order vary. So:

- Rule tests for rendered-only rules use **snapshots with the fields set by hand**, not live Chrome.
- `build_test.go` drives the real Chromium against the embedded Gym pages on a loopback `httptest` server, with a `Renderer` that skips the proxy (which rightly refuses loopback). It asserts facts that don't depend on timing:
  - each rendered pair fails or passes its rule;
  - a rendered kitchen-sink fails all 17 rules;
  - a rendered perfect page scores 100;
  - the screenshot is a JPEG 1280 wide.

  It skips without Chrome or with `-short`.
- `proxy_test.go` checks the proxy refuses loopback, metadata and private addresses (plain HTTP and `CONNECT`), without Chrome.
- The fixed viewport, `deviceScaleFactor` 1 and a fixed user agent keep run-to-run variance down. Don't add jitter or retries that hide it.

Pinned: `chromedp` v0.21 (generic `Action[T]`, `cdp.Call`) and `cdproto` v0.158.
