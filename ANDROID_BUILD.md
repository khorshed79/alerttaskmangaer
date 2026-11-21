# Android Studio & USB Debugging Deployment Guide

The full native **Android Studio Gradle project** is already generated and synced inside the `android/` directory (`com.taskflow.dailytracker`, app name `TaskFlow`).

## Deploy Directly via Android Studio + USB Debugging
1. **Enable USB Debugging on your phone**:
   - **Settings → About phone** → tap **Build number** 7 times.
   - **Settings → Developer options** → turn on **USB debugging**.
   - Connect your phone to your PC via USB cable and tap **Allow**.
2. **Open in Android Studio**:
   - Export/download this project folder to your PC.
   - Open **Android Studio** → **Open** → select the **`android/`** folder inside this project.
   - Wait for Gradle Sync to complete.
   - Select your connected phone from the top device dropdown and click **Run ▶** (or **Build → Build Bundle(s) / APK(s) → Build APK(s)**).
3. **Updating Web Changes into Android**:
   Whenever you modify React code under `src/`, run:
   ```bash
   npm run build && npx cap sync android
   ```
   Alternatively, run the automated USB scripts (`scripts/android-usb-install.ps1` on Windows or `scripts/android-usb-install.sh` on macOS/Linux).

## Firebase Note for Native Android / Google Sign-In
- `android/app/build.gradle` is pre-configured to apply `com.google.gms.google-services` automatically if you place `google-services.json` inside `android/app/`.
- Because Capacitor serves the WebView at `https://localhost` (`androidScheme: 'https'`), Firebase Firestore and Authentication are already configured for `localhost`. If you add native Firebase Android SDK plugins later, register `com.taskflow.dailytracker` with your keystore SHA-1/SHA-256 in Firebase Console (`ecstatic-folio-xlvvl`) and download `google-services.json` into `android/app/`.
