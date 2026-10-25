package engine

const EngineVersion = "0.1.0"

const (
	ModeStatic   = "STATIC"
	ModeRendered = "RENDERED"
)

const (
	CategoryOperable     = "OPERABLE"
	CategoryPerceivable  = "PERCEIVABLE"
	CategoryStable       = "STABLE"
	CategoryDiscoverable = "DISCOVERABLE"
)

const (
	SeverityCritical = "CRITICAL"
	SeveritySerious  = "SERIOUS"
	SeverityModerate = "MODERATE"
	SeverityMinor    = "MINOR"
)

const (
	PriorityP0 = "P0"
	PriorityP1 = "P1"
	PriorityP2 = "P2"
)

const (
	ResultPass          = "PASS"
	ResultFail          = "FAIL"
	ResultNotApplicable = "NOT_APPLICABLE"
	ResultNeedsRendered = "NEEDS_RENDERED"
)

const (
	NameFromAriaLabelledBy = "ARIA_LABELLEDBY"
	NameFromAriaLabel      = "ARIA_LABEL"
	NameFromNative         = "NATIVE"
	NameFromContent        = "CONTENT"
	NameFromTitle          = "TITLE"
	NameFromPlaceholder    = "PLACEHOLDER"
)

const (
	HiddenByAriaHidden             = "ARIA_HIDDEN"
	HiddenByRoleImg                = "ROLE_IMG"
	HiddenByPresentationalChildren = "PRESENTATIONAL_CHILDREN"
	HiddenByHiddenAttr             = "HIDDEN_ATTR"
	HiddenByDisplayNone            = "DISPLAY_NONE"
	HiddenByNotRendered            = "NOT_RENDERED"
)

const TextTag = "#text"

type Rect struct {
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
}

type Node struct {
	ID        int
	Parent    int
	Children  []int
	Tag       string
	Namespace string
	Attrs     map[string]string
	AttrKeys  []string
	// Raw text for #text nodes; whitespace-normalized own text for elements.
	Text string

	Role        string
	Name        string
	NameFrom    string
	Interactive bool
	Exposed     bool
	// Why the node is out of the accessibility tree, and which ancestor (or itself) caused it.
	HiddenBy      string
	HiddenByNode  int
	Path          string
	DocumentOrder int

	// Rendered-only; nil in static mode.
	Visible     *bool
	FontPx      *float64
	Cursor      *string
	FirstSeenMs *int
	Box         *Rect
}

type Snapshot struct {
	URL     string
	Route   string
	Mode    string
	Title   string
	Lang    string
	Nodes   []Node
	CLS     *float64
	Dialogs []string
	// Rendered snapshots whose names and roles came from Chrome's accessibility tree.
	HasAXTree bool
}

type RuleMeta struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Category     string   `json:"category"`
	Severity     string   `json:"severity"`
	Priority     string   `json:"priority"`
	Version      int      `json:"version"`
	Modes        []string `json:"modes"`
	RenderedOnly bool     `json:"renderedOnly"`
	Summary      string   `json:"summary"`
	Why          string   `json:"why"`
	Fix          string   `json:"fix"`
	FixBefore    string   `json:"fixBefore"`
	FixAfter     string   `json:"fixAfter"`
	WCAG         string   `json:"wcag"`
	Origin       string   `json:"origin"`
}

func (m RuleMeta) Weight() int {
	return SeverityWeight(m.Severity)
}

// Issue is what a rule reports; the engine turns it into a Finding.
type Issue struct {
	NodeID   int
	Severity string
	Message  string
	Evidence map[string]any
}

type Rule interface {
	Meta() RuleMeta
	Check(s *Snapshot) (issues []Issue, applicable bool)
}

type RuleSet struct {
	Name  string
	Rules []Rule
}

type Finding struct {
	RuleID         string         `json:"ruleID"`
	Category       string         `json:"category"`
	Severity       string         `json:"severity"`
	Fingerprint    string         `json:"fingerprint"`
	Position       int            `json:"position"`
	DocumentOrder  int            `json:"documentOrder"`
	SelectorPath   string         `json:"selectorPath"`
	Tag            string         `json:"tag"`
	Role           string         `json:"role"`
	AccessibleName string         `json:"accessibleName"`
	NameFrom       string         `json:"nameFrom"`
	Snippet        string         `json:"snippet"`
	Message        string         `json:"message"`
	Evidence       map[string]any `json:"evidence"`
}

type RuleResult struct {
	RuleID        string `json:"ruleID"`
	Position      int    `json:"position"`
	Category      string `json:"category"`
	Priority      string `json:"priority"`
	Severity      string `json:"severity"`
	Weight        int    `json:"weight"`
	Result        string `json:"result"`
	FindingsCount int    `json:"findingsCount"`
}

type Scores struct {
	Overall      *int `json:"overall"`
	Operable     *int `json:"operable"`
	Perceivable  *int `json:"perceivable"`
	Stable       *int `json:"stable"`
	Discoverable *int `json:"discoverable"`
}

type Counts struct {
	Findings           int `json:"findings"`
	Critical           int `json:"critical"`
	Serious            int `json:"serious"`
	Moderate           int `json:"moderate"`
	Minor              int `json:"minor"`
	RulesPassed        int `json:"rulesPassed"`
	RulesFailed        int `json:"rulesFailed"`
	RulesNotApplicable int `json:"rulesNotApplicable"`
	RulesNeedRendered  int `json:"rulesNeedRendered"`
}

type Report struct {
	EngineVersion string       `json:"engineVersion"`
	RuleSet       string       `json:"ruleSet"`
	RulesetHash   string       `json:"rulesetHash"`
	Mode          string       `json:"mode"`
	URL           string       `json:"url"`
	Route         string       `json:"route"`
	Title         string       `json:"title"`
	Lang          string       `json:"lang"`
	NodeCount     int          `json:"nodeCount"`
	ControlCount  int          `json:"controlCount"`
	Scores        Scores       `json:"scores"`
	Counts        Counts       `json:"counts"`
	Rules         []RuleResult `json:"rules"`
	Findings      []Finding    `json:"findings"`
	ReportHash    string       `json:"reportHash"`
}

func SeverityWeight(severity string) int {
	switch severity {
	case SeverityCritical:
		return 10
	case SeveritySerious:
		return 7
	case SeverityModerate:
		return 3
	case SeverityMinor:
		return 1
	}
	return 0
}
