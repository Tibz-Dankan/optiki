package engine

import "math"

var categoryWeights = []struct {
	category string
	weight   float64
}{
	{CategoryOperable, 40},
	{CategoryPerceivable, 30},
	{CategoryStable, 15},
	{CategoryDiscoverable, 15},
}

// score computes each category's score from its applicable audits, then the weighted overall score over
// the categories that have one. Categories with no applicable audits have no score.
func score(results []RuleResult) Scores {
	passed := map[string]int{}
	applicable := map[string]int{}
	for _, result := range results {
		if result.Result != ResultPass && result.Result != ResultFail {
			continue
		}
		applicable[result.Category] += result.Weight
		if result.Result == ResultPass {
			passed[result.Category] += result.Weight
		}
	}

	categoryScores := map[string]*int{}
	var weighted, totalWeight float64
	for _, entry := range categoryWeights {
		if applicable[entry.category] == 0 {
			continue
		}
		value := 100 * float64(passed[entry.category]) / float64(applicable[entry.category])
		rounded := roundHalfUp(value)
		categoryScores[entry.category] = &rounded
		weighted += value * entry.weight
		totalWeight += entry.weight
	}

	scores := Scores{
		Operable:     categoryScores[CategoryOperable],
		Perceivable:  categoryScores[CategoryPerceivable],
		Stable:       categoryScores[CategoryStable],
		Discoverable: categoryScores[CategoryDiscoverable],
	}
	if totalWeight > 0 {
		overall := roundHalfUp(weighted / totalWeight)
		scores.Overall = &overall
	}
	return scores
}

func roundHalfUp(value float64) int {
	return int(math.Floor(value + 0.5))
}
