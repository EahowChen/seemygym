Capacitor Template & TestFlight Guide
===================================

This file explains how to wrap the `web/` folder into an iOS app using Capacitor and how to distribute via TestFlight.

Prerequisites
-------------
- macOS with Xcode installed
- Node.js and npm
- Capacitor CLI (`npm install -g @capacitor/cli`) or use npx
- Apple Developer account for TestFlight distribution

Quick steps
-----------
1. Initialize a Node project and install Capacitor (run in repo root):

```bash
npm init -y
npm install @capacitor/core @capacitor/cli
# or use npx for one-off
```

2. Initialize Capacitor app (replace IDs as desired):

```bash
npx cap init Seemygym com.example.seemygym --web-dir=web
```

3. Build web assets (if needed). For this project the `web/` is ready.

4. Add iOS platform and open Xcode:

```bash
npx cap add ios
npx cap open ios
```

5. In Xcode:
 - Select the project, set the Signing (Team) to your Apple Developer team (Automatic signing is okay).
 - Add fonts to the project: drag `web/fonts/*` into the Xcode project (Copy items if needed) and add font filenames into Info.plist under `Fonts provided by application` (`UIAppFonts`).
 - Ensure the app loads local `index.html` via `Bundle` resources (Capacitor handles this when `web` is used as web-dir).

6. Build & run on a device. To distribute via TestFlight:
 - Archive in Xcode (Product -> Archive), then upload to App Store Connect.
 - In App Store Connect, create a TestFlight build and invite testers.

Notes & Tips
-----------
- Capacitor keeps a native project; when you change `web/`, run `npx cap copy ios` and then rebuild in Xcode.
- If you prefer a minimal native wrapper without Capacitor, use a tiny SwiftUI app with a `WKWebView` that loads `index.html` from the bundle.
- For development without Apple Developer account, you can run on a device via USB with your personal Apple ID, but TestFlight/upload requires a paid Developer account.

Script (example)
-----------------
This repository includes `scripts/init-capacitor.sh` to scaffold a capacior project (run and edit as needed).
