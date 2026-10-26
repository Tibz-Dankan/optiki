package pkg

import (
	"context"
	"errors"
	"fmt"
	"io"
	"math/rand/v2"
	"net"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"google.golang.org/genai"
)

var ErrGeminiNotConfigured = errors.New("Gemini is not configured: set GEMINI_API_KEY")

type GeminiClient struct {
	client *genai.Client
	model  string
}

type GeminiRequest struct {
	System    string
	Text      string
	MaxTokens int
}

type GeminiResponse struct {
	Text         string
	Model        string
	InputTokens  int
	OutputTokens int
	StopReason   string
}

var (
	geminiOnce     sync.Once
	geminiInstance *GeminiClient
	geminiErr      error
)

// GeminiConfigured reports whether a Gemini API key is set
func GeminiConfigured() bool {
	return strings.TrimSpace(os.Getenv("GEMINI_API_KEY")) != ""
}

// Gemini returns the process-wide Gemini client, built once from GEMINI_API_KEY and GEMINI_MODEL
func Gemini() (*GeminiClient, error) {
	geminiOnce.Do(func() {
		if !GeminiConfigured() {
			geminiErr = ErrGeminiNotConfigured
			return
		}
		client, err := genai.NewClient(context.Background(), &genai.ClientConfig{
			APIKey:  strings.TrimSpace(os.Getenv("GEMINI_API_KEY")),
			Backend: genai.BackendGeminiAPI,
		})
		if err != nil {
			geminiErr = fmt.Errorf("creating the Gemini client: %w", err)
			return
		}
		model := strings.TrimSpace(os.Getenv("GEMINI_MODEL"))
		if model == "" {
			model = constants.GEMINI_DEFAULT_MODEL
		}
		geminiInstance = &GeminiClient{client: client, model: model}
	})
	return geminiInstance, geminiErr
}

// Generate sends one system instruction and one user message, retrying transient failures
func (g *GeminiClient) Generate(ctx context.Context, req GeminiRequest) (GeminiResponse, error) {
	contents := []*genai.Content{genai.NewContentFromText(req.Text, genai.RoleUser)}
	config := &genai.GenerateContentConfig{
		MaxOutputTokens: int32(req.MaxTokens),
		ThinkingConfig:  &genai.ThinkingConfig{ThinkingLevel: genai.ThinkingLevelLow},
	}
	if req.System != "" {
		config.SystemInstruction = genai.NewContentFromText(req.System, genai.RoleUser)
	}

	return retryGeminiCall(ctx, func() (GeminiResponse, error) {
		result, err := g.client.Models.GenerateContent(ctx, g.model, contents, config)
		if err != nil {
			return GeminiResponse{}, err
		}

		response := GeminiResponse{Text: stripMarkdownFence(result.Text()), Model: g.model}
		if usage := result.UsageMetadata; usage != nil {
			response.InputTokens = int(usage.PromptTokenCount)
			response.OutputTokens = int(usage.CandidatesTokenCount + usage.ThoughtsTokenCount)
		}
		if len(result.Candidates) > 0 {
			response.StopReason = string(result.Candidates[0].FinishReason)
		}

		if result.PromptFeedback != nil && result.PromptFeedback.BlockReason != "" {
			return response, fmt.Errorf("gemini blocked the prompt: %s", result.PromptFeedback.BlockReason)
		}
		if response.Text == "" {
			return response, fmt.Errorf("gemini returned no text (finish reason %q)", response.StopReason)
		}
		return response, nil
	})
}

// IsGeminiRateLimited reports whether Gemini turned the request away for quota or load
func IsGeminiRateLimited(err error) bool {
	status := geminiStatus(err)
	return status == 429 || status == 503
}

func retryGeminiCall(ctx context.Context, call func() (GeminiResponse, error)) (GeminiResponse, error) {
	delay := constants.GEMINI_RETRY_BASE_DELAY

	for attempt := 0; ; attempt++ {
		response, err := call()
		if err == nil || attempt >= constants.GEMINI_MAX_RETRIES || ctx.Err() != nil || !isTransientGeminiError(err) {
			return response, err
		}

		wait := delay/2 + time.Duration(rand.Int64N(int64(delay)))
		select {
		case <-ctx.Done():
			return response, ctx.Err()
		case <-time.After(wait):
		}
		delay = min(delay*2, constants.GEMINI_RETRY_MAX_DELAY)
	}
}

func isTransientGeminiError(err error) bool {
	if status := geminiStatus(err); status != 0 {
		return status == 408 || status == 409 || status == 429 || status >= 500
	}
	var netErr net.Error
	return errors.As(err, &netErr) || errors.Is(err, io.ErrUnexpectedEOF)
}

func geminiStatus(err error) int {
	var apiErr genai.APIError
	if errors.As(err, &apiErr) {
		return apiErr.Code
	}
	var apiErrPtr *genai.APIError
	if errors.As(err, &apiErrPtr) {
		return apiErrPtr.Code
	}
	return 0
}

// stripMarkdownFence unwraps a reply that arrived entirely inside one ```markdown block
func stripMarkdownFence(text string) string {
	trimmed := strings.TrimSpace(text)
	if !strings.HasPrefix(trimmed, "```") || !strings.HasSuffix(trimmed, "```") {
		return trimmed
	}
	firstLine := strings.Index(trimmed, "\n")
	if firstLine < 0 {
		return trimmed
	}
	language := strings.TrimSpace(trimmed[3:firstLine])
	if language != "" && language != "markdown" && language != "md" {
		return trimmed
	}
	return strings.TrimSpace(trimmed[firstLine+1 : len(trimmed)-3])
}
