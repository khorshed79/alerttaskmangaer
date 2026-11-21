$ErrorActionPreference = "Stop"

Write-Host "=== TaskFlow Android USB Install ===" -ForegroundColor Cyan

# 1. Verify ADB and connected USB device
if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
    Write-Error "ADB not found. Please install Android Studio / Android Platform-Tools and add adb to PATH."
    exit 1
}

$devices = adb devices | Select-String -Pattern "\tdevice$"
if (-not $devices) {
    Write-Error "No authorized Android device detected over USB. Enable Developer Options -> USB Debugging on your phone and accept the RSA prompt."
    exit 1
}

Write-Host "Connected device detected. Building web bundle..." -ForegroundColor Green
npm install
npm run build

if (-not (Test-Path "android")) {
    Write-Host "Initializing Capacitor Android project..." -ForegroundColor Yellow
    npm install @capacitor/core @capacitor/cli @capacitor/android
    npx cap add android
}

npx cap sync android

Write-Host "Building Debug APK via Gradle..." -ForegroundColor Green
Push-Location android
.\gradlew.bat assembleDebug
Pop-Location

$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apkPath)) {
    Write-Error "APK build failed: $apkPath not found."
    exit 1
}

Write-Host "Installing APK to Android device over USB..." -ForegroundColor Cyan
adb install -r $apkPath
adb shell monkey -p com.taskflow.dailytracker -c android.intent.category.LAUNCHER 1

Write-Host "TaskFlow installed and launched successfully!" -ForegroundColor Green
