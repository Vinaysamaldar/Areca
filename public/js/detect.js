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
  if (resImg) resImg.src = data.image_url;

  // Pathogen & Severity
  const pathogenEl = document.getElementById('res-pathogen');
  const severityEl = document.getElementById('res-severity');
  if (pathogenEl) pathogenEl.textContent = isKn ? (details.pathogen_kn || details.pathogen || 'N/A') : (details.pathogen || 'N/A');
  if (severityEl) {
    severityEl.textContent = details.severity || 'Moderate';
    severityEl.className = "px-3 py-1 rounded-full text-xs font-bold border " + (details.severity_badge || "bg-yellow-100 text-yellow-800 border-yellow-300");
  }

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

  // Advisory Sections
  setText('res-symptoms-text', isKn ? details.symptoms_kn : details.symptoms);
  setText('res-organic-text', isKn ? details.organic_treatment_kn : details.organic_treatment);
  setText('res-chemical-text', isKn ? details.chemical_treatment_kn : details.chemical_treatment);
  setText('res-prevention-text', isKn ? details.prevention_kn : details.prevention);
  setText('res-expert-text', isKn ? details.when_to_consult_expert_kn : details.when_to_consult_expert);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  if (Array.isArray(val)) {
    el.innerHTML = val.map(v => `• ${v}`).join('<br/>');
  } else {
    el.textContent = val || 'Not applicable for this condition.';
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
