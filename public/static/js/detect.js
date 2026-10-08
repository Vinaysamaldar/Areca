/**
 * Disease Detection Logic
 * Drag & drop, webcam capture, validation, API submission, and result presentation
 */

let selectedFile = null;
let currentPredictionData = null;
let webcamStream = null;
let currentCameraIndex = 0;
let videoDevices = [];

document.addEventListener('DOMContentLoaded', () => {
  setupFileUpload();
  setupWebcamModal();
  setupAnalyzeAction();
  setupSampleImages();

  // Listen to language switch to update result texts dynamically
  window.addEventListener('languageChanged', (e) => {
    if (currentPredictionData) {
      renderResult(currentPredictionData);
    }
  });
});

// --- 1. FILE UPLOAD & DRAG/DROP ---
function setupFileUpload() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const previewContainer = document.getElementById('preview-container');
  const previewImage = document.getElementById('preview-image');
  const previewFilename = document.getElementById('preview-filename');
  const previewFilesize = document.getElementById('preview-filesize');
  const removeBtn = document.getElementById('remove-preview-btn');
  const analyzeBtn = document.getElementById('analyze-btn');

  if (!dropzone || !fileInput) return;

  // Dropzone click
  dropzone.addEventListener('click', () => fileInput.click());

  // Drag over / leave
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dropzone-active');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dropzone-active');
    });
  });

  // Handle drop
  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  // Mobile camera button and native file capture
  const mobileCamBtn = document.getElementById('mobile-cam-btn');
  const chooseFileBtn = document.getElementById('choose-file-btn');
  const cameraFileInput = document.getElementById('camera-file-input');

  if (mobileCamBtn && cameraFileInput) {
    mobileCamBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cameraFileInput.click();
    });
    cameraFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelected(e.target.files[0]);
      }
    });
  }

  if (chooseFileBtn && fileInput) {
    chooseFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  // Remove preview
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearSelection();
    });
  }
}

function handleFileSelected(file) {
  const errorAlert = document.getElementById('upload-error-alert');
  const errorText = document.getElementById('upload-error-text');
  const previewContainer = document.getElementById('preview-container');
  const dropzonePrompt = document.getElementById('dropzone-prompt');
  const previewImage = document.getElementById('preview-image');
  const previewFilename = document.getElementById('preview-filename');
  const previewFilesize = document.getElementById('preview-filesize');
  const analyzeBtn = document.getElementById('analyze-btn');

  errorAlert.classList.add('hidden');

  // Format validation
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showUploadError("Invalid file type! Please upload a JPG, PNG, or WEBP image.");
    return;
  }

  // Size validation: 5 MB = 5 * 1024 * 1024 bytes
  const maxSizeBytes = 5 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    showUploadError("File is too large! Maximum allowed image size is 5 MB.");
    return;
  }

  selectedFile = file;

  // Render preview
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    previewFilename.textContent = file.name;
    previewFilesize.textContent = (file.size / (1024 * 1024)).toFixed(2) + " MB";

    dropzonePrompt.classList.add('hidden');
    previewContainer.classList.remove('hidden');
    analyzeBtn.removeAttribute('disabled');
    analyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  };
  reader.readAsDataURL(file);
}

function clearSelection() {
  selectedFile = null;
  const fileInput = document.getElementById('file-input');
  const cameraFileInput = document.getElementById('camera-file-input');
  if (fileInput) fileInput.value = '';
  if (cameraFileInput) cameraFileInput.value = '';

  const dropzonePrompt = document.getElementById('dropzone-prompt');
  const previewContainer = document.getElementById('preview-container');
  const analyzeBtn = document.getElementById('analyze-btn');
  const errorAlert = document.getElementById('upload-error-alert');

  if (dropzonePrompt) dropzonePrompt.classList.remove('hidden');
  if (previewContainer) previewContainer.classList.add('hidden');
  if (analyzeBtn) {
    analyzeBtn.setAttribute('disabled', 'true');
    analyzeBtn.classList.add('opacity-50', 'cursor-not-allowed');
  }
  if (errorAlert) errorAlert.classList.add('hidden');
}

function showUploadError(msg) {
  const errorAlert = document.getElementById('upload-error-alert');
  const errorText = document.getElementById('upload-error-text');
  if (errorAlert && errorText) {
    errorText.textContent = msg;
    errorAlert.classList.remove('hidden');
  }
}

// --- 2. WEBCAM CAPTURE MODAL ---
function setupWebcamModal() {
  const openWebcamBtn = document.getElementById('open-webcam-btn');
  const webcamModal = document.getElementById('webcam-modal');
  const closeWebcamBtn = document.getElementById('close-webcam-btn');
  const capturePhotoBtn = document.getElementById('capture-photo-btn');
  const retakePhotoBtn = document.getElementById('retake-photo-btn');
  const usePhotoBtn = document.getElementById('use-photo-btn');
  const switchCameraBtn = document.getElementById('switch-camera-btn');
  const video = document.getElementById('webcam-video');
  const canvas = document.getElementById('webcam-canvas');
  let capturedBlob = null;

  if (!openWebcamBtn || !webcamModal) return;

  openWebcamBtn.addEventListener('click', async () => {
    webcamModal.classList.remove('hidden');
    await startCamera();
  });

  closeWebcamBtn.addEventListener('click', () => {
    stopCamera();
    webcamModal.classList.add('hidden');
  });

  async function startCamera() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      videoDevices = devices.filter(d => d.kind === 'videoinput');

      const videoConstraint = videoDevices.length > 0 && videoDevices[currentCameraIndex]
        ? { deviceId: { exact: videoDevices[currentCameraIndex].deviceId } }
        : { facingMode: { ideal: 'environment' } };

      const constraints = {
        video: Object.assign({
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, videoConstraint)
      };

      if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop());
      }

      webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = webcamStream;
      video.classList.remove('hidden');
      canvas.classList.add('hidden');

      capturePhotoBtn.classList.remove('hidden');
      retakePhotoBtn.classList.add('hidden');
      usePhotoBtn.classList.add('hidden');
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access camera. Please check camera permissions or upload an image file directly.");
      webcamModal.classList.add('hidden');
    }
  }

  function stopCamera() {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      webcamStream = null;
    }
  }

  // Switch front/back camera
  if (switchCameraBtn) {
    switchCameraBtn.addEventListener('click', async () => {
      if (videoDevices.length > 1) {
        currentCameraIndex = (currentCameraIndex + 1) % videoDevices.length;
        await startCamera();
      }
    });
  }

  // Capture photo from video feed
  capturePhotoBtn.addEventListener('click', () => {
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    video.classList.add('hidden');
    canvas.classList.remove('hidden');

    capturePhotoBtn.classList.add('hidden');
    retakePhotoBtn.classList.remove('hidden');
    usePhotoBtn.classList.remove('hidden');

    canvas.toBlob((blob) => {
      capturedBlob = blob;
    }, 'image/jpeg', 0.95);
  });

  // Retake photo
  retakePhotoBtn.addEventListener('click', () => {
    video.classList.remove('hidden');
    canvas.classList.add('hidden');
    capturePhotoBtn.classList.remove('hidden');
    retakePhotoBtn.classList.add('hidden');
    usePhotoBtn.classList.add('hidden');
  });

  // Use captured photo
  usePhotoBtn.addEventListener('click', () => {
    if (capturedBlob) {
      const file = new File([capturedBlob], `areca_webcam_${Date.now()}.jpg`, { type: 'image/jpeg' });
      handleFileSelected(file);
      stopCamera();
      webcamModal.classList.add('hidden');
    }
  });
}

// --- 3. SAMPLE IMAGES HELPER ---
function setupSampleImages() {
  document.querySelectorAll('.sample-leaf-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const sampleUrl = btn.getAttribute('data-img');
      const sampleName = btn.getAttribute('data-name') || 'sample_leaf.jpg';
      try {
        const resp = await fetch(sampleUrl);
        const blob = await resp.blob();
        const file = new File([blob], sampleName, { type: blob.type || 'image/jpeg' });
        handleFileSelected(file);
      } catch (err) {
        console.warn("Could not load sample image:", err);
      }
    });
  });
}

// --- 4. ANALYZE ACTION & PREDICTION SUBMISSION ---
function setupAnalyzeAction() {
  const analyzeBtn = document.getElementById('analyze-btn');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingStatusText = document.getElementById('loading-status-text');

  if (!analyzeBtn) return;

  analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile) {
      showUploadError("Please select or capture an image first.");
      return;
    }

    // Show loading spinner
    loadingOverlay.classList.remove('hidden');
    const statusSteps = [
      "Preprocessing image (Resizing 224x224, Normalizing)...",
      "Extracting convolutional feature representations...",
      "Evaluating MobileNetV2 Softmax activations...",
      "Retrieving agronomic treatment advisory..."
    ];
    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % statusSteps.length;
      if (loadingStatusText) loadingStatusText.textContent = statusSteps[stepIndex];
    }, 450);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('/predict', {
        method: 'POST',
        body: formData
      });

      clearInterval(interval);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Prediction request failed.");
      }

      currentPredictionData = data;
      loadingOverlay.classList.add('hidden');

      // Render Result section
      renderResult(data);

      // Smooth scroll to result
      const resultSection = document.getElementById('result-section');
      if (resultSection) {
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth' });
      }

    } catch (err) {
      clearInterval(interval);
      loadingOverlay.classList.add('hidden');
      showUploadError(err.message || "Failed to analyze image. Please try again.");
    }
  });
}

// --- 5. RENDER RESULT DETAILS ---
function renderResult(data) {
  const lang = localStorage.getItem('areca_lang') || 'en';
  const isKn = lang === 'kn';

  // Disease Title
  const titleEl = document.getElementById('res-disease-name');
  if (titleEl) {
    titleEl.textContent = isKn ? (data.disease_kn || data.disease) : data.disease;
  }

  // Kannada Subtitle if English is active, or English if Kannada active
  const subTitleEl = document.getElementById('res-disease-sub');
  if (subTitleEl) {
    subTitleEl.textContent = isKn ? data.disease : (data.disease_kn || '');
  }

  // Confidence & Progress Bar
  const confEl = document.getElementById('res-confidence-text');
  const confBar = document.getElementById('res-confidence-bar');
  const conf = data.confidence;

  if (confEl) confEl.textContent = `${conf}%`;
  if (confBar) {
    confBar.style.width = `${Math.min(100, conf)}%`;
    confBar.className = "h-4 rounded-full transition-all duration-1000 " + 
      (conf >= 80 ? "bg-emerald-500" : conf >= 60 ? "bg-amber-500" : "bg-red-500");
  }

  // Result Image
  const resImg = document.getElementById('res-image');
  if (resImg) {
    resImg.src = data.image_url;
  }

  // Pathogen & Severity
  const pathogenEl = document.getElementById('res-pathogen');
  const severityEl = document.getElementById('res-severity');
  const details = data.details || {};

  if (pathogenEl) {
    pathogenEl.textContent = isKn ? (details.pathogen_kn || details.pathogen || 'N/A') : (details.pathogen || 'N/A');
  }
  if (severityEl) {
    severityEl.textContent = details.severity || 'Moderate';
    severityEl.className = "px-3 py-1 rounded-full text-xs font-bold border " + (details.severity_badge || "bg-yellow-100 text-yellow-800");
  }

  // Low Confidence Alert (< 60%)
  const lowConfAlert = document.getElementById('low-confidence-alert');
  const lowConfMsg = document.getElementById('low-confidence-message');
  if (lowConfAlert) {
    if (data.low_confidence) {
      lowConfAlert.classList.remove('hidden');
      if (lowConfMsg) {
        lowConfMsg.textContent = isKn 
          ? (data.warning_message_kn || "ಖಚಿತವಾಗಿ ಗುರುತಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ (<60% ನಿಖರತೆ). ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟವಾದ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.")
          : (data.warning_message || "Unable to identify (<60% confidence), please upload a clearer image.");
      }
    } else {
      lowConfAlert.classList.add('hidden');
    }
  }

  // Render Probabilities breakdown
  renderProbabilities(data.probabilities || {});

  // Render Diagnostic Tabs (Symptoms, Causes, Organic, Chemical, Prevention)
  renderList('res-symptoms-list', isKn ? details.symptoms_kn : details.symptoms);
  renderList('res-causes-list', isKn ? details.causes_kn : details.causes);
  renderList('res-organic-list', isKn ? details.organic_treatment_kn : details.organic_treatment);
  renderList('res-chemical-list', isKn ? details.chemical_treatment_kn : details.chemical_treatment);
  renderList('res-prevention-list', isKn ? details.prevention_kn : details.prevention);
}

function renderList(elementId, items) {
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = '';

  if (!items || items.length === 0) {
    container.innerHTML = '<li class="text-zinc-500 italic">No specific recommendations needed.</li>';
    return;
  }

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = "flex items-start space-x-2 text-sm text-zinc-700 dark:text-zinc-300";
    li.innerHTML = `
      <span class="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">•</span>
      <span>${item}</span>
    `;
    container.appendChild(li);
  });
}

function renderProbabilities(probabilities) {
  const container = document.getElementById('res-probabilities-list');
  if (!container) return;
  container.innerHTML = '';

  Object.entries(probabilities).forEach(([cls, prob]) => {
    const row = document.createElement('div');
    row.className = "space-y-1";
    row.innerHTML = `
      <div class="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
        <span class="font-medium">${cls}</span>
        <span class="font-bold">${prob}%</span>
      </div>
      <div class="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
        <div class="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full" style="width: ${prob}%"></div>
      </div>
    `;
    container.appendChild(row);
  });
}
