CMD_DIR := ./cmd

# Runs the development server
.PHONY: run
run:
	@echo "Starting development server..."
	@GO_ENV=development go run $(CMD_DIR)

# Installs the packages
.PHONY: install
install:
	@echo "Installing dependencies..."
	@go mod tidy
	@go mod download

# Runs the unit tests (no database needed)
.PHONY: test
test:
	@go test -race ./internal/...

# Builds the server into ./bin
.PHONY: build
build:
	@go build -o ./bin/optiki-server $(CMD_DIR)
