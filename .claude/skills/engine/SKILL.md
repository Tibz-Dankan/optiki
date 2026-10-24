---
name: engine
description: >-
  How optikí's agent-legibility scan engine is built: the pure engine package
  under server/internal/engine, the Snapshot/Node model, static vs rendered
  snapshots (rendered runs in the server's Chromium), the accessible-name
  subset, rule sets (CORE = the 9 must-have rules for anonymous scans, FULL =
  all 17 for verified users and API tokens), the rule recipe (rule file + Gym
  broken/fixed pair + catalog metadata + golden reports + tests), scoring,
  fingerprints and determinism. Use when adding or changing a rule, the rule
  sets, the scorer, the snapshot builders, the Gym fixtures, or anything that
  decides a scan's findings or score.
---

# optikí scan engine

The rule catalog is `optiki.md` §3 (ID, flags-when, fix, severity · mode · priority, origin), and scoring is §4. This skill is how to build it so that it stays deterministic, testable and honest. Who may scan, how a URL is fetched or rendered, and how results are stored are backend concerns: see the backend skill's `references/scans.md`.

| File | Read it when |
|---|---|
| `references/rendered-snapshot.md` | Working on `snapshot/rendered` (chromedp, the AX tree, sampling) or a rendered-only rule |
| `references/gym.md` | Adding or changing a fixture page, kitchen-sink, perfect, or the SSRF fixture |

## Layout

```
server/internal/
  engine/
    model.go            Node, Snapshot, Finding, RuleMeta, Report, Options
    roles.go            implicit ARIA roles, widget roles, presentational-children roles
    accname.go          the accessible-name subset (static mode)
    ruleSets.go         CORE and FULL — which rule IDs each contains
    score.go            per-category and overall scores
    fingerprint.go      stable finding identity across commits
    engine.go           Scan(snapshot, options) Report — runs the set's rules, sorts, scores, hashes
    rules/
      registry.go       the ordered list of every rule
      opt101HiddenControl.go  +  opt101HiddenControl_test.go
      …                 one file per rule, named opt<ID><Name>.go
    testdata/golden/    kitchen-sink.core.json, kitchen-sink.full.json, perfect.core.json, perfect.full.json
  snapshot/static/      golang.org/x/net/html → engine.Snapshot
  snapshot/rendered/    chromedp + the server's Chromium → engine.Snapshot (+ proxy.go, the SSRF-safe forward proxy)
  gym/
    gym.go              //go:embed pages/*.html — Page(id) and List()
    pages/opt-101-broken.html, opt-101-fixed.html, …, kitchen-sink.html, perfect.html
```

## Hard rules

1. **Pure.** `engine/` imports no `models`, `handlers`, Fiber, network, filesystem, clock or randomness. Input is a `Snapshot` plus `Options`; output is a `Report`. That purity is why it can be tested exhaustively.
2. **Deterministic.** The same snapshot and options give a byte-identical report JSON.
   - Findings are sorted by (rule ID, document order).
   - Maps are never iterated for output order.
   - The report carries `engineVersion`, `ruleSet`, `rulesetHash` and its own `reportHash`.
   - A test asserts two runs produce the same bytes.
   - A rendered scan's *snapshot* varies with timing; the engine's output for a given snapshot never does.
3. **Honest about mode.** A rule that needs rendering data returns `applicable=false` in static mode. The report shows it as `NEEDS_RENDERED` ("needs rendered scan"), never as a pass. Every report states its `mode`.
4. **Explainable.** Every rule has catalog metadata in `Meta()`:
   - ID, name, category, severity, modes, priority
   - *why agents fail*, and *how to fix* with a before/after snippet
   - a WCAG reference where one exists
   - its origin: the S3 failure it comes from, or "baseline"
5. **The engine doesn't know who is asking.** The caller passes `Options.RuleSet`. Choosing it from the session or token is the backend's job (`resolveScanCaller`).

## Rule sets

| Set | Rules | Used for |
|---|---|---|
| `CORE` | the 9 P0 rules: 101, 102, 103, 104, 106, 201, 202, 203, 401 | anonymous scans (no session, or an unverified one) |
| `FULL` | all 17: `CORE` plus P1 105, 205, 402, 403, 204, 301, 302 and P2 107 | verified users and API tokens |

- `RuleMeta.Priority` (`P0`, `P1`, `P2`) is the source of truth: `CORE` is exactly the P0 rules. `ruleSets.go` derives both sets from the registry, so adding a rule never means editing a second list.
- `engine.Scan` runs only the rules in the set, in registry order. Rules outside the set don't appear in the report at all — not as passes, not as n/a.
- `rulesetHash` = SHA-256 over the set's sorted `ruleID@ruleVersion` entries. Two reports compare only when their `rulesetHash` matches.
- Of the 17 rules, 14 can run statically and 3 are rendered-only (204, 301, 302). A `FULL` static scan therefore reports those 3 as `NEEDS_RENDERED`, and a static scan has no Stable score.

## The model

```go
type Node struct {
    ID, Parent  int
    Children    []int
    Tag         string
    Attrs       map[string]string
    Text        string   // own text, whitespace-normalized
    Role, Name  string   // static: computed here; rendered: Chrome's
    NameFrom    string   // ARIA_LABELLEDBY | ARIA_LABEL | NATIVE | CONTENT | TITLE | PLACEHOLDER
    Interactive bool
    Exposed     bool     // present (not ignored) in the accessibility tree
    Path        string   // stable selector path: tag:nth-of-type chain from the nearest id
    // rendered-only — nil in static mode
    Visible *bool; FontPx *float64; Cursor *string; FirstSeenMs *int; Box *Rect
}
type Snapshot struct { URL, Route, Mode string; Title, Lang string; Nodes []Node; CLS *float64; Dialogs []string }
type Options  struct { RuleSet string } // CORE, FULL
type Rule interface {
    Meta() RuleMeta                                   // ID, category, severity, modes, priority, docs
    Check(s *Snapshot) (findings []Finding, applicable bool)
}
```

A `Finding` carries the rule ID, the effective severity, the node's path, tag, role, name and `NameFrom`, a snippet, a one-sentence message, and a small `Evidence` map. The backend stores each of these as a column (`scan_findings`); see the backend skill's `references/data-model.md` for the evidence keys each rule uses.

### Static accessible-name subset (in order)

1. `aria-labelledby` (concatenate the referenced nodes' text; missing ids feed OPT-205)
2. `aria-label`
3. Native source: `label[for]` / wrapping `<label>`, `alt`, `value` on input buttons, `<title>` in `<svg>`, `<legend>`, `<caption>`
4. Name from content for button, link, heading, tab, menuitem, option, summary
5. `title`
6. `placeholder` — counts as a name only so OPT-106 can flag it

Exposure: these remove a node from the tree:

- `aria-hidden="true"`
- the `hidden` attribute
- inline `display:none`
- `role=none|presentation`
- any ancestor whose role makes its children presentational (`img`, `button`, …)

Stylesheet CSS is invisible to static mode — say so in docs, don't guess.

## Adding a rule — the recipe

1. **Catalog**: add the rule to `optiki.md` §3 with its ID, flags-when, fix, severity · mode · priority and origin. The priority decides its rule set.
2. **Gym pair**: add a broken and a fixed page (`references/gym.md`) and one violation to `kitchen-sink.html`; keep `perfect.html` clean.
3. **Rule file**: `rules/opt<id><Name>.go` implementing `Meta()` and `Check(*Snapshot) ([]Finding, bool)`. Register it in `registry.go`, which sets its set membership through its priority.
4. **Tests** (`_test.go` beside it, table-driven):
   - The broken page yields exactly the expected findings (count, path, name, evidence); the fixed page yields none.
   - Edge cases that must *not* fire: decorative SVG, `alt=""`, repeated-row look-alikes downgraded to moderate, …
   - Rendered-only rules are tested on hand-built snapshots with the rendered fields set, plus a static snapshot asserting `applicable=false`.
5. **Golden**: regenerate `testdata/golden/*.json` deliberately (`make golden` once it exists) and review the diff. A golden change in a PR must be explainable in its description. A new P0 rule changes both `core` and `full` goldens; a P1/P2 rule changes only `full`.
6. **TestSprite**: extend API test A3 (broken/fixed pairs) — see the `testsprite` skill.

## Scoring (from `optiki.md` §4)

- Each rule in the set gets one audit result:
  - `PASS`: 0 findings.
  - `FAIL`: 1 or more.
  - `NOT_APPLICABLE`: nothing to check.
  - `NEEDS_RENDERED`: rendered-only, in a static scan.
- Category score = 100 × weight(passing applicable audits) ÷ weight(applicable audits), rounded half-up to an integer.
  - Weights: critical 10, serious 7, moderate 3, minor 1.
  - A category with no applicable audits has no score (`null`, shown as "—").
- Overall = weighted mean of the categories present (Operable 40, Perceivable 30, Stable 15, Discoverable 15), re-normalized, then rounded.
- Invariants under test:
  - Scores stay within [0, 100].
  - Adding a violation never raises a score.
  - Removing every violation of an applicable rule never lowers one.
  - `perfect.html` scores 100 in both sets.

## Fingerprints and PR deltas

`fingerprint = sha256(ruleID + route + selectorPath + role + normalizedName)`. It must survive unrelated edits elsewhere on the page — that is why `Path` anchors on the nearest ancestor with an `id`.

Comparing two scans of the same route is a set operation on fingerprints: new, fixed, unchanged. The future optikí GitHub Action will compare a PR's head scan with its base scan this way. It will only compare reports with the same `rulesetHash`.

## Don'ts

- Don't add heuristics that depend on page size, timing or iteration order in static mode.
- Don't let a rule both flag and "explain away" in hidden ways — downgrades (e.g. repeated-row look-alikes) are explicit, documented severities.
- Don't fetch anything from the engine; `pkg.FetchPublicPage`, the render proxy and the snapshot builders sit outside it.
- Don't branch on the rule set inside a rule. A rule behaves the same in every set it belongs to.
- Don't claim Google Lighthouse parity — optikí's rules target failure modes logged in real AI test runs (see `optiki.md` §1).
