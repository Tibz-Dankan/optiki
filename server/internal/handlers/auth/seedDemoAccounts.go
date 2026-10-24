package auth

import (
	"log"
	"os"

	"github.com/Tibz-Dankan/optiki/internal/constants"
	"github.com/Tibz-Dankan/optiki/internal/models"
	"github.com/Tibz-Dankan/optiki/internal/pkg"
)

// SeedDemoAccounts creates the verified test accounts TestSprite signs in with, once per env; credentials come only from the environment
func SeedDemoAccounts() {
	accounts := []struct{ name, email, password string }{
		{os.Getenv("DEMO_NAME"), os.Getenv("DEMO_EMAIL"), os.Getenv("DEMO_PASSWORD")},
		{os.Getenv("DEMO_NAME_2"), os.Getenv("DEMO_EMAIL_2"), os.Getenv("DEMO_PASSWORD_2")},
	}

	for _, account := range accounts {
		if account.email == "" || account.password == "" {
			continue
		}
		if account.name == "" {
			account.name = "Demo User"
		}

		user := models.User{}
		savedUser, err := user.FindByEmail(account.email)
		if err != nil {
			log.Println("seed demo account: lookup failed:", err)
			continue
		}
		if savedUser.ID != "" {
			continue
		}

		newUser, err := user.Create(models.User{
			Name:     account.name,
			Email:    account.email,
			Password: account.password,
			Role:     constants.USER_ROLE_USER,
		})
		if err != nil {
			log.Println("seed demo account: create failed:", err)
			continue
		}

		if _, err := newUser.MarkEmailVerified(); err != nil {
			log.Println("seed demo account: verifying email failed:", err)
			continue
		}

		log.Printf("Seeded demo account %s", pkg.NormalizeEmail(account.email))
	}
}
