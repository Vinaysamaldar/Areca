# Detection of Diseases in Arecanut Plants using Deep Learning

An end-to-end, full-stack AI web application developed as an **Engineering Mini Project**. This platform detects and classifies diseases in Arecanut (*Areca catechu*) palms using deep learning (MobileNetV2 transfer learning), providing immediate clinical prescriptions in both **English and Kannada (ಕನ್ನಡ)** along with downloadable diagnostic PDF reports.

---

## 🌴 Project Highlights

- **Deep Learning Model**: MobileNetV2 Convolutional Neural Network with transfer learning.
- **Dual Inference Engine**:
  - Automatically loads and runs `model.h5` if TensorFlow and model weights exist.
  - Automatically falls back to an intelligent, lightweight Computer Vision (CV) feature extractor if running in constrained environments (e.g. Render free tier 512MB RAM or Python 3.14+).
- **Dual Language UI**: Instant language toggle between English and authentic Kannada (ಕನ್ನಡ) agricultural terminology.
- **Interactive Scanning**: Drag-and-drop file upload, live webcam video capture with camera switching, and pre-loaded quick-test sample leaves.
- **Clinical Diagnostic PDF Report**: Generates official agronomic advisory reports with plant photo, confidence metrics, and organic/chemical fungicide schedules.
- **SQLite History Log**: Tracks every diagnosis with image thumbnails, confidence %, date/time, and delete options.
- **Responsive Theme**: Clean green agriculture design with dark mode & light mode toggles.

---

## 🎯 Supported Disease Classes

| No. | Disease Name (English) | Kannada Name (ಕನ್ನಡ) | Causal Organism / Pathogen |
|:---:|:---|:---|:---|
| 1 | **Healthy** | ಆರೋಗ್ಯಕರ ಅಡಿಕೆ ಮರ | None (*Healthy Foliage*) |
| 2 | **Koleroga (Fruit Rot)** | ಕೊಳೆರೋಗ / ಮಹಾಲಿ | *Phytophthora meadii* |
| 3 | **Yellow Leaf Disease (YLD)** | ಹಳದಿ ಎಲೆ ರೋಗ | *Phytoplasma* (Vector: *Proutista moesta*) |
| 4 | **Bud Rot** | ಸುಳಿ ಕೊಳೆ ರೋಗ | *Phytophthora meadii / palmivora* |
| 5 | **Stem Bleeding** | ಕಾಂಡ ಸ್ರಾವ ರೋಗ | *Thielaviopsis paradoxa* |
| 6 | **Leaf Spot / Blight** | ಎಲೆ ಚುಕ್ಕೆ ರೋಗ | *Colletotrichum gloeosporioides* |

---

## 📁 Full Folder Structure

```
arecanut_disease_detection/
├── app.py                     # Main Flask backend application & routing
├── database.py                # SQLite database management (predictions.db)
├── model_helper.py            # ModelManager (loads model.h5 + CV fallback engine)
├── disease_info.json          # Comprehensive medical/agronomic knowledge base
├── train_model.py             # MobileNetV2 Transfer Learning training script
├── generate_model.py          # Quick Keras model generator script
├── requirements.txt           # Python package dependencies
├── Procfile                   # Process file for Render / Heroku
├── render.yaml                # Render Blueprint deployment configuration
├── Dockerfile                 # Container image for Hugging Face Spaces
├── README.md                  # Project documentation & deployment guide
├── static/
│   ├── css/
│   │   └── style.css          # Custom styling, dark mode variables & print CSS
│   ├── js/
│   │   ├── main.js            # Theme switching, language toggle & mobile menu
│   │   ├── detect.js          # File dropzone, webcam capture, API calls & results
│   │   └── pdf_export.js      # Diagnostic PDF report generation
│   ├── images/                # Vector SVG illustrations for all 6 diseases
│   │   ├── logo.svg
│   │   ├── healthy.svg
│   │   ├── koleroga.svg
│   │   ├── yellow_leaf.svg
│   │   ├── bud_rot.svg
│   │   ├── stem_bleeding.svg
│   │   └── leaf_spot.svg
│   └── uploads/               # Directory for user-uploaded test scans
└── templates/
    ├── base.html              # Base layout with navbar, footer, language switch
    ├── index.html             # Home page with project overview & statistics
    ├── detect.html            # Detection page (Drag-drop, webcam, analysis view)
    ├── diseases.html          # Disease catalog & treatment encyclopedia
    ├── history.html           # Prediction logs table with search & deletion
    └── about.html             # Project objectives, architecture, team & guide
```

---

## 🚀 Step-by-Step Instructions to Run Locally

### Prerequisites
- Python 3.9 to 3.12 (Recommended for TensorFlow) or Python 3.14 (runs CV fallback)
- `pip` package manager

### 1. Clone or Open the Project
Open terminal / command prompt in the project root directory:
```bash
cd arecanut_disease_detection
```

### 2. (Optional) Create a Virtual Environment
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

*(Optional: To train your own model or run TensorFlow directly on Python 3.9-3.12, install TensorFlow)*:
```bash
pip install tensorflow
```

### 4. Run the Flask Web Application
```bash
python app.py
```

### 5. Access in Web Browser
Open your browser and navigate to:
```
http://localhost:5000
```

---

## 🧠 Training the MobileNetV2 Deep Learning Model

If you have a collected dataset of arecanut images, you can train a MobileNetV2 model using `train_model.py`:

### 1. Organize Dataset Folders
Place your images into class-specific folders:
```
dataset/
├── Healthy/
├── Koleroga (Fruit Rot)/
├── Yellow Leaf Disease/
├── Bud Rot/
├── Stem Bleeding/
└── Leaf Spot/
```

### 2. Run Training Script
```bash
python train_model.py --data_dir ./dataset --epochs 20 --output_model model.h5
```
This script will:
- Apply data augmentations (random flip, rotation, zoom, contrast).
- Load MobileNetV2 pre-trained on ImageNet.
- Train the classification head using Adam optimizer and Categorical Cross-Entropy.
- Fine-tune top layers with reduced learning rate.
- Save the trained weights to `model.h5`.
- Generate `training_history.png` with accuracy and loss curves for your project presentation.

Once `model.h5` is in the project folder, `app.py` will automatically load it on startup!

---

## ☁️ Deployment Instructions

### Option 1: Deploy on Render (Free Web Service)

1. **Push your code to GitHub**:
   Create a new GitHub repository and push this directory.
2. **Log into Render**:
   Go to [https://render.com](https://render.com) and click **New +** → **Web Service**.
3. **Connect your GitHub Repository**:
   Select the repository.
4. **Configure the Service**:
   - **Name**: `arecanut-disease-detection`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - **Instance Type**: `Free`
5. Click **Create Web Service**. Your app will be live at `https://arecanut-disease-detection.onrender.com`.

*(Tip: Because Render Free Tier limits RAM to 512 MB, our dual-mode architecture guarantees smooth, crash-free execution without Out-Of-Memory errors!)*

---

### Option 2: Deploy on Hugging Face Spaces (Docker SDK)

1. **Log in to Hugging Face**: Go to [https://huggingface.co/spaces](https://huggingface.co/spaces).
2. Click **Create new Space**.
3. **Name**: `arecanut-disease-detection`
4. **Space SDK**: Select **Docker** (Blank).
5. **Space Hardware**: Free CPU basic (2 vCPU, 16 GB RAM).
6. **Upload Files**: Clone the space repository locally or upload files via the web interface:
   - Commit all files including `Dockerfile`, `app.py`, `disease_info.json`, `templates/`, `static/`, and `requirements.txt`.
7. Hugging Face will automatically build the Docker container and host your app live!

---

## 🎓 Mini Project Viva & Examination Q&A

**Q1: Why choose MobileNetV2 over traditional CNNs like VGG16 or ResNet50?**
> *Answer:* MobileNetV2 uses depthwise separable convolutions and inverted residual bottlenecks, drastically reducing the number of parameters and computational complexity (FLOPs) while preserving high feature representational capacity. This makes it ideal for real-time mobile and edge agricultural applications.

**Q2: What is the significance of the 60% confidence threshold?**
> *Answer:* In plant pathology, a false positive diagnosis can lead a farmer to apply unnecessary or harmful chemical fungicides. Setting a 60% confidence threshold ensures that ambiguous or blurry photos trigger a request for a clearer image rather than an unreliable diagnosis.

**Q3: How are the organic and chemical remedies formulated?**
> *Answer:* Prescriptions follow recommendations from the Central Plantation Crops Research Institute (CPCRI, Kasaragod) and Indian Council of Agricultural Research (ICAR), combining prophylactic bio-agents (Trichoderma, Bordeaux 1%) and systemic fungicides (Metalaxyl, Mancozeb, Hexaconazole).

---

## 👥 Project Team & Faculty Guide

### Student Team Members
1. **Gurunath P Bankapur** — Deep Learning Model Training & Optimization
2. **S J Ganesh Gowda** — Flask Backend Architecture & SQLite Integration
3. **Sadashiv S Hutagi** — Frontend UI/UX & Multilingual Localization
4. **Vinayaka.V** — Dataset Preprocessing & Clinical Report Module

### Project Guide & Supervisor
- **Prof. Vinutha H R**  
  *Department of Computer Science & Engineering*

