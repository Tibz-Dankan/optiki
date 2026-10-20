---
name: engine
description: >-
  How optikí's agent-legibility scan engine is built: the pure engine package
  under server/internal/engine, the Snapshot/Node model, static vs rendered
  snapshots, the accessible-name subset, the rule recipe (rule file + Gym
  broken/fixed pair + catalog metadata + golden report + tests), scoring,
  fingerprints and determinism. Use when adding or changing a rule, the
  scorer, the snapshot builders, the Gym fixtures, or anything that decides a
  scan's findings or score.
---

# optikí scan engine

The product spec is `optiki.md` (§3 rule catalog, §4 scoring, §6 engine design, §9 Gym). This skill is how to build it so that it stays deterministic, testable and honest. The engine lands in PR #2 (`internal/engine`, `internal/snapshot/static`), the Gym in PR #3, rendered snapshots in PR #7.

## Layout

```
server/internal/
  engine/
    model.go            Node, Snapshot, Finding, RuleMeta, Report
    roles.go            implicit ARIA roles, widget roles, presentational-children roles
    accname.go          the accessible-name subset (static mode)
    score.go            per-category and overall scores
    fingerprint.go      stable finding identity across commits
    engine.go           Scan(snapshot) Report — runs every rule, sorts, scores, hashes
    rules/
      registry.go       the ordered list of rules
      opt101HiddenControl.go  +  opt101HiddenControl_test.go
      …                 one file per rule, named opt<ID><Name>.go
    testdata/golden/    kitchen-sink.json, perfect.json
  snapshot/static/      golang.org/x/net/html → engine.Snapshot
  snapshot/rendered/    chromedp → engine.Snapshot (CLI only)
  gym/
    gym.go              //go:embed pages/*.html — Page(id) and List()
    pages/opt-101-broken.html, opt-101-fixed.html, …, kitchen-sink.html, perfect.html
```

## Hard rules

1. **Pure.** `engine/` imports no `models`, `handlers`, Fiber, network, filesystem, clock or randomness. Input is a `Snapshot`; output is a `Report`. That purity is why it can be tested exhaustively and run identically in the server and the CLI.
2. **Deterministic.** Same snapshot ⇒ byte-identical report JSON. Findings are sorted by (rule ID, document order); maps are never iterated for output order; the report carries `engineVersion` and `rulesetHash`, and its own hash. A test asserts two runs produce the same bytes.
3. **Honest about mode.** A rule that needs rendering data returns `applicable=false` in static mode, and the report shows it as "needs rendered scan" — never as a pass. Every report states its `mode`.
4. **Explainable.** Every rule has catalog metadata — ID, name, category, severity, modes, priority, *why agents fail*, *how to fix* with a before/after snippet, WCAG reference where one exists, and its origin (the S3 failure it comes from, or "baseline").

## The model

```go
type Node struct {
    ID, Parent  int
    Children    []int
    Tag         string
    Attrs       map[string]string
    Text        string   // own text, whitespace-normalized
    Role, Name  string   // static: computed here; rendered: Chrome's
    NameFrom    string   // aria-labelledby | aria-label | native | content | title | placeholder
    Interactive bool
    Exposed     bool     // present (not ignored) in the accessibility tree
    Path        string   // stable selector path: tag:nth-of-type chain from the nearest id
    // rendered-only — nil in static mode
    Visible *bool; FontPx *float64; Cursor *string; FirstSeenMs *int
}
```

### Static accessible-name subset (in order)

1. `aria-labelledby` (concatenate the referenced nodes' text; missing ids feed OPT-205)
2. `aria-label`
3. Native source: `label[for]` / wrapping `<label>`, `alt`, `value` on input buttons, `<title>` in `<svg>`, `<legend>`, `<caption>`
4. Name from content for button, link, heading, tab, menuitem, option, summary
5. `title`
6. `placeholder` — counts as a name only so OPT-106 can flag it

Exposure: `aria-hidden="true"`, the `hidden` attribute, inline `display:none`, `role=none|presentation`, and any ancestor whose role makes its children presentational (`img`, `button`, …) remove a node from the tree. Stylesheet CSS is invisible to static mode — say so in docs, don't guess.

## Adding a rule — the recipe

1. **Catalog**: add the rule to `optiki.md` §3 (ID, flags-when, fix, severity · mode · priority, origin).
2. **Gym pair**: `gym/pages/opt-<id>-broken.html` (minimal page with exactly one violation, and a banner "Intentionally broken for OPT-xxx") and `-fixed.html` (same page, fixed). Also add one violation to `kitchen-sink.html`; keep `perfect.html` clean.
3. **Rule file**: `rules/opt<id><Name>.go` implementing `Meta()` and `Check(*Snapshot) ([]Finding, bool)`; register it in `registry.go`.
4. **Tests** (`_test.go` beside it, table-driven): the broken page yields exactly the expected findings (count, path, name); the fixed page yields none; plus edge cases that must *not* fire (decorative SVG, `alt=""`, repeated-row look-alikes downgraded to moderate, …).
5. **Golden**: regenerate `testdata/golden/*.json` deliberately (`make golden` once it exists) and review the diff — a golden change in a PR must be explainable in its description.
6. **TestSprite**: extend API test A3 (broken/fixed pairs) — see the `testsprite` skill.

## Scoring (from `optiki.md` §4)

- Audit per rule: pass (0 findings) · fail (≥ 1) · n/a (nothing applicable, or needs rendered mode).
- Category score = 100 × weight(passing applicable audits) ÷ weight(applicable audits); weights critical 10, serious 7, moderate 3, minor 1. A category with no applicable audits shows "—".
- Overall = weighted mean of present categories (Operable 40, Perceivable 30, Stable 15, Discoverable 15), re-normalized.
- Invariants under test: scores within [0, 100]; adding a violation never raises a score; removing every violation of an applicable rule never lowers one.

## Fingerprints and PR deltas

`fingerprint = sha256(ruleID + route + selectorPath + role + normalizedName)`. It must survive unrelated edits elsewhere on the page — that is why `Path` anchors on the nearest ancestor with an `id`. The diff between base and head reports are set operations on fingerprints: new, fixed, unchanged.

## Don'ts

- Don't add heuristics that depend on page size, timing or iteration order in static mode.
- Don't let a rule both flag and "explain away" in hidden ways — downgrades (e.g. repeated-row look-alikes) are explicit, documented severities.
- Don't fetch anything from the engine; `pkg.FetchPublicPage` and the snapshot builders sit outside it.
- Don't claim Google Lighthouse parity — optikí's rules target failure modes logged in real AI test runs (see `optiki.md` §1).
