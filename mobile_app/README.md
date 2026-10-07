# ArecaAI - Android Mobile Application (Flutter)

A cross-platform Flutter Android mobile application for **"Detection of Diseases in Arecanut Plants using Deep Learning"**.

---

## 🌴 Key Mobile Features

- **On-Device Offline Inference**: Runs TensorFlow Lite model (`model.tflite`, 224x224x3) locally with zero internet requirement using `tflite_flutter`.
- **Optional Cloud Online Mode**: Toggle in Settings to send images to your Flask/FastAPI REST API (`POST /predict`).
- **7 Complete Screens**:
  1. **Splash Screen**: Animated logo, English & Kannada branding.
  2. **Home Screen**: Large "Take Photo" and "Choose from Gallery" cards, photography guide.
  3. **Preview Screen**: Review framing, lighting checklist, and "Analyze Disease" button.
  4. **Result Screen**: Disease name (EN & KN), animated confidence %, low-confidence warning (<60%), severity badge, clinical symptoms, organic & chemical treatments, and share button.
  5. **History Screen**: Local SQLite storage of past scans, swipe-to-delete with undo.
  6. **Disease Library**: Catalog of all 6 conditions with search filter.
  7. **Settings**: Language toggle (English / ಕನ್ನಡ), dark mode, cloud API switch, team credits.
- **Material 3 Design**: Green agriculture theme with adaptive dark and light modes.

---

## 📁 Project Structure

```
mobile_app/
├── pubspec.yaml                 # Flutter package dependencies & asset declarations
├── convert_to_tflite.py         # Python script to convert Keras model.h5 to model.tflite
├── README.md                    # Mobile app setup & build guide
├── android/
│   └── app/src/main/
│       └── AndroidManifest.xml  # Camera, storage, and internet permissions
├── assets/
│   ├── labels.txt               # The 6 disease classes
│   ├── disease_info.json        # Bilingual agronomic symptoms & treatments
│   └── model.tflite             # On-device TFLite model (generated via Python)
└── lib/
    ├── main.dart                # App entrypoint, Material 3 green theme & providers
    ├── models/
    │   ├── disease.dart         # Disease data model
    │   └── prediction_record.dart # SQLite history model
    ├── services/
    │   ├── tflite_service.dart   # On-device TFLite inference engine & fallback
    │   ├── api_service.dart      # Optional online REST API client
    │   ├── database_service.dart # Local SQLite database (sqflite)
    │   └── disease_service.dart  # Knowledge base provider
    ├── providers/
    │   └── app_settings_provider.dart # Language, Theme & Inference mode state
    ├── screens/
    │   ├── splash_screen.dart   # 1. Splash screen with animations
    │   ├── home_screen.dart     # 2. Main dashboard with camera/gallery buttons
    │   ├── preview_screen.dart  # 3. Framing preview & detect trigger
    │   ├── result_screen.dart   # 4. Diagnosis, confidence %, treatments & share
    │   ├── history_screen.dart  # 5. Saved scans with swipe-to-delete
    │   ├── disease_library_screen.dart # 6. Catalog of all 6 diseases
    │   └── settings_screen.dart # 7. Language toggle, theme & team credits
    └── utils/
        ├── app_colors.dart      # Agriculture green color palette
        ├── app_strings.dart     # English & Kannada localization strings
        └── photography_tips.dart# Farmer camera guidelines
```

---

## 🔄 Step 1: Converting Your Keras Model to TFLite

Run the included converter script to transform your trained `model.h5` into an optimized `model.tflite`:

```bash
# Inside the mobile_app directory:
python convert_to_tflite.py --input ../model.h5 --output assets/model.tflite
```

This applies float16 / dynamic range quantization, reducing the model file size from ~50 MB to ~12 MB for mobile devices!

---

## 📱 Step 2: Running the App on an Android Device / Emulator

### 1. Install Flutter SDK
Download and install Flutter from [flutter.dev](https://flutter.dev/docs/get-started/install). Ensure `flutter` is added to your system `PATH`.

### 2. Navigate to the mobile app folder
```bash
cd "C:\Users\DELL\OneDrive\Desktop\MINI PROJECT\mobile_app"
```

### 3. Fetch dependencies
```bash
flutter pub get
```

### 4. Connect Phone or Start Emulator
- Enable **USB Debugging** on your Android phone (Settings → Developer Options → USB Debugging).
- Connect your phone via USB cable, or launch an Android Virtual Device (AVD) from Android Studio.

### 5. Run the app
```bash
flutter run
```

---

## 📦 Step 3: How to Build the Release APK

To generate a standalone `.apk` file that you can install on any Android phone or share with your project evaluators:

```bash
flutter build apk --release
```

Once the build finishes, your APK will be generated at:
```
mobile_app/build/app/outputs/flutter-apk/app-release.apk
```

You can copy this `app-release.apk` file directly to any Android smartphone via WhatsApp, Google Drive, or USB cable and tap **Install**!
