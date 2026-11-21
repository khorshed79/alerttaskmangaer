#!/usr/bin/env bash
set -euo pipefail

echo "=== TaskFlow Android USB Install ==="

if ! command -v adb >/dev/null 2>&1; then
  echo "Error: adb not found. Install Android SDK Platform-Tools and add adb to PATH."
  exit 1
fi

if ! adb devices | grep -qE $'\tdevice$'; then
  echo "Error: No authorized Android device detected over USB. Enable USB Debugging and authorize this computer."
  exit 1
fi

npm install
npm run build

if [ ! -d "android" ]; then
  echo "Initializing Capacitor Android project..."
  npm install @capacitor/core @capacitor/cli @capacitor/android
  npx cap add android
fi

npx cap sync android

echo "Building Debug APK via Gradle..."
(cd android && ./gradlew assembleDebug)

APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ ! -f "$APK_PATH" ]; then
  echo "Error: APK not found at $APK_PATH"
  exit 1
fi

echo "Installing APK over USB..."
adb install -r "$APK_PATH"
adb shell monkey -p com.taskflow.dailytracker -c android.intent.category.LAUNCHER 1

echo "TaskFlow installed and launched successfully!"
