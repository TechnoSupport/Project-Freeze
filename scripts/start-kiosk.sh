#!/usr/bin/env bash
set -eu

url="http://127.0.0.1:${PORT:-3000}"

for attempt in $(seq 1 60); do
  if curl --silent --fail "$url/api/health" >/dev/null; then
    break
  fi
  sleep 1
done

if command -v chromium >/dev/null 2>&1; then
  browser=chromium
elif command -v chromium-browser >/dev/null 2>&1; then
  browser=chromium-browser
else
  echo "Chromium is not installed" >&2
  exit 1
fi

exec "$browser" --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble "$url"
