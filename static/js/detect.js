/**
 * ArecaAI Disease Detection & Multi-Part Tree Scan Logic
 * Supports:
 * - Part-wise selector (Auto, Leaf, Nut, Stem, Root)
 * - Multi-Part simultaneous scan (Leaf + Nut + Stem + Root)
 * - Direct download of ReportLab PDF diagnostic reports
 * - Responsive bilingual English & Kannada UI
 */

let selectedFile = null;
let selectedPart = 'auto';
let currentPredictionData = null;
let activeScanMode = 'single'; // 'single' or 'multi'

// Multi-part slots data
const multiPartFiles = {
  leaf: null,
  nut: null,
  stem: null,
  root: null
};

document.addEventListener('DOMContentLoaded', () => {
  setupPartTabs();
  setupModeSwitch();
  setupFileUpload();
  setupMultiScanSlots();
  setupAnalyzeAction();
  setupMultiAnalyzeAction();

  window.addEventListener('languageChanged', () => {
    if (currentPredictionData) {
      renderResult(currentPredictionData);
    }
  });

  const scanAgainBtn = document.getElementById('scan-again-btn');
  if (scanAgainBtn) {
    scanAgainBtn.addEventListener('click', () => {
      clearSelection();
      document.getElementById('result-section').classList.add('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});

// --- 1. PART TABS SELECTOR ---
function setupPartTabs() {
  const tabs = document.querySelectorAll('.part-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-600', 'shadow-sm', 'active');
        t.classList.add('bg-zinc-50', 'dark:bg-zinc-800', 'text-zinc-700', 'dark:text-zinc-300', 'border-zinc-200', 'dark:border-zinc-700');
      });
      tab.classList.remove('bg-zinc-50', 'dark:bg-zinc-800', 'text-zinc-700', 'dark:text-zinc-300', 'border-zinc-200', 'dark:border-zinc-700');
      tab.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600', 'shadow-sm', 'active');
      selectedPart = tab.getAttribute('data-part') || 'auto';
    });
  });
}

// --- 2. MODE SWITCHER (SINGLE VS MULTI-PART) ---
function setupModeSwitch() {
  const btnSingle = document.getElementById('mode-single-btn');
  const btnMulti = document.getElementById('mode-multi-btn');
  const containerSingle = document.getElementById('single-scan-container');
  const containerMulti = document.getElementById('multi-scan-container');
  const resSingle = document.getElementById('result-section');
  const resMulti = document.getElementById('multi-result-section');

  if (!btnSingle || !btnMulti) return;

  btnSingle.addEventListener('click', () => {
    activeScanMode = 'single';
    btnSingle.className = "flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-sm transition-all flex items-center justify-center gap-2";
    btnMulti.className = "flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:white transition-all flex items-center justify-center gap-2";
    
    containerSingle.classList.remove('hidden');
    containerMulti.classList.add('hidden');
    resMulti.classList.add('hidden');
  });

  btnMulti.addEventListener('click', () => {
    activeScanMode = 'multi';
    btnMulti.className = "flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-sm transition-all flex items-center justify-center gap-2";
    btnSingle.className = "flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:white transition-all flex items-center justify-center gap-2";

    containerSingle.classList.add('hidden');
    containerMulti.classList.remove('hidden');
    resSingle.classList.add('hidden');
  });
}

// --- 3. SINGLE FILE UPLOAD ---
function setupFileUpload() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const cameraInput = document.getElementById('camera-file-input');
  const mobileCamBtn = document.getElementById('mobile-cam-btn');
  const removeBtn = document.getElementById('remove-preview-btn');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach(eName => {
    dropzone.addEventListener(eName, (e) => {
      e.preventDefault();
      dropzone.classList.add('border-emerald-500');
    });
  });

  ['dragleave', 'drop'].forEach(eName => {
    dropzone.addEventListener(eName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-emerald-500');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelected(files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFileSelected(e.target.files[0]);
  });

  if (mobileCamBtn && cameraInput) {
    mobileCamBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cameraInput.click();
    });
    cameraInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleFileSelected(e.target.files[0]);
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearSelection();
    });
  }
}

function handleFileSelected(file) {
  const errorAlert = document.getElementById('upload-error-alert');
  const previewContainer = document.getElementById('preview-container');
  const dropzonePrompt = document.getElementById('dropzone-prompt');
  const previewImage = document.getElementById('preview-image');
  const previewFilename = document.getElementById('preview-filename');
  const previewFilesize = document.getElementById('preview-filesize');
  const analyzeBtn = document.getElementById('analyze-btn');

  errorAlert.classList.add('hidden');

  if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
    showUploadError("Invalid file type! Please upload JPG, PNG, or WEBP.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showUploadError("Image is too large! Maximum allowed size is 10 MB.");
    return;
  }

  selectedFile = file;

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
  if (fileInput) fileInput.value = '';

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
  const resultSec = document.getElementById('result-section');
  const multiSec = document.getElementById('multi-result-section');
  if (resultSec) resultSec.classList.add('hidden');
  if (multiSec) multiSec.classList.add('hidden');
  if (errorAlert && errorText) {
    errorText.textContent = msg;
    errorAlert.classList.remove('hidden');
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// --- 4. MULTI-PART SLOTS HANDLING ---
function setupMultiScanSlots() {
  const slots = document.querySelectorAll('.multi-part-slot');
  const analyzeMultiBtn = document.getElementById('analyze-multi-btn');

  slots.forEach(slot => {
    const part = slot.getAttribute('data-part');
    const input = slot.querySelector('.multi-file-input');
    const preview = slot.querySelector('.slot-preview');
    const previewImg = preview.querySelector('img');
    const prompt = slot.querySelector('.slot-prompt');
    const removeBtn = slot.querySelector('.slot-remove');

    slot.addEventListener('click', (e) => {
      if (e.target === removeBtn) return;
      input.click();
    });

    input.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        multiPartFiles[part] = file;
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewImg.src = ev.target.result;
          preview.classList.remove('hidden');
          prompt.classList.add('hidden');
          slot.classList.add('border-emerald-500', 'bg-emerald-50/20');
          checkMultiAnalyzeReady();
        };
        reader.readAsDataURL(file);
      }
    });

    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      multiPartFiles[part] = null;
      input.value = '';
      preview.classList.add('hidden');
      prompt.classList.remove('hidden');
      slot.classList.remove('border-emerald-500', 'bg-emerald-50/20');
      checkMultiAnalyzeReady();
    });
  });

  function checkMultiAnalyzeReady() {
    const hasAny = Object.values(multiPartFiles).some(f => f !== null);
    if (hasAny) {
      analyzeMultiBtn.removeAttribute('disabled');
      analyzeMultiBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
      analyzeMultiBtn.setAttribute('disabled', 'true');
      analyzeMultiBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }
}

// --- 5. ANALYZE SINGLE SCAN ---
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

    loadingOverlay.classList.remove('hidden');
    const steps = [
      "Preprocessing image (Resizing 224x224, Normalizing)...",
      "Model A: Identifying plant part (Leaf, Stem, Root, Nut)...",
      "Model B: Classifying pathological condition...",
      "Generating diagnostic report & prescription..."
    ];
    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      if (loadingStatusText) loadingStatusText.textContent = steps[stepIdx];
    }, 450);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('part', selectedPart);

    try {
      let response = await fetch('/predict', {
        method: 'POST',
        body: formData
      });

      clearInterval(interval);
      loadingOverlay.classList.add('hidden');

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
      loadingOverlay.classList.add('hidden');
      showUploadError(err.message || "Failed to analyze image. Please try again.");
    }
  });
}

// --- 6. ANALYZE MULTI-PART PALM SCAN ---
function setupMultiAnalyzeAction() {
  const analyzeMultiBtn = document.getElementById('analyze-multi-btn');
  const loadingOverlay = document.getElementById('loading-overlay');
  const multiResultSection = document.getElementById('multi-result-section');
  const multiScansGrid = document.getElementById('multi-scans-grid');
  const multiOverallStatus = document.getElementById('multi-overall-status');
  const downloadMultiPdfBtn = document.getElementById('download-multi-pdf-btn');

  if (!analyzeMultiBtn) return;

  analyzeMultiBtn.addEventListener('click', async () => {
    loadingOverlay.classList.remove('hidden');
    
    const formData = new FormData();
    for (const [part, file] of Object.entries(multiPartFiles)) {
      if (file) {
        formData.append('images', file);
        formData.append(`part_${file.name}`, part);
      }
    }

    try {
      const response = await fetch('/predict', {
        method: 'POST',
        body: formData
      });

      loadingOverlay.classList.add('hidden');
      let data = null;
      try {
        data = await response.json();
      } catch (e) {}

      if (!response.ok || (data && !data.success)) {
        const isKn = (typeof currentLang !== 'undefined' && currentLang === 'kn');
        const errObj = data || {};
        const errMsg = (isKn && errObj.error_kn) ? errObj.error_kn : (errObj.error || errObj.message || "Multi-part scan failed.");
        throw new Error(errMsg);
      }

      const scans = data.scans || (data.prediction_id ? [data] : []);
      multiOverallStatus.textContent = data.overall_health || "Palm Assessment Complete";
      
      // Render cards
      multiScansGrid.innerHTML = '';
      scans.forEach(scan => {
        const card = document.createElement('div');
        card.className = "bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-3";
        card.innerHTML = `
          <div class="flex items-center space-x-3">
            <img src="${scan.image_url}" class="w-16 h-16 rounded-xl object-cover border border-emerald-500">
            <div>
              <span class="text-xs font-bold uppercase text-emerald-600">${scan.part.toUpperCase()}</span>
              <h4 class="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">${scan.disease}</h4>
              <p class="text-xs text-zinc-500 font-kannada">${scan.disease_kn || ''}</p>
            </div>
          </div>
          <div class="flex justify-between items-center text-xs pt-1 border-t border-zinc-200 dark:border-zinc-700">
            <span class="font-semibold text-zinc-600 dark:text-zinc-400">Confidence: <b>${scan.confidence}%</b></span>
            <span class="px-2 py-0.5 rounded text-[11px] font-bold ${scan.details?.severity_badge || 'bg-emerald-100 text-emerald-800'}">${scan.details?.severity || 'Moderate'}</span>
          </div>
          <a href="/report/${scan.prediction_id}" target="_blank" class="block text-center text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-zinc-900 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50">
            <i class="fa-solid fa-file-pdf mr-1"></i> Part Diagnostic PDF
          </a>
        `;
        multiScansGrid.appendChild(card);
      });

      // Hook Multi PDF button
      downloadMultiPdfBtn.onclick = async () => {
        try {
          const repResp = await fetch('/report/multipart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scans })
          });
          const blob = await repResp.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = "ArecaAI_Comprehensive_Palm_Report.pdf";
          document.body.appendChild(a);
          a.click();
          a.remove();
        } catch (e) {
          alert("Could not generate integrated PDF: " + e.message);
        }
      };

      multiResultSection.classList.remove('hidden');
      multiResultSection.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      loadingOverlay.classList.add('hidden');
      alert(`Multi-scan failed: ${err.message}`);
    }
  });
}

// --- 7. RENDER SINGLE RESULT ---
function renderResult(data) {
  const lang = localStorage.getItem('areca_lang') || 'en';
  const isKn = lang === 'kn';
  const details = data.details || {};

  // Part Badge
  const partBadge = document.getElementById('res-part-badge');
  if (partBadge) {
    const partName = isKn ? (data.part_kn || data.part) : (data.part || 'Leaf');
    partBadge.textContent = (partName || 'Leaf').toUpperCase();
  }

  // Titles
  const titleEl = document.getElementById('res-disease-name');
  const subTitleEl = document.getElementById('res-disease-sub');
  if (titleEl) titleEl.textContent = isKn ? (data.disease_kn || data.disease) : data.disease;
  if (subTitleEl) subTitleEl.textContent = isKn ? data.disease : (data.disease_kn || '');

  // Confidence
  const confEl = document.getElementById('res-confidence-text');
  const confBar = document.getElementById('res-confidence-bar');
  if (confEl) confEl.textContent = `${data.confidence}%`;
  if (confBar) {
    confBar.style.width = `${Math.min(100, data.confidence)}%`;
    confBar.className = "h-2.5 rounded-full transition-all duration-1000 " + 
      (data.confidence >= 80 ? "bg-emerald-500" : data.confidence >= 60 ? "bg-amber-500" : "bg-red-500");
  }

  // Image
  const resImg = document.getElementById('res-image');
  if (resImg) resImg.src = data.image_url;

  // Pathogen & Severity
  const pathogenEl = document.getElementById('res-pathogen');
  const severityEl = document.getElementById('res-severity');
  if (pathogenEl) pathogenEl.textContent = isKn ? (details.pathogen_kn || details.pathogen || 'N/A') : (details.pathogen || 'N/A');
  if (severityEl) {
    severityEl.textContent = details.severity || 'Moderate';
    severityEl.className = "px-3 py-1 rounded-full text-xs font-bold border " + (details.severity_badge || "bg-yellow-100 text-yellow-800");
  }

  // Direct ReportLab PDF link
  const pdfBtn = document.getElementById('download-pdf-btn');
  if (pdfBtn && data.prediction_id) {
    pdfBtn.href = `/report/${data.prediction_id}`;
  }

  // Low confidence banner
  const lowAlert = document.getElementById('low-confidence-alert');
  const lowMsg = document.getElementById('low-confidence-message');
  if (lowAlert) {
    if (data.low_confidence || data.part === 'not_arecanut') {
      lowAlert.classList.remove('hidden');
      if (lowMsg) {
        lowMsg.textContent = isKn
          ? (data.warning_message_kn || "ಅಡಿಕೆ ಭಾಗ ಪತ್ತೆಯಾಗಿಲ್ಲ, ದಯವಿಟ್ಟು ಹತ್ತಿರದಿಂದ ಸ್ಪಷ್ಟ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.")
          : (data.warning_message || "No arecanut part detected, move closer or improve lighting");
      }
    } else {
      lowAlert.classList.add('hidden');
    }
  }

  // Text advisory sections
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
    el.textContent = val || 'Not applicable for this health status.';
  }
}
