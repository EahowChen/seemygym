#!/usr/bin/env bash
set -e
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Initializing Capacitor project (will use ./web as web-dir)"
if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found. Please install Node.js/npm and try again." >&2
  exit 1
fi

echo "Installing Capacitor packages locally..."
npm init -y
npm install @capacitor/core @capacitor/cli --save-dev

echo "Initializing Capacitor (id=com.eahow.seemygym, name=Seemygym)..."
npx cap init Seemygym com.eahow.seemygym --web-dir=web

echo "Adding iOS platform..."
npx cap add ios || true

echo "Done. Open ios project in Xcode: npx cap open ios"
echo "Remember: after changing web/, run: npx cap copy ios && npx cap sync ios"
