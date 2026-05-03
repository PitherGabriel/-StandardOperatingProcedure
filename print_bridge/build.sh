#!/usr/bin/env bash
# Builds bridge.exe for Windows using Docker — no Go install required.
set -e
docker run --rm \
  -v "$(pwd):/src" \
  -w /src \
  -e GOOS=windows \
  -e GOARCH=amd64 \
  -e CGO_ENABLED=0 \
  golang:alpine \
  go build -o bridge.exe .
echo "Done → print_bridge/bridge.exe"
