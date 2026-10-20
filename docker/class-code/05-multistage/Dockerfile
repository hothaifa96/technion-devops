# ---------- stage 1: build ----------
FROM golang:1.22-alpine AS builder
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /out/server .

# ---------- stage 2: test (optional, run with --target test) ----------
FROM builder AS test
RUN go vet ./...

# ---------- stage 3: runtime ----------
FROM gcr.io/distroless/static:nonroot AS runtime
COPY --from=builder /out/server /server
USER nonroot
EXPOSE 8080
ENTRYPOINT ["/server"]
