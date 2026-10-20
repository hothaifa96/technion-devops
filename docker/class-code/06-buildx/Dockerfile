# syntax=docker/dockerfile:1
FROM --platform=$BUILDPLATFORM alpine:3.20 AS info
ARG BUILDPLATFORM
ARG TARGETPLATFORM
ARG TARGETARCH
RUN echo "built on ${BUILDPLATFORM} for ${TARGETPLATFORM} (${TARGETARCH})" > /info.txt

FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
# cache mount: pip cache survives between builds but is not in the image
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt
COPY --from=info /info.txt /info.txt
COPY app.py .
CMD ["python", "app.py"]
