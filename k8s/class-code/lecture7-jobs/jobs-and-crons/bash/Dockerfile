FROM alpine:3.20
RUN apk add --no-cache bash curl jq
COPY app.sh /app.sh
RUN chmod +x /app.sh
CMD ["/app.sh"]
