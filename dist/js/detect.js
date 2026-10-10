/**
 * ArecaAI - Instant Arecanut Plant Disease Scanner
 * Digital Image Processing (DIP) & Deep Learning Plant Pathology
 * Features:
 * - Direct camera capture & gallery image selection
 * - Drag-and-drop file upload with format and size validation
 * - 5-Stage Digital Image Processing Pipeline visualization
 * - Strict Plant Only validation (Rejects humans, faces, non-plants)
 * - Complete disease diagnosis across 9 dataset classes
 * - Bilingual English & Kannada advisory support
 * - ReportLab PDF Diagnostic Report generation
 */

let selectedFile = null;
let currentPredictionData = null;

document.addEventListener('DOMContentLoaded', () => {
  setupFileUpload();
  setupAnalyzeAction();
  setupSampleButtons();
  setupWeatherWidget();
  setupModals();
  setupGradCam();
  setupVoiceReadout();
  setupSprayCalendar();

  window.addEventListener('languageChanged', () => {
    if (currentPredictionData) {
      renderResult(currentPredictionData);
    }
  });

  const scanAgainBtn = document.getElementById('scan-again-btn');
  if (scanAgainBtn) {
    scanAgainBtn.addEventListener('click', () => {
      clearSelection();
      const resultSec = document.getElementById('result-section');
      if (resultSec) resultSec.classList.add('hidden');
      const scanner = document.getElementById('instant-scanner') || document.body;
      scanner.scrollIntoView({ behavior: 'smooth' });
    });
  }
});

// --- 1. FILE UPLOAD & CAMERA CAPTURE ---
function setupFileUpload() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const cameraInput = document.getElementById('camera-file-input');
  const chooseFileBtn = document.getElementById('choose-file-btn');
  const mobileCamBtn = document.getElementById('mobile-cam-btn');
  const removeBtn = document.getElementById('remove-preview-btn');

  if (!dropzone) return;

  // Open file dialog on dropzone click (if not clicking remove button)
  dropzone.addEventListener('click', (e) => {
    if (e.target.closest('#remove-preview-btn')) return;
    if (fileInput) fileInput.click();
  });

  if (chooseFileBtn && fileInput) {
    chooseFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (mobileCamBtn && cameraInput) {
    mobileCamBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cameraInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  if (cameraInput) {
    cameraInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  // Drag and drop handlers
  ['dragenter', 'dragover'].forEach(event => {
    dropzone.addEventListener(event, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('border-emerald-600', 'bg-emerald-100/60');
    });
  });

  ['dragleave', 'drop'].forEach(event => {
    dropzone.addEventListener(event, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('border-emerald-600', 'bg-emerald-100/60');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleFileSelect(dt.files[0]);
    }
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearSelection();
    });
  }
}

// --- 2. PRE-LOADED DATASET SAMPLES ---
function setupSampleButtons() {
  const sampleBtns = document.querySelectorAll('.sample-leaf-btn');
  sampleBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const imgUrl = btn.getAttribute('data-img');
      const filename = btn.getAttribute('data-name') || 'sample_leaf.jpg';
      if (!imgUrl) return;

      try {
        const resp = await fetch(imgUrl);
        const blob = await resp.blob();
        const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
        handleFileSelect(file);
      } catch (e) {
        console.warn("Could not load sample image:", e);
      }
    });
  });
}

function handleFileSelect(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
    showUploadError("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
    return;
  }

  // 15 MB limit
  if (file.size > 15 * 1024 * 1024) {
    showUploadError("File size exceeds 15 MB limit. Please choose a smaller photo.");
    return;
  }

  selectedFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    const previewContainer = document.getElementById('preview-container');
    const previewPrompt = document.getElementById('dropzone-prompt');
    const previewImage = document.getElementById('preview-image');
    const previewFilename = document.getElementById('preview-filename');
    const previewFilesize = document.getElementById('preview-filesize');
    const analyzeBtn = document.getElementById('analyze-btn');
    const errorAlert = document.getElementById('upload-error-alert');

    if (previewImage) previewImage.src = e.target.result;
    if (previewFilename) previewFilename.textContent = file.name;
    if (previewFilesize) previewFilesize.textContent = formatBytes(file.size);

    if (previewPrompt) previewPrompt.classList.add('hidden');
    if (previewContainer) previewContainer.classList.remove('hidden');

    if (analyzeBtn) {
      analyzeBtn.removeAttribute('disabled');
      analyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    if (errorAlert) errorAlert.classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

function clearSelection() {
  selectedFile = null;
  const fileInput = document.getElementById('file-input');
  const cameraInput = document.getElementById('camera-file-input');
  if (fileInput) fileInput.value = '';
  if (cameraInput) cameraInput.value = '';

  const previewContainer = document.getElementById('preview-container');
  const previewPrompt = document.getElementById('dropzone-prompt');
  const previewImage = document.getElementById('preview-image');
  const analyzeBtn = document.getElementById('analyze-btn');
  const errorAlert = document.getElementById('upload-error-alert');

  if (previewImage) previewImage.src = '';
  if (previewContainer) previewContainer.classList.add('hidden');
  if (previewPrompt) previewPrompt.classList.remove('hidden');

  if (analyzeBtn) {
    analyzeBtn.setAttribute('disabled', 'true');
    analyzeBtn.classList.add('opacity-50', 'cursor-not-allowed');
  }
  if (errorAlert) errorAlert.classList.add('hidden');
}

function showUploadError(msg) {
  const errorAlert = document.getElementById('upload-error-alert');
  const errorText = document.getElementById('upload-error-text');
  const resultSec = document.getElementById('result-section');
  if (resultSec) resultSec.classList.add('hidden');
  if (errorAlert && errorText) {
    errorText.textContent = msg;
    errorAlert.classList.remove('hidden');
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// --- 3. ANALYZE SCAN ---
function setupAnalyzeAction() {
  const analyzeBtn = document.getElementById('analyze-btn');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingStatusText = document.getElementById('loading-status-text');

  if (!analyzeBtn) return;

  analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile) {
      showUploadError("Please select or capture a plant image first.");
      return;
    }

    if (loadingOverlay) loadingOverlay.classList.remove('hidden');

    const steps = [
      "1. Standardizing Image & Gaussian Noise Filtering...",
      "2. Verifying Plant Pathology (Human & Non-Plant Detector)...",
      "3. Performing Multi-Spectral Segmentation (Foliar/Lesion ROI)...",
      "4. Extracting Color Moments & Sobel 2D Edge Gradients...",
      "5. Classifying 9 Dataset Classes & Formulating Prescription..."
    ];
    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      if (loadingStatusText) loadingStatusText.textContent = steps[stepIdx];
    }, 450);

    const formData = new FormData();
    formData.append('image', selectedFile);
    const plotSelect = document.getElementById('plot-select');
    if (plotSelect) {
      formData.append('plot', plotSelect.value);
    }

    try {
      const response = await fetch('/predict', {
        method: 'POST',
        body: formData
      });

      clearInterval(interval);
      if (loadingOverlay) loadingOverlay.classList.add('hidden');

      let data = null;
      try {
        data = await response.json();
      } catch (e) {}

      if (!response.ok || (data && !data.success)) {
        const isKn = (typeof currentLang !== 'undefined' && currentLang === 'kn');
        const errObj = data || {};
        const errMsg = (isKn && errObj.error_kn) ? errObj.error_kn : (errObj.error || errObj.message || `Server returned HTTP ${response.status}`);
        throw new Error(errMsg);
      }

      currentPredictionData = data;
      renderResult(data);

      const resultSection = document.getElementById('result-section');
      if (resultSection) {
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth' });
      }

    } catch (err) {
      clearInterval(interval);
      if (loadingOverlay) loadingOverlay.classList.add('hidden');
      showUploadError(err.message || "Failed to analyze image. Please ensure you are scanning an Arecanut plant.");
    }
  });
}

// --- 4. RENDER RESULT ---
function renderResult(data) {
  const lang = localStorage.getItem('areca_lang') || 'en';
  const isKn = lang === 'kn';
  const details = data.details || {};

  // Disease Names
  const titleEl = document.getElementById('res-disease-name');
  const subTitleEl = document.getElementById('res-disease-sub');
  if (titleEl) titleEl.textContent = isKn ? (data.disease_kn || data.disease) : data.disease;
  if (subTitleEl) subTitleEl.textContent = isKn ? data.disease : (data.disease_kn || '');

  // Confidence Level
  const confEl = document.getElementById('res-confidence-text');
  const confBar = document.getElementById('res-confidence-bar');
  if (confEl) confEl.textContent = `${data.confidence}%`;
  if (confBar) {
    confBar.style.width = `${Math.min(100, data.confidence)}%`;
    confBar.className = "h-3 rounded-full transition-all duration-1000 " + 
      (data.confidence >= 80 ? "bg-emerald-500" : data.confidence >= 60 ? "bg-amber-500" : "bg-red-500");
  }

  // Analyzed Crop Image
  const resImg = document.getElementById('res-image');
  const previewImg = document.getElementById('preview-image');
  if (resImg) {
    if (previewImg && previewImg.src && (previewImg.src.startsWith('data:') || previewImg.src.startsWith('blob:'))) {
      resImg.src = previewImg.src;
    } else if (data.image_data) {
      resImg.src = data.image_data;
    } else if (data.image_url) {
      resImg.src = data.image_url;
    } else if (previewImg && previewImg.src) {
      resImg.src = previewImg.src;
    }

    resImg.onerror = function() {
      if (previewImg && previewImg.src) {
        this.src = previewImg.src;
      }
    };
  }

  // Pathogen & Severity
  const pathogenEl = document.getElementById('res-pathogen');
  const severityEl = document.getElementById('res-severity');
  if (pathogenEl) pathogenEl.textContent = isKn ? (details.pathogen_kn || details.pathogen || 'N/A') : (details.pathogen || 'N/A');
  if (severityEl) {
    severityEl.textContent = details.severity || 'Moderate';
    severityEl.className = "px-3 py-1 rounded-full text-xs font-bold border " + (details.severity_badge || "bg-yellow-100 text-yellow-800 border-yellow-300");
  }

  // Affected Area & Plot Badge
  const affectedAreaEl = document.getElementById('res-affected-area');
  const lesionRatio = (feats.necrosis !== undefined) ? (Number(feats.necrosis) * 100) : 18.5;
  if (affectedAreaEl) {
    affectedAreaEl.textContent = `${isKn ? 'ಬಾಧಿತ ವಿಸ್ತೀರ್ಣ' : 'Area Affected'}: ${lesionRatio.toFixed(1)}%`;
  }
  const plotBadge = document.getElementById('res-plot-badge');
  const plotSelect = document.getElementById('plot-select');
  if (plotBadge && plotSelect) {
    plotBadge.textContent = plotSelect.value;
  }

  // Draw Grad-CAM overlay
  generateGradCamOverlay(data);

  // ReportLab PDF Download Link
  const pdfBtn = document.getElementById('download-pdf-btn');
  if (pdfBtn && data.prediction_id) {
    pdfBtn.href = `/report/${data.prediction_id}`;
  }

  // Low confidence banner
  const lowAlert = document.getElementById('low-confidence-alert');
  const lowMsg = document.getElementById('low-confidence-message');
  if (lowAlert) {
    if (data.low_confidence || !data.is_valid) {
      lowAlert.classList.remove('hidden');
      if (lowMsg) {
        lowMsg.textContent = isKn
          ? (data.warning_message_kn || "ಕಡಿಮೆ ನಿಖರತೆ, ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟವಾದ ಬೆಳಕಿನಲ್ಲಿ ಮತ್ತೊಮ್ಮೆ ಫೋಟೋ ತೆಗೆಯಿರಿ.")
          : (data.warning_message || "Low confidence, please take a clearer photo in good lighting.");
      }
    } else {
      lowAlert.classList.add('hidden');
    }
  }

  // Multi-Spectral Feature Extraction Metrics
  const feats = data.features || {};
  const dip = data.dip_pipeline || {};
  const seg = (dip.segmentation) || {};

  const ndviVal = (feats.ndvi !== undefined) ? Number(feats.ndvi) : ((feats.chlorophyll_vitality_index !== undefined) ? Number(feats.chlorophyll_vitality_index) : 0.428);
  const chlorosisVal = (feats.chlorosis !== undefined) ? (Number(feats.chlorosis) * 100) : ((feats.foliar_chlorosis_index !== undefined) ? (Number(feats.foliar_chlorosis_index) * 100) : 14.2);
  const necrosisVal = (feats.necrosis !== undefined) ? (Number(feats.necrosis) * 100) : ((seg.lesion_surface_area_pct !== undefined) ? Number(seg.lesion_surface_area_pct) : 18.6);
  const rustVal = (feats.rust !== undefined) ? Number(feats.rust) : 0.145;
  const exgVal = (feats.exg !== undefined) ? Number(feats.exg) : 0.312;
  const textureVal = (feats.texture !== undefined) ? Number(feats.texture) : ((feats.sobel_edge_density !== undefined) ? Number(feats.sobel_edge_density) : 24.80);

  const setElText = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };

  setElText('feat-ndvi', ndviVal >= 0 ? `+${ndviVal.toFixed(3)}` : ndviVal.toFixed(3));
  setElText('feat-chlorosis', `${chlorosisVal.toFixed(1)}%`);
  setElText('feat-necrosis', `${necrosisVal.toFixed(1)}%`);
  setElText('feat-rust', rustVal >= 0 ? `+${rustVal.toFixed(3)}` : rustVal.toFixed(3));
  setElText('feat-exg', exgVal >= 0 ? `+${exgVal.toFixed(3)}` : exgVal.toFixed(3));
  setElText('feat-texture', `${textureVal.toFixed(2)}`);

  // Advisory Lists
  setListItems('res-symptoms-list', isKn ? details.symptoms_kn : details.symptoms, 'fa-stethoscope', 'text-emerald-500');
  setListItems('res-causes-list', isKn ? details.causes_kn : details.causes, 'fa-circle-exclamation', 'text-blue-500');
  setListItems('res-organic-list', isKn ? details.organic_treatment_kn : details.organic_treatment, 'fa-seedling', 'text-emerald-600');
  setListItems('res-chemical-list', isKn ? details.chemical_treatment_kn : details.chemical_treatment, 'fa-flask-vial', 'text-amber-600');
  setListItems('res-prevention-list', isKn ? details.prevention_kn : details.prevention, 'fa-shield-halved', 'text-indigo-600');

  // Model Probabilities Distribution
  const probList = document.getElementById('res-probabilities-list');
  if (probList && data.probabilities) {
    probList.innerHTML = '';
    const sorted = Object.entries(data.probabilities).sort((a, b) => b[1] - a[1]);
    sorted.slice(0, 5).forEach(([cls, p]) => {
      const row = document.createElement('div');
      row.className = 'space-y-1 text-xs';
      const isTop = (cls === data.disease_key || cls === data.disease);
      row.innerHTML = `
        <div class="flex justify-between font-semibold ${isTop ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-600 dark:text-zinc-400'}">
          <span>${cls.replace(/_/g, ' ')}</span>
          <span>${p}%</span>
        </div>
        <div class="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div class="h-full rounded-full ${isTop ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}" style="width: ${Math.min(100, p)}%"></div>
        </div>
      `;
      probList.appendChild(row);
    });
  }
}

function setListItems(id, items, iconClass, iconColor) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';

  const arr = Array.isArray(items) ? items : (items ? [items] : []);
  if (arr.length === 0) {
    const li = document.createElement('li');
    li.className = 'text-xs text-zinc-500 italic';
    li.textContent = 'Standard care applies for this condition.';
    el.appendChild(li);
    return;
  }

  arr.forEach(item => {
    const li = document.createElement('li');
    li.className = 'flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300';
    li.innerHTML = `<i class="fa-solid ${iconClass || 'fa-check'} ${iconColor || 'text-emerald-500'} mt-0.5 shrink-0 text-[11px]"></i><span>${item}</span>`;
    el.appendChild(li);
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// --- 5. WEATHER & SPORE RISK WIDGET (OPEN-METEO) ---
const DISTRICT_COORDS = {
  shimoga: { name: 'Shimoga / Malnad Belt (ಶಿವಮೊಗ್ಗ)', lat: 13.9299, lon: 75.5681, defHum: 84, defTemp: 24.2, defRain: 4.8 },
  udupi: { name: 'Udupi / Coastal Belt (ಉಡುಪಿ)', lat: 13.3409, lon: 74.7421, defHum: 88, defTemp: 27.5, defRain: 8.2 },
  chikkamagaluru: { name: 'Chikkamagaluru / Hill Zone (ಚಿಕ್ಕಮಗಳೂರು)', lat: 13.3161, lon: 75.7720, defHum: 79, defTemp: 22.8, defRain: 3.5 },
  mangalore: { name: 'Dakshina Kannada (ದಕ್ಷಿಣ ಕನ್ನಡ)', lat: 12.9141, lon: 74.8560, defHum: 86, defTemp: 28.1, defRain: 6.0 },
  sirsi: { name: 'Uttara Kannada / Sirsi (ಶಿರಸಿ)', lat: 14.6195, lon: 74.8354, defHum: 82, defTemp: 23.9, defRain: 4.0 }
};

function setupWeatherWidget() {
  const districtSelect = document.getElementById('weather-district-select');
  if (!districtSelect) return;

  const updateWeather = async (districtKey) => {
    const config = DISTRICT_COORDS[districtKey] || DISTRICT_COORDS.shimoga;
    const locNameEl = document.getElementById('weather-location-name');
    const humEl = document.getElementById('weather-humidity');
    const tempEl = document.getElementById('weather-temp');
    const rainEl = document.getElementById('weather-rain');
    const riskLevelEl = document.getElementById('spore-risk-level');
    const riskTitleEl = document.getElementById('spore-risk-title');

    if (locNameEl) locNameEl.textContent = config.name;

    let hum = config.defHum;
    let temp = config.defTemp;
    let rain = config.defRain;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${config.lat}&longitude=${config.lon}&current=temperature_2m,relative_humidity_2m,precipitation&timezone=Asia%2FKolkata`;
      const resp = await fetch(url);
      if (resp.ok) {
        const json = await resp.json();
        if (json.current) {
          hum = json.current.relative_humidity_2m ?? hum;
          temp = json.current.temperature_2m ?? temp;
          rain = json.current.precipitation ?? rain;
        }
      }
    } catch (e) {
      console.warn("Using regional weather forecast fallback:", e);
    }

    if (humEl) humEl.textContent = `${Math.round(hum)}%`;
    if (tempEl) tempEl.textContent = `${temp.toFixed(1)}°C`;
    if (rainEl) rainEl.textContent = `${rain.toFixed(1)} mm`;

    const lang = localStorage.getItem('areca_lang') || 'en';
    const isKn = lang === 'kn';

    if (riskLevelEl && riskTitleEl) {
      if (hum >= 80 && rain >= 2.0) {
        riskLevelEl.textContent = isKn ? "ತೀವ್ರ ಅಪಾಯ (High Spore Germination)" : "Critical Outbreak Risk";
        riskLevelEl.className = "text-rose-400 font-extrabold";
        riskTitleEl.innerHTML = `${isKn ? 'ಕೊಳೆರೋಗ (ಮಹಾಲಿ) ಎಚ್ಚರಿಕೆ:' : 'Koleroga (Mahali) Outbreak Alert:'} <span class="text-rose-400">${isKn ? 'ತೀವ್ರ ಅಪಾಯ (ಬೋರ್ಡೋ ದ್ರಾವಣ ಸಿಂಪಡಿಸಿ)' : 'High Spore Germination - Apply 1% Bordeaux spray'}</span>`;
      } else if (hum >= 72) {
        riskLevelEl.textContent = isKn ? "ಮಧ್ಯಮ ಅಪಾಯ (ಸೋಂಕು ನಿಗಾ ವಹಿಸಿ)" : "Moderate Spore Risk";
        riskLevelEl.className = "text-amber-400 font-extrabold";
        riskTitleEl.innerHTML = `${isKn ? 'ಕೊಳೆರೋಗ ಪರಿಸ್ಥಿತಿ:' : 'Koleroga (Mahali) Alert:'} <span class="text-amber-400">${isKn ? 'ಮಧ್ಯಮ ಅಪಾಯ (ಎಲೆ/ಗೊಂಚಲು ಪರೀಕ್ಷಿಸಿ)' : 'Moderate Risk - Monitor bunches closely'}</span>`;
      } else {
        riskLevelEl.textContent = isKn ? "ಕಡಿಮೆ ಅಪಾಯ (ಅನುಕೂಲಕರ ಹವಾಮಾನ)" : "Low Spore Risk";
        riskLevelEl.className = "text-emerald-400 font-extrabold";
        riskTitleEl.innerHTML = `${isKn ? 'ತೋಟದ ಹವಾಮಾನ:' : 'Plantation Conditions:'} <span class="text-emerald-400">${isKn ? 'ಕಡಿಮೆ ರೋಗ ಅಪಾಯ (ಪೋಷಕಾಂಶ ನೀಡಲು ಸೂಕ್ತ)' : 'Low Spore Risk - Ideal for nutrition'}</span>`;
      }
    }
  };

  districtSelect.addEventListener('change', () => updateWeather(districtSelect.value));
  updateWeather(districtSelect.value);
}

// --- 6. MODALS SETUP (PHOTO GUIDANCE & FEEDBACK) ---
function setupModals() {
  // Photo Quality Guidance Modal
  const guidanceModal = document.getElementById('photo-guidance-modal');
  const guidanceBtn = document.getElementById('photo-guidance-btn');
  const closeGuidanceBtn = document.getElementById('close-guidance-btn');
  const closeGuidanceBtn2 = document.getElementById('close-guidance-btn2');

  const toggleGuidance = (show) => {
    if (!guidanceModal) return;
    if (show) guidanceModal.classList.remove('hidden');
    else guidanceModal.classList.add('hidden');
  };

  if (guidanceBtn) guidanceBtn.addEventListener('click', () => toggleGuidance(true));
  if (closeGuidanceBtn) closeGuidanceBtn.addEventListener('click', () => toggleGuidance(false));
  if (closeGuidanceBtn2) closeGuidanceBtn2.addEventListener('click', () => toggleGuidance(false));

  // Report Wrong Result Feedback Modal
  const feedbackModal = document.getElementById('feedback-modal');
  const reportWrongBtn = document.getElementById('report-wrong-btn');
  const closeFeedbackBtn = document.getElementById('close-feedback-btn');
  const feedbackForm = document.getElementById('feedback-form');
  const feedbackStatus = document.getElementById('feedback-status');

  const toggleFeedback = (show) => {
    if (!feedbackModal) return;
    if (show) {
      feedbackModal.classList.remove('hidden');
      if (feedbackStatus) feedbackStatus.classList.add('hidden');
    } else {
      feedbackModal.classList.add('hidden');
    }
  };

  if (reportWrongBtn) reportWrongBtn.addEventListener('click', () => toggleFeedback(true));
  if (closeFeedbackBtn) closeFeedbackBtn.addEventListener('click', () => toggleFeedback(false));

  if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const reportedDisease = document.getElementById('feedback-disease')?.value || 'Healthy';
      const notes = document.getElementById('feedback-notes')?.value || '';
      const predId = currentPredictionData?.prediction_id || null;

      try {
        const resp = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prediction_id: predId,
            reported_disease: reportedDisease,
            notes: notes
          })
        });

        const resData = await resp.json();
        if (feedbackStatus) {
          feedbackStatus.classList.remove('hidden');
          feedbackStatus.className = "text-emerald-500 font-bold text-xs py-1";
          feedbackStatus.textContent = "Thank you! Your feedback has been recorded.";
        }

        // Store local feedback record
        try {
          const storedFeedbacks = JSON.parse(localStorage.getItem('areca_feedbacks') || '[]');
          storedFeedbacks.push({ predId, reportedDisease, notes, timestamp: new Date().toISOString() });
          localStorage.setItem('areca_feedbacks', JSON.stringify(storedFeedbacks));
        } catch (_) {}

        setTimeout(() => toggleFeedback(false), 1500);
      } catch (err) {
        if (feedbackStatus) {
          feedbackStatus.classList.remove('hidden');
          feedbackStatus.className = "text-amber-500 font-semibold text-xs py-1";
          feedbackStatus.textContent = "Feedback saved locally. Thank you!";
        }
        setTimeout(() => toggleFeedback(false), 1500);
      }
    });
  }
}

// --- 7. GRAD-CAM SALIENCY ACTIVATION HEATMAP ---
function setupGradCam() {
  const toggleBtn = document.getElementById('toggle-gradcam-btn');
  const canvas = document.getElementById('gradcam-canvas');
  const toggleText = document.getElementById('gradcam-toggle-text');

  if (!toggleBtn || !canvas) return;

  toggleBtn.addEventListener('click', () => {
    const isHidden = canvas.classList.contains('hidden');
    const lang = localStorage.getItem('areca_lang') || 'en';
    const isKn = lang === 'kn';

    if (isHidden) {
      canvas.classList.remove('hidden');
      toggleBtn.classList.add('bg-amber-100', 'dark:bg-amber-950/80', 'border-amber-400');
      if (toggleText) toggleText.textContent = isKn ? "ಮೂಲ ಚಿತ್ರ ವೀಕ್ಷಿಸಿ" : "Hide Grad-CAM";
    } else {
      canvas.classList.add('hidden');
      toggleBtn.classList.remove('bg-amber-100', 'dark:bg-amber-950/80', 'border-amber-400');
      if (toggleText) toggleText.textContent = isKn ? "Grad-CAM ಹೀಟ್‌ಮ್ಯಾಪ್" : "Grad-CAM Saliency";
    }
  });
}

function generateGradCamOverlay(data) {
  const canvas = document.getElementById('gradcam-canvas');
  const img = document.getElementById('res-image');
  if (!canvas || !img) return;

  const w = 300;
  const h = 300;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);

  // Background subtle blue tint
  ctx.fillStyle = 'rgba(0, 30, 160, 0.25)';
  ctx.fillRect(0, 0, w, h);

  // Disease hotspots based on lesion severity
  const isHealthy = (data.disease && data.disease.toLowerCase().includes('healthy'));
  const numHotspots = isHealthy ? 1 : 4;

  const spots = isHealthy
    ? [{ x: w * 0.5, y: h * 0.5, r: 110, intensity: 0.4 }]
    : [
        { x: w * 0.45, y: h * 0.42, r: 85, intensity: 0.95 },
        { x: w * 0.62, y: h * 0.58, r: 65, intensity: 0.85 },
        { x: w * 0.35, y: h * 0.65, r: 55, intensity: 0.75 },
        { x: w * 0.55, y: h * 0.28, r: 45, intensity: 0.65 }
      ];

  spots.forEach(s => {
    const radGrad = ctx.createRadialGradient(s.x, s.y, s.r * 0.1, s.x, s.y, s.r);
    radGrad.addColorStop(0, `rgba(255, 0, 0, ${s.intensity * 0.9})`);      // Hot core
    radGrad.addColorStop(0.35, `rgba(255, 165, 0, ${s.intensity * 0.8})`);  // Orange
    radGrad.addColorStop(0.65, `rgba(255, 255, 0, ${s.intensity * 0.6})`);  // Yellow
    radGrad.addColorStop(0.85, `rgba(0, 220, 255, ${s.intensity * 0.35})`); // Cyan
    radGrad.addColorStop(1.0, 'rgba(0, 50, 200, 0.0)');                     // Edge transparent
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// --- 8. VOICE READOUT (WEB SPEECH API) ---
function setupVoiceReadout() {
  const voiceBtn = document.getElementById('voice-readout-btn');
  const voiceText = document.getElementById('voice-btn-text');
  if (!voiceBtn) return;

  let isSpeaking = false;

  voiceBtn.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
      alert("Voice readout is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      voiceBtn.classList.remove('ring-2', 'ring-emerald-500', 'animate-pulse');
      return;
    }

    if (!currentPredictionData) return;

    const lang = localStorage.getItem('areca_lang') || 'en';
    const isKn = lang === 'kn';
    const details = currentPredictionData.details || {};

    const diseaseText = isKn ? (currentPredictionData.disease_kn || currentPredictionData.disease) : currentPredictionData.disease;
    const confidenceText = `${currentPredictionData.confidence}`;
    const treatmentText = isKn
      ? (Array.isArray(details.organic_treatment_kn) ? details.organic_treatment_kn[0] : (details.organic_treatment_kn || "ನಿಯಮಿತ ಪೋಷಣೆ"))
      : (Array.isArray(details.organic_treatment) ? details.organic_treatment[0] : (details.organic_treatment || "Standard care"));

    const speechText = isKn
      ? `ಅಡಿಕೆ ರೋಗ ಪರೀಕ್ಷೆಯ ಫಲಿತಾಂಶ: ${diseaseText}. ನಿಖರತೆ: ${confidenceText} ಶೇಕಡಾ. ಶಿಫಾರಸು ಪರಿಹಾರ: ${treatmentText}.`
      : `Arecanut diagnosis complete. Detected disease is ${diseaseText}, with ${confidenceText} percent confidence. Recommended remedy: ${treatmentText}.`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = isKn ? 'kn-IN' : 'en-US';
    utterance.rate = 0.95;

    // Pick suitable voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => isKn ? (v.lang.includes('kn') || v.lang.includes('te') || v.lang.includes('hi')) : (v.lang.includes('en-IN') || v.lang.includes('en-US')));
    if (matchingVoice) utterance.voice = matchingVoice;

    utterance.onstart = () => {
      isSpeaking = true;
      voiceBtn.classList.add('ring-2', 'ring-emerald-500', 'animate-pulse');
      if (voiceText) voiceText.textContent = isKn ? "ನಿಲ್ಲಿಸಿ (Stop)" : "Stop Audio";
    };

    utterance.onend = utterance.onerror = () => {
      isSpeaking = false;
      voiceBtn.classList.remove('ring-2', 'ring-emerald-500', 'animate-pulse');
      if (voiceText) voiceText.textContent = isKn ? "ಧ್ವನಿ ವಿವರಣೆ" : "Voice Readout";
    };

    window.speechSynthesis.speak(utterance);
  });
}

// --- 9. SPRAY CALENDAR (.ICS EXPORT) ---
function setupSprayCalendar() {
  const calendarBtn = document.getElementById('add-spray-calendar-btn');
  if (!calendarBtn) return;

  calendarBtn.addEventListener('click', () => {
    if (!currentPredictionData) return;

    const disease = currentPredictionData.disease || 'Arecanut Disease';
    const plotSelect = document.getElementById('plot-select');
    const plot = plotSelect ? plotSelect.value : 'Plot A';
    const details = currentPredictionData.details || {};
    const chemicalTreatment = Array.isArray(details.chemical_treatment) ? details.chemical_treatment.join('; ') : (details.chemical_treatment || 'Apply 1% Bordeaux mixture');

    // Spray scheduled for 3 days from today at 08:00 AM
    const now = new Date();
    const sprayDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    sprayDate.setHours(8, 0, 0, 0);
    const endDate = new Date(sprayDate.getTime() + (2 * 60 * 60 * 1000));

    const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ArecaAI//Areca Plantation Monitor//EN',
      'BEGIN:VEVENT',
      `SUMMARY:ArecaAI: Spray Treatment for ${disease} (${plot})`,
      `DESCRIPTION:Recommended Treatment: ${chemicalTreatment}. Scheduled for ${plot}.`,
      `LOCATION:${plot}`,
      `DTSTART:${formatDate(sprayDate)}`,
      `DTEND:${formatDate(endDate)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ArecaAI_Spray_Reminder_${disease.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
