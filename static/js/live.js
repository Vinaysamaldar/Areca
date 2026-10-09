/**
 * ArecaAI Live Camera Scanner
 * Features:
 * - HTML5 getUserMedia with rear-facing camera priority & flip toggle
 * - Client-side 224x224 frame downsampling before Base64 transport (<15KB)
 * - 1 FPS frame timer with in-flight lock to eliminate server lag
 * - 5-frame majority voting filter to prevent label flicker
 * - Low-confidence / non-arecanut rejection alert
 * - Snapshot capture & save
 */

document.addEventListener('DOMContentLoaded', () => {
  const liveVideo = document.getElementById('liveVideo');
  const captureCanvas = document.getElementById('captureCanvas');
  const videoPlaceholder = document.getElementById('videoPlaceholder');
  const scannerOverlay = document.getElementById('scannerOverlay');
  const liveBadgeHUD = document.getElementById('liveBadgeHUD');
  const badgeContainer = document.getElementById('badgeContainer');
  const badgeIndicator = document.getElementById('badgeIndicator');
  const badgePart = document.getElementById('badgePart');
  const badgeDisease = document.getElementById('badgeDisease');
  const badgeConfidence = document.getElementById('badgeConfidence');
  const badgeSeverity = document.getElementById('badgeSeverity');
  const noPartNotice = document.getElementById('noPartNotice');
  const noPartNoticeText = document.getElementById('noPartNoticeText');
  const permErrorBox = document.getElementById('permErrorBox');

  const btnToggleStream = document.getElementById('btnToggleStream');
  const btnToggleIcon = document.getElementById('btnToggleIcon');
  const btnToggleText = document.getElementById('btnToggleText');
  const btnSwitchCam = document.getElementById('btnSwitchCam');
  const btnCaptureSave = document.getElementById('btnCaptureSave');

  let stream = null;
  let isScanning = false;
  let scanInterval = null;
  let isProcessingFrame = false;
  let currentFacingMode = 'environment'; // Rear camera preferred
  let selectedPart = 'auto';

  // 5-Frame Smoothing Buffer
  const SMOOTH_WINDOW_SIZE = 5;
  let frameBuffer = [];

  // Part Selector buttons
  const partBtns = document.querySelectorAll('.part-select-btn');
  partBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      partBtns.forEach(b => {
        b.classList.remove('bg-emerald-600', 'text-white', 'active');
        b.classList.add('bg-zinc-100', 'dark:bg-zinc-800', 'text-zinc-700', 'dark:text-zinc-300');
      });
      btn.classList.remove('bg-zinc-100', 'dark:bg-zinc-800', 'text-zinc-700', 'dark:text-zinc-300');
      btn.classList.add('bg-emerald-600', 'text-white', 'active');
      selectedPart = btn.getAttribute('data-part') || 'auto';
      frameBuffer = []; // Clear smoothing buffer on part mode change
    });
  });

  // Start / Stop Toggle
  btnToggleStream.addEventListener('click', async () => {
    if (isScanning) {
      stopCamera();
    } else {
      await startCamera();
    }
  });

  // Flip Camera Button
  btnSwitchCam.addEventListener('click', async () => {
    if (!isScanning) return;
    currentFacingMode = (currentFacingMode === 'environment') ? 'user' : 'environment';
    stopCameraStreamOnly();
    await startCamera();
  });

  // Capture & Save Snapshot
  btnCaptureSave.addEventListener('click', () => {
    if (!isScanning || !liveVideo.videoWidth) return;
    captureAndSaveSnapshot();
  });

  async function startCamera() {
    permErrorBox.classList.add('hidden');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera API is not supported in this browser environment. Please use HTTPS or an updated browser.");
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: currentFacingMode },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback without ideal constraint if strict facingMode failed
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      liveVideo.srcObject = stream;
      liveVideo.classList.remove('hidden');
      videoPlaceholder.classList.add('hidden');
      scannerOverlay.classList.remove('hidden');

      await liveVideo.play();

      isScanning = true;
      btnToggleText.textContent = "Stop Live Scan";
      btnToggleIcon.className = "fa-solid fa-stop";
      btnToggleStream.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
      btnToggleStream.classList.add('bg-red-600', 'hover:bg-red-700');

      btnSwitchCam.disabled = false;
      btnCaptureSave.disabled = false;

      // Start 1 frame/sec inference loop
      frameBuffer = [];
      scanInterval = setInterval(processVideoFrame, 1000);

    } catch (err) {
      console.error("Camera access failed:", err);
      permErrorBox.classList.remove('hidden');
      stopCamera();
    }
  }

  function stopCameraStreamOnly() {
    if (scanInterval) {
      clearInterval(scanInterval);
      scanInterval = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
  }

  function stopCamera() {
    stopCameraStreamOnly();
    isScanning = false;
    isProcessingFrame = false;

    liveVideo.classList.add('hidden');
    videoPlaceholder.classList.remove('hidden');
    scannerOverlay.classList.add('hidden');
    liveBadgeHUD.classList.add('hidden');
    noPartNotice.classList.add('hidden');

    btnToggleText.textContent = "Start Live Scan";
    btnToggleIcon.className = "fa-solid fa-play";
    btnToggleStream.classList.remove('bg-red-600', 'hover:bg-red-700');
    btnToggleStream.classList.add('bg-emerald-600', 'hover:bg-emerald-700');

    btnSwitchCam.disabled = true;
    btnCaptureSave.disabled = true;
  }

  async function processVideoFrame() {
    // Skip this tick if previous HTTP request is still in flight
    if (isProcessingFrame || !isScanning) return;
    if (!liveVideo.videoWidth || !liveVideo.videoHeight) return;

    isProcessingFrame = true;

    try {
      const ctx = captureCanvas.getContext('2d');
      // Draw scaled video frame onto 224x224 canvas
      ctx.drawImage(liveVideo, 0, 0, 224, 224);

      // Low-weight Base64 JPEG (~15KB)
      const base64Data = captureCanvas.toDataURL('image/jpeg', 0.82);

      const response = await fetch('/predict_frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data,
          part: selectedPart
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const res = await response.json();
      applySmoothedResult(res);

    } catch (e) {
      console.warn("Live frame skipped or errored:", e);
    } finally {
      isProcessingFrame = false;
    }
  }

  /**
   * Applies 5-frame majority voting smoothing to prevent rapid UI badge flickering
   */
  function applySmoothedResult(currentResult) {
    if (!isScanning) return;

    frameBuffer.push(currentResult);
    if (frameBuffer.length > SMOOTH_WINDOW_SIZE) {
      frameBuffer.shift();
    }

    // Check for invalid non-arecanut image or low confidence
    const isInvalid = !currentResult.valid || currentResult.part === 'not_arecanut' || currentResult.part === 'invalid' || currentResult.confidence < 60;
    
    // Count occurrences in buffer
    const invalidCount = frameBuffer.filter(f => !f.valid || f.part === 'not_arecanut' || f.part === 'invalid' || f.confidence < 60).length;

    if (invalidCount >= 3 || isInvalid) {
      // Show Alert banner
      noPartNotice.classList.remove('hidden');
      if (currentResult.message) {
        noPartNoticeText.textContent = currentResult.message;
      }
      liveBadgeHUD.classList.add('hidden');
      return;
    }

    // Otherwise, calculate majority vote on disease and part
    noPartNotice.classList.add('hidden');
    liveBadgeHUD.classList.remove('hidden');

    const diseaseVotes = {};
    const partVotes = {};
    let totalConf = 0;
    let validFrames = 0;

    frameBuffer.forEach(f => {
      if (f.valid && f.part !== 'not_arecanut') {
        diseaseVotes[f.disease] = (diseaseVotes[f.disease] || 0) + 1;
        partVotes[f.part] = (partVotes[f.part] || 0) + 1;
        totalConf += f.confidence;
        validFrames++;
      }
    });

    const smoothedDisease = Object.keys(diseaseVotes).reduce((a, b) => diseaseVotes[a] > diseaseVotes[b] ? a : b, currentResult.disease);
    const smoothedPart = Object.keys(partVotes).reduce((a, b) => partVotes[a] > partVotes[b] ? a : b, currentResult.part);
    const smoothedConf = validFrames > 0 ? (totalConf / validFrames).toFixed(1) : currentResult.confidence.toFixed(1);

    // Update HUD text
    badgePart.textContent = (smoothedPart || 'LEAF').toUpperCase();
    badgeDisease.textContent = smoothedDisease || 'Analyzing...';
    badgeConfidence.textContent = `${smoothedConf}%`;

    const sev = currentResult.severity || 'Moderate';
    badgeSeverity.textContent = sev.toUpperCase();

    // Color badges: green = healthy, orange = mild/moderate, red = severe
    const badgeColor = currentResult.badge_color || 'green';
    if (badgeColor === 'green') {
      badgeIndicator.className = "w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0";
      badgeSeverity.className = "px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase bg-emerald-600/40 text-emerald-300 border border-emerald-500/30";
      badgePart.className = "text-xs font-bold uppercase tracking-wider text-emerald-400";
    } else if (badgeColor === 'orange') {
      badgeIndicator.className = "w-3.5 h-3.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0";
      badgeSeverity.className = "px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase bg-amber-600/40 text-amber-300 border border-amber-500/30";
      badgePart.className = "text-xs font-bold uppercase tracking-wider text-amber-400";
    } else {
      badgeIndicator.className = "w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse flex-shrink-0";
      badgeSeverity.className = "px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase bg-red-600/40 text-red-300 border border-red-500/30";
      badgePart.className = "text-xs font-bold uppercase tracking-wider text-red-400";
    }
  }

  /**
   * Captures high quality snapshot, posts to /predict, and gives PDF report download option
   */
  async function captureAndSaveSnapshot() {
    const saveCanvas = document.createElement('canvas');
    saveCanvas.width = liveVideo.videoWidth || 640;
    saveCanvas.height = liveVideo.videoHeight || 480;
    const sCtx = saveCanvas.getContext('2d');
    sCtx.drawImage(liveVideo, 0, 0, saveCanvas.width, saveCanvas.height);

    btnCaptureSave.disabled = true;
    btnCaptureSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    saveCanvas.toBlob(async (blob) => {
      try {
        const formData = new FormData();
        formData.append('image', blob, `areca_live_snap_${Date.now()}.jpg`);
        formData.append('part', selectedPart);

        const res = await fetch('/predict', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (data.success) {
          const predId = data.prediction_id;
          const userConfirm = confirm(`Diagnostic snapshot saved!\n\nDiagnosis: ${data.disease} (${data.confidence}%)\n\nWould you like to download the official PDF Medical Report now?`);
          if (userConfirm && predId) {
            window.open(`/report/${predId}`, '_blank');
          }
        } else {
          alert(`Could not save snapshot: ${data.error || 'Unknown error'}`);
        }
      } catch (err) {
        alert(`Snapshot save error: ${err.message}`);
      } finally {
        btnCaptureSave.disabled = false;
        btnCaptureSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Capture & Save';
      }
    }, 'image/jpeg', 0.92);
  }

  // Cleanup on leave
  window.addEventListener('beforeunload', () => {
    stopCameraStreamOnly();
  });
});
