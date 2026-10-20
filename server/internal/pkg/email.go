package pkg

import (
	"bytes"
	"errors"
	"html/template"
	"log"
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/templates"
	"github.com/resend/resend-go/v3"
)

const (
	subjectWelcome       = "Welcome to optikí"
	subjectResetPassword = "Reset your optikí password"
	subjectVerifyEmail   = "Verify your email address"
)

type Email struct {
	Recipient string
}

type baseEmailData struct {
	Subject string
	Name    string
	Year    string
}

type actionEmailData struct {
	baseEmailData
	ActionURL   string
	ActionLabel string
}

type otpEmailData struct {
	baseEmailData
	OTP string
}

func newBaseEmailData(subject, name string) baseEmailData {
	return baseEmailData{
		Subject: subject,
		Name:    name,
		Year:    strconv.Itoa(time.Now().Year()),
	}
}

// SendWelcome sends the post-sign-up welcome email
func (e *Email) SendWelcome(name string) error {
	data := actionEmailData{
		baseEmailData: newBaseEmailData(subjectWelcome, name),
		ActionURL:     GetClientBaseURL() + constants.USER_HOME_PATH,
		ActionLabel:   "Open optikí",
	}
	return e.renderAndSend("welcome.html", subjectWelcome, data, data.ActionURL)
}

// SendResetPassword sends the password reset code
func (e *Email) SendResetPassword(name, otp string) error {
	data := otpEmailData{
		baseEmailData: newBaseEmailData(subjectResetPassword, name),
		OTP:           otp,
	}
	return e.renderAndSend("reset-password.html", subjectResetPassword, data, "code "+otp)
}

// SendVerifyEmail sends the email verification link
func (e *Email) SendVerifyEmail(name, token string) error {
	data := actionEmailData{
		baseEmailData: newBaseEmailData(subjectVerifyEmail, name),
		ActionURL:     GetClientBaseURL() + "/auth/verify-email?token=" + url.QueryEscape(token),
		ActionLabel:   "Verify email address",
	}
	return e.renderAndSend("verify-email.html", subjectVerifyEmail, data, data.ActionURL)
}

func (e *Email) renderAndSend(contentFile, subject string, data any, localPreview string) error {
	html, err := renderTemplate(contentFile, data)
	if err != nil {
		return err
	}

	if os.Getenv("RESEND_API_KEY") == "" {
		if GetAppEnv() == "local_development" {
			log.Printf("email (not sent, no RESEND_API_KEY): to=%s subject=%q %s", e.Recipient, subject, localPreview)
			return nil
		}
		return errors.New("RESEND_API_KEY is not set")
	}

	return e.send(html, subject)
}

func (e *Email) send(html, subject string) error {
	client := resend.NewClient(os.Getenv("RESEND_API_KEY"))

	params := &resend.SendEmailRequest{
		From:    "optikí <" + os.Getenv("RESEND_SENDER_EMAIL") + ">",
		To:      []string{e.Recipient},
		Html:    html,
		Subject: subject,
	}

	if _, err := client.Emails.Send(params); err != nil {
		log.Println("Error sending email:", err)
		return err
	}

	return nil
}

func renderTemplate(contentFile string, data any) (string, error) {
	tmpl, err := template.ParseFS(templates.EmailFS, "email/layout.html", "email/"+contentFile)
	if err != nil {
		return "", err
	}

	var body bytes.Buffer
	if err := tmpl.ExecuteTemplate(&body, "layout", data); err != nil {
		return "", err
	}

	return body.String(), nil
}
