package pkg

import (
	"fmt"
	"reflect"
	"regexp"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// ValidateInput compares the request body against the provided input struct and returns errors.
func ValidateInput(c *fiber.Ctx, input interface{}) []string {
	if err := c.BodyParser(input); err != nil {
		return []string{"Invalid request body format"}
	}

	inputValue := reflect.ValueOf(input)
	inputType := reflect.TypeOf(input)

	if inputType.Kind() != reflect.Ptr || inputType.Elem().Kind() != reflect.Struct {
		return []string{"Input must be a pointer to a struct"}
	}

	inputType = inputType.Elem()
	inputValue = inputValue.Elem()

	var validationErrors []string

	for i := 0; i < inputType.NumField(); i++ {
		field := inputType.Field(i)
		value := inputValue.Field(i)
		tag := field.Tag.Get("validate")

		if tag != "" {
			rules := strings.Split(tag, ",")
			for _, rule := range rules {
				if err := applyValidationRule(rule, field.Name, value); err != nil {
					validationErrors = append(validationErrors, err.Error())
				}
			}
		}
	}

	return validationErrors
}

func applyValidationRule(rule, fieldName string, value reflect.Value) error {
	if !value.IsValid() {
		return fmt.Errorf("missing field %s", fieldName)
	}

	switch rule {
	case "string":
		if value.Kind() != reflect.String {
			return fmt.Errorf("field %s must be a string", fieldName)
		}
	case "number":
		if value.Kind() != reflect.Float64 && value.Kind() != reflect.Int {
			return fmt.Errorf("field %s must be a valid number", fieldName)
		}
	case "email":
		emailRegex := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
		if !regexp.MustCompile(emailRegex).MatchString(value.String()) {
			return fmt.Errorf("invalid email in field %s", fieldName)
		}
	case "telephoneNumber":
		phoneRegex := `^\+?[1-9]\d{1,14}$`
		if !regexp.MustCompile(phoneRegex).MatchString(value.String()) {
			return fmt.Errorf("invalid telephone number in field %s", fieldName)
		}
	case "bool":
		if value.Kind() != reflect.Bool {
			return fmt.Errorf("field %s must be a boolean", fieldName)
		}
	default:
		return fmt.Errorf("unsupported validation rule %s for field %s", rule, fieldName)
	}

	return nil
}
