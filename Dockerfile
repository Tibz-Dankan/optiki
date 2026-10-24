FROM golang:1.26-bookworm AS build

WORKDIR /app

COPY server/go.mod server/go.sum ./
RUN go mod download && go mod verify

COPY server .

RUN go build -o ./bin/optiki-server ./cmd

FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y \
    ca-certificates \
    tzdata \
    curl \
    chromium \
    chromium-common \
    chromium-driver \
    fonts-liberation \
    fonts-dejavu-core \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/*

# Chromium writes its config and cache under $HOME, so the user gets one
RUN useradd --create-home --uid 10001 optiki

COPY --from=build /app/bin/optiki-server /app/bin/optiki-server

# Baked in so /health reports the right commit whichever repo redeploys the shared stack
ARG GIT_SHA=
ENV GIT_SHA=$GIT_SHA

ENV CHROMEDP_NO_SANDBOX=true
ENV CHROME_BIN=/usr/bin/chromium
ENV GO_ENV=production

# Port for the backend server
EXPOSE 8001

USER optiki

WORKDIR /app

CMD ["/app/bin/optiki-server"]
