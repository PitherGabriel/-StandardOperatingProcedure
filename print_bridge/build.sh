#!/usr/bin/env bash
# Builds bridge.exe for Windows using Docker — no Go install required.
# Works on Linux and on Windows (Git Bash + Docker Desktop).
set -e
MSYS_NO_PATHCONV=1 docker run --rm \
  -v "$(pwd)://src" \
  -w //src \
  -e GOOS=windows \
  -e GOARCH=amd64 \
  -e CGO_ENABLED=0 \
  golang:alpine \
  go build -ldflags="-H windowsgui" -o bridge.exe .
echo "Done: built print_bridge/bridge.exe"
