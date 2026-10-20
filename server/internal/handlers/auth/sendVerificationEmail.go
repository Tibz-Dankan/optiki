package auth

import (
	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
)

func sendVerificationEmail(user models.User) error {
	otp := models.OTP{}

	token, err := otp.Create(models.OTP{UserID: user.ID, Type: constants.OTP_TYPE_VERIFY_EMAIL})
	if err != nil {
		return err
	}

	email := pkg.Email{Recipient: user.Email}
	return email.SendVerifyEmail(user.Name, token)
}
