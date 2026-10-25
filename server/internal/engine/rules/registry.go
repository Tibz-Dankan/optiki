package rules

import "github.com/Tibz-Dankan/optiki/internal/engine"

// All is every rule, in catalog order.
func All() []engine.Rule {
	return []engine.Rule{
		hiddenControl{},
		unnamedControl{},
		lookAlikeControls{},
		clickableNonControl{},
		nestedControls{},
		unlabeledField{},
		nativeBlockingDialog{},
		maskedLabel{},
		contentOnlyGraphic{},
		imageWithoutAlt{},
		tinyMeaningfulText{},
		brokenReferences{},
		lateControls{},
		layoutShift{},
		missingPageAnchors{},
		unnamedDialog{},
		untitledFrame{},
	}
}

// Find returns one rule's catalog metadata by ID.
func Find(id string) (engine.RuleMeta, bool) {
	for _, rule := range All() {
		if meta := rule.Meta(); meta.ID == id {
			return meta, true
		}
	}
	return engine.RuleMeta{}, false
}
