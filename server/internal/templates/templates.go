package templates

import "embed"

//go:embed email/*.html
var EmailFS embed.FS

//go:embed prompt/*.md
var PromptFS embed.FS
