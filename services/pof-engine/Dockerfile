FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod ./
COPY main.go ./
COPY pkg/ ./pkg/

RUN go build -o pof-engine main.go

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/pof-engine .

EXPOSE 8080
CMD ["./pof-engine"]
