package auth

import (
	"fmt"
	"log"
	"strings"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
	"github.com/gofiber/fiber/v2"
)

type SignUpInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

var SignUp = func(c *fiber.Ctx) error {
	user := models.User{}

	input := SignUpInput{}
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	input.Name = strings.TrimSpace(input.Name)
	input.Email = pkg.NormalizeEmail(input.Email)

	if input.Name == "" || input.Email == "" || input.Password == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Missing name/email/password!")
	}
	if !pkg.IsValidEmail(input.Email) {
		return fiber.NewError(fiber.StatusBadRequest, "Please provide a valid email address!")
	}
	if len(input.Password) < constants.MIN_PASSWORD_LENGTH {
		return fiber.NewError(fiber.StatusBadRequest, fmt.Sprintf("Password must be at least %d characters!", constants.MIN_PASSWORD_LENGTH))
	}

	userByEmail, err := user.FindByEmail(input.Email)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if userByEmail.ID != "" {
		return fiber.NewError(fiber.StatusBadRequest, "Email is already registered!")
	}

	newUser, err := user.Create(models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: input.Password,
		Role:     constants.USER_ROLE_USER,
	})
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	sessionData, err := startSession(c, newUser, constants.SESSION_GENERATED_VIA_SIGN_UP)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	if err := sendVerificationEmail(newUser); err != nil {
		log.Println("sign up: sending verification email failed:", err)
	} else {
		c.Set("X-Email-Verification-Sent", "true")
	}

	welcomeEmail := pkg.Email{Recipient: newUser.Email}
	if err := welcomeEmail.SendWelcome(newUser.Name); err != nil {
		log.Println("sign up: sending welcome email failed:", err)
	}

	response := fiber.Map{
		"status":         "success",
		"message":        "Account created successfully",
		"session":        sessionData,
		"redirectToPath": constants.USER_HOME_PATH,
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}
