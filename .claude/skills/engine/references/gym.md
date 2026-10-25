# The Gym

Fixture pages that are test data, demos and documentation at once. The single source is `server/internal/gym/pages/`.

`gym.go` embeds the pages (`//go:embed pages/*.html`) and exposes `Page(id)` and `List()`, so:

- `{"gym": "opt-101-broken"}` scans need no network.
- The same files are served at `/gym/pages/<id>.html`, so URL scans (and rendered scans) can open them.
- TestSprite opens them in the browser.

Nothing is copied into the client.

## Pairs

Every rule has a `opt-<id>-broken.html` and an `opt-<id>-fixed.html`:

- The broken page has exactly one violation of its rule and a visible banner: "Intentionally broken for OPT-xxx". That is one *finding*, except OPT-103, where one look-alike pair is two findings.
- The fixed page is the same page, fixed, and has no violation of any rule.

| Pair | Scene | Set |
|---|---|---|
| opt-101 | A seek button inside a `role="img"` iteration ring (a nod to Ouroboros) | CORE |
| opt-102 | Icon-only toolbar | CORE |
| opt-103 | Two "Iteration 2" buttons that do different things (fixed: "Seek to…" / "Open…") | CORE |
| opt-104 | `<div>` "buttons" | CORE |
| opt-106 | Placeholder-only sign-up form | CORE |
| opt-201 | A "Press ? for shortcuts" hint with a masking `aria-label` | CORE |
| opt-202 | SVG-only stats card | CORE |
| opt-203 | Image link without `alt` (the link has text, so it isn't also OPT-102) | CORE |
| opt-401 | No `<title>`, `<h1>` or `<main>` | CORE |
| opt-105 | A "Delete" button inside a card link | FULL |
| opt-205 | A labelled search field whose `aria-describedby` points at a missing hint | FULL |
| opt-402 | A `role="dialog"` with no name | FULL |
| opt-403 | An embedded map `<iframe>` with no `title` | FULL |
| opt-107 | `onclick="return confirm('Delete?')"` | FULL |
| opt-204 | 10 px button labels (rendered only) | FULL |
| opt-301 | Controls that fade in over 2 s (rendered only) | FULL |
| opt-302 | A promo block that grows to 520 px after 600 ms and pushes a full-width article down (rendered only) | FULL |

The three rendered-only pairs only show their violation in a rendered scan of their `/gym/pages/…` URL. Scanned statically, they come back `NEEDS_RENDERED`, and the test asserts exactly that.

## kitchen-sink and perfect

- `kitchen-sink.html`:
  - One violation of each of the **14 static-capable rules**, plus the rendered triggers (tiny text, a late control, a layout shift).
  - A `CORE` scan fails exactly the 9 P0 rules.
  - A `FULL` static scan fails 14 and marks 3 `NEEDS_RENDERED`.
  - A `FULL` rendered scan fails all 17.
- `perfect.html` has no violations, and it scores 100 in every set and mode.

Both have golden reports per set (`engine/testdata/golden/kitchen-sink.core.json`, `.full.json`, `perfect.core.json`, `perfect.full.json`).

## The SSRF fixture

`GET /gym/redirect-private` is a Fiber route, not a page. It answers `302` to `http://127.0.0.1/`, so tests can prove that redirects are re-validated. The target is fixed, so it isn't an open redirect.

## Rules for fixture pages

- Each broken page must fail only its own rule. `rules/registry_test.go` enforces it for every pair, statically, and `snapshot/rendered/build_test.go` for the rendered pairs.
- OPT-302 needs a big enough shift: CLS divides the move by the larger viewport side (1280), so the shifted content must fill much of the viewport.
- Self-contained: no external scripts, fonts or images. Inline SVG and data URIs only. They must render identically offline.
- Keep each page minimal. A pair differs only in the fix.
- The banner text names the rule ID exactly; TestSprite UI tests assert it.
- `GET /api/v1/gym` lists the pairs with their rule ID, set, and scene title.
