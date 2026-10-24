# Rendered snapshots

`internal/snapshot/rendered` turns a live page in the server's Chromium into an `engine.Snapshot` with the rendered-only fields filled in. Verified users and API tokens get one for URL scans; anonymous scans and HTML/Gym input stay static.

The browser's lifecycle, the SSRF-safe forward proxy, launch flags, concurrency and budgets are in the backend skill's `references/scans.md`. This file covers what is collected and how it becomes a `Snapshot`.

## Pipeline

1. **New browser context** for this scan (incognito), viewport 1280×800, `deviceScaleFactor` 1.
2. **Before navigation**, inject one script with `page.AddScriptToEvaluateOnNewDocument`. It:
   - starts a `PerformanceObserver` for `layout-shift` entries, summing those without `hadRecentInput` into `window.__optikiCLS`;
   - records `alert`/`confirm`/`prompt` calls (OPT-107), which are also auto-dismissed through `page.EventJavascriptDialogOpening`;
   - stamps first visibility: a `MutationObserver` plus `requestAnimationFrame` loop that records the first time each interactive element is visible and enabled, into `window.__optikiFirstSeen`.
3. **Navigate** and wait for the load event plus network idle (no requests for 500 ms), within the 8 s navigation timeout.
4. **Sample** controls at 500, 1,000 and 3,000 ms after navigation started. The 1,000 ms sample is the one OPT-301 judges against.
5. **Collect** with one script returning, for every element:
   - tag and attributes
   - own text
   - computed `font-size`, `cursor`, `visibility`/`display`/`opacity`
   - the bounding box
   - the first-seen stamp
   - its DOM backend node id
6. **Fetch Chrome's accessibility tree** with `accessibility.GetFullAXTree` (cdproto) and merge it with the collected nodes by backend node ID.
   - **Chrome's role, name and "ignored" flag are authoritative** in rendered mode. They overwrite `Role`, `Name` and `Exposed`; `NameFrom` maps Chrome's name source onto the static enum.
7. **Serialise** `document.documentElement.outerHTML` once, for `inputSha256`/`inputBytes`. It is discarded afterwards.
8. **Build** the `Snapshot`:
   - `Mode = "RENDERED"`
   - `CLS` from `window.__optikiCLS` at 3 s
   - `Dialogs` from the recorder
   - `Title` and `Lang` from the document
   - every node's `Visible`, `FontPx`, `Cursor`, `FirstSeenMs` and `Box` set

If `GetFullAXTree` fails, fall back to collector-only mode: names and roles are computed by the static accname code over the rendered DOM, and the snapshot is marked so the report says "rendered (no accessibility tree)". Never silently pass.

## Fields nil in static mode

| Field | Rule that reads it |
|---|---|
| `Visible` | OPT-301 (with `FirstSeenMs`), OPT-104 rendered branch |
| `FontPx` | OPT-204 (controls, labels and headings below 12 CSS px) |
| `Cursor` | OPT-104 rendered branch (`cursor:pointer` on a non-interactive element with no role) |
| `FirstSeenMs` | OPT-301 (in the final snapshot but not visible/enabled at the 1,000 ms sample) |
| `Box` | evidence only (`box`), never a rule's condition |
| `Snapshot.CLS` | OPT-302 (CLS > 0.1 within 3 s) |
| `Snapshot.Dialogs` | OPT-107 rendered branch |

A rule reading any of these returns `applicable=false` when it is nil. That is the whole mechanism behind `NEEDS_RENDERED`.

## Determinism

The engine is deterministic for a given snapshot. The *snapshot* of a live page is not: animation timing, network order and ads all vary. So:

- Tests for rendered-only rules use **hand-built snapshots**, not live Chrome.
- `snapshot/rendered` has integration tests against the embedded Gym pages, behind a `CHROME_BIN` check. They assert facts that don't depend on timing: roles, names, exposure, and that a 2,000 ms entrance animation yields `FirstSeenMs > 1000`.
- Fixed viewport, fixed `deviceScaleFactor`, and no random user agent keep run-to-run variance down. Don't add jitter or retries that hide it.

Verify the exact cdproto calls against the pinned chromedp/cdproto versions before relying on them.
