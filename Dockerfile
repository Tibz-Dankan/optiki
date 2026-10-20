# One image serves the API and the built client from a single origin.
# Chromium (for rendered scans) is added when they land.

FROM node:24-alpine AS client

RUN npm install -g pnpm@10.15.1

WORKDIR /app/client

COPY client/package.json client/pnpm-lock.yaml client/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY client .
RUN pnpm run build

FROM golang:1.26-alpine AS server

WORKDIR /app/server

COPY server/go.mod server/go.sum ./
RUN go mod download && go mod verify

COPY server .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o ./bin/optiki-server ./cmd \
 && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o ./bin/purge ./cmd/purge

FROM alpine:3.22

RUN apk add --no-cache ca-certificates tzdata \
 && adduser -D -H -u 10001 optiki

WORKDIR /app

COPY --from=server /app/server/bin/optiki-server /app/server/bin/purge ./
COPY --from=client /app/client/dist ./public

# Previews listen on 8000 (APP_ENV unset); production on 8001 (APP_ENV=production)
ENV GO_ENV=production
EXPOSE 8000 8001

USER optiki

ENTRYPOINT ["./optiki-server"]
