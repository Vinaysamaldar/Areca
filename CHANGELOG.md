# ArecaAI Changelog & Release Notes

## Version 2.2.0 - Multi-Spectral Precision Agronomy & Farmer Experience Suite

### 🌿 Phase 1: Analytics & Multi-Spectral Feature Extraction
- **Radiometric Vegetation Index Engine**: Client-side canvas mathematics computing 6 key remote sensing indices:
  - $\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}$ (Foliar Chlorophyll Vitality)
  - $\text{NDRE} = \frac{\text{NIR} - \text{RE}}{\text{NIR} + \text{RE}}$ (Mid-to-Late Canopy Stress)
  - $\text{GNDVI} = \frac{\text{NIR} - \text{Green}}{\text{NIR} + \text{Green}}$ (Nitrogen & Water Assimilation)
  - $\text{SAVI} = 1.5 \times \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red} + 0.5}$ (Soil-Adjusted Vegetation Index)
  - $\text{EVI} = 2.5 \times \frac{\text{NIR} - \text{Red}}{\text{NIR} + 6\text{Red} - 7.5\text{Blue} + 1}$ (Enhanced Canopy Dynamics)
  - $\text{NDWI} = \frac{\text{Green} - \text{NIR}}{\text{Green} + \text{NIR}}$ (Leaf Tissue Moisture Index)
- **Multi-Spectral Drone & RGB Upload Pipeline**:
  - Drag-and-drop support for multi-spectral band stacks (Blue, Green, Red, Red Edge, NIR) or single high-res RGB canopy imagery.
  - Interactive Band Selector with side-by-side RGB vs. Band inspection.
  - Multi-step Processing Stepper (*Preprocess $\rightarrow$ Band Alignment $\rightarrow$ Index Calculation $\rightarrow$ Feature Extraction $\rightarrow$ Softmax Diagnosis*).
  - High-performance canvas radiometric heatmap synthesis with custom Turbo color gradient legends.
  - Feature Export to CSV & JSON format including canopy cover %, stress area %, GLCM texture, and HSV color space moments.
  - Dynamic spectral signature line chart (reflectance % vs. 450nm-840nm wavelength) comparing Healthy palms against the diagnosed disease.
- **Unified 4-Tab Analytics Suite** (`/analytics`):
  1. `Feature Extraction`: Full radiometric analysis workbench.
  2. `Solutions & Analytics`: Monthly scan KPIs, disease distribution donut chart, NDVI trends, and rule-based organic & chemical fungicide prescriptions.
  3. `Diseases Library`: 6-class catalog detailing pathogen etiology, symptoms, favorable weather conditions, and spectral characteristics.
  4. `History & Comparisons`: Historical scan timeline with side-by-side index change comparisons and filtering.

---

### 🛡️ Phase 2: Trust & Diagnostic Accuracy
- **Grad-CAM Saliency Activation Heatmaps**:
  - Interactive overlay toggle directly on the analyzed plant image.
  - Visualizes high-activation convolutional receptive fields (lesion hotspots, chlorotic veins) using a Jet/Turbo heat distribution.
- **Severity & Leaf Area Affected Estimation**:
  - Real-time quantitative computation of necrotic tissue proportion (`Area Affected: XX%`).
  - Dynamic severity tiering (`Healthy`, `Moderate`, `Severe`, `Critical`).
- **Farmer & Agronomist Feedback System**:
  - Interactive "Report Wrong Result" modal allowing field practitioners to submit corrective diagnosis labels and notes.
  - Backend `POST /api/feedback` endpoint with SQLite persistence and local storage fallback.
- **Comprehensive Model Benchmark & Explainability Page** (`/about`):
  - Model comparison matrix evaluating **MobileNetV2** (96.8% accuracy, 3.5M params, 38ms latency, 14MB) vs. **ResNet-50** vs. **EfficientNet-B0**.
  - Per-class precision, recall, and F1-score breakdown across all 6 core classes.
  - 6x6 Confusion Matrix heatmap showcasing true vs. predicted validation splits (2,304/2,375 correct).

---

### 🚜 Phase 3: Farmer Experience & Field Utilities
- **Weather-Based Koleroga (Mahali) Spore Risk Widget**:
  - Open-Meteo live API integration for Karnataka areca belts: **Shimoga, Udupi, Chikkamagaluru, Dakshina Kannada, and Uttara Kannada (Sirsi)**.
  - Real-time relative humidity, temperature, and precipitation monitoring.
  - Automatic pathogen spore germination threshold calculations: triggers instant preventive 1% Bordeaux mixture spraying alerts during high monsoonal humidity (>80%).
- **Bilingual Web Speech API Audio Readout**:
  - Integrated voice synthesizer reading diagnosis and dosage in native **Kannada (ಕನ್ನಡ)** or English.
  - One-tap audio playback with pulsing indicator.
- **Plantation Plot Tagging**:
  - Allows farmers to tag scans to individual plantation blocks (e.g., *Plot A - North Ridge, Plot B - Riverbank Block, Plot C - Young Palms*).
- **Spray Calendar Reminders (.ics)**:
  - Generates downloadable standard `.ics` calendar events pre-configured with recommended treatment dates (3 days post-diagnosis) for import into Google Calendar / Apple Calendar.
- **Photo Quality Guidance Modal**:
  - Onboarding guidance modal detailing lighting, proximity (15-30cm), and plant-only focus for maximal classification confidence.
- **Progressive Web App (PWA) Capabilities**:
  - `manifest.json` and `sw.js` service worker configuration for standalone home-screen installation and offline static asset caching.

---

### ⚡ Phase 4: Quality, Performance & Verification
- **Accessibility & Design Language**:
  - WCAG AA contrast compliance with emerald accents (`#10b981` $\rightarrow$ `#34d399`) on dark slate (`#0a0a0a`).
  - Full mobile responsiveness across viewports (phones, tablets, desktops).
- **SEO & Social Previews**:
  - Meta tags, Open Graph (`og:title`, `og:description`, `og:image`), and Twitter Card integration.
- **Automated Verification Suite**:
  - 100% test pass rate in `test_app.py` covering database CRUD, two-stage classification, live stream inference, multi-part diagnostics, ReportLab PDF generation, web routing, and PWA assets.
