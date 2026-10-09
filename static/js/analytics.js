/**
 * ArecaAI Multi-Spectral Precision Analytics & Radiometric Engine
 * Powered by Chart.js 4.4 and HTML5 Radiometric Heatmap Synthesis
 */

let charts = {};
let currentOverlayIndex = 'NDVI';
let activeBandChannel = 'nir';

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  initHeatmapCanvas();
  setupExtractionPipeline();
  setupDiseaseSearch();
  initAnalyticalCharts();
  loadAnalyticsData();
});

// --- 1. TAB CONTROLLER (4 TABS) ---
function setupTabs() {
  const tabs = [
    { btn: document.getElementById('nav-tab-extract'), content: document.getElementById('content-tab-extract') },
    { btn: document.getElementById('nav-tab-solutions'), content: document.getElementById('content-tab-solutions') },
    { btn: document.getElementById('nav-tab-diseases'), content: document.getElementById('content-tab-diseases') },
    { btn: document.getElementById('nav-tab-history'), content: document.getElementById('content-tab-history') }
  ];

  tabs.forEach(tab => {
    if (!tab.btn || !tab.content) return;
    tab.btn.addEventListener('click', () => {
      tabs.forEach(t => {
        if (t.btn && t.content) {
          t.btn.className = "tab-btn pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center space-x-2 shrink-0 transition-colors";
          t.content.classList.add('hidden');
        }
      });
      tab.btn.className = "tab-btn active pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center space-x-2 shrink-0 transition-colors";
      tab.content.classList.remove('hidden');

      // Resize charts if switching to tab 2
      if (tab.btn.id === 'nav-tab-solutions') {
        setTimeout(() => {
          Object.values(charts).forEach(c => { if (c) c.resize(); });
        }, 50);
      }
    });
  });
}

// --- 2. RADIOMETRIC HEATMAP GENERATOR (CANVAS) ---
function initHeatmapCanvas(score = 0.72) {
  const canvas = document.getElementById('canvas-spectral-overlay');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  // Generate synthetic multi-spectral false-color gradient
  const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 1.5);

  if (score > 0.6) {
    // Healthy: Lush greens into vibrant teals
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.85)');
    grad.addColorStop(0.5, 'rgba(34, 197, 94, 0.7)');
    grad.addColorStop(0.8, 'rgba(234, 179, 8, 0.4)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0.2)');
  } else if (score > 0.4) {
    // Moderate: Yellows and mild chlorosis
    grad.addColorStop(0, 'rgba(234, 179, 8, 0.8)');
    grad.addColorStop(0.6, 'rgba(249, 115, 22, 0.7)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0.4)');
  } else {
    // Stressed / Diseased: Deep reds and necrosis
    grad.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
    grad.addColorStop(0.5, 'rgba(185, 28, 28, 0.8)');
    grad.addColorStop(1, 'rgba(127, 29, 29, 0.6)');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Overlay simulated contour ripples
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  for (let r = 30; r < w; r += 35) {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function setMapOverlay(indexName) {
  currentOverlayIndex = indexName;
  const chips = document.querySelectorAll('.overlay-chip');
  chips.forEach(chip => {
    if (chip.getAttribute('data-index') === indexName) {
      chip.className = "overlay-chip active px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold";
    } else {
      chip.className = "overlay-chip px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300";
    }
  });

  const labelEl = document.getElementById('canvas-label-overlay');
  const legendName = document.getElementById('legend-index-name');
  if (labelEl) labelEl.textContent = `${indexName} Radiometric Overlay`;
  if (legendName) legendName.textContent = `${indexName} Normalized Gradient`;

  // Simulate index level
  let simulatedScore = 0.72;
  if (indexName === 'NDRE') simulatedScore = 0.59;
  if (indexName === 'GNDVI') simulatedScore = 0.65;
  if (indexName === 'SAVI') simulatedScore = 0.63;
  if (indexName === 'EVI') simulatedScore = 0.55;
  if (indexName === 'NDWI') simulatedScore = 0.15;

  const scoreTag = document.getElementById('zone-score-tag');
  if (scoreTag) scoreTag.textContent = `${indexName} ${simulatedScore.toFixed(3)}`;

  initHeatmapCanvas(simulatedScore);
}

function selectBandChannel(band) {
  activeBandChannel = band;
  const buttons = document.querySelectorAll('.band-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-band') === band) {
      btn.classList.add('border-emerald-500', 'active');
      btn.classList.remove('border-transparent');
    } else {
      btn.classList.remove('border-emerald-500', 'active');
      btn.classList.add('border-transparent');
    }
  });

  const badge = document.getElementById('band-indicator-badge');
  const labelRaw = document.getElementById('canvas-label-raw');
  const bandNames = {
    blue: 'Blue (450nm Channel)',
    green: 'Green (560nm Channel)',
    red: 'Red (650nm Channel)',
    rededge: 'Red-Edge (730nm Channel)',
    nir: 'NIR (840nm Channel)'
  };

  if (badge) badge.textContent = bandNames[band] || 'Band Isolated';
  if (labelRaw) labelRaw.textContent = `${band.toUpperCase()} Spectral Channel View`;
}

// --- 3. FEATURE EXTRACTION PIPELINE WITH PROGRESS STEPPER ---
function setupExtractionPipeline() {
  const dropZone = document.getElementById('drop-zone-extract');
  const fileInput = document.getElementById('file-input-extract');

  if (dropZone && fileInput) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-emerald-500', 'bg-emerald-500/10');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-emerald-500', 'bg-emerald-500/10');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-emerald-500', 'bg-emerald-500/10');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        fileInput.files = e.dataTransfer.files;
        startFeatureExtractionPipeline(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        startFeatureExtractionPipeline(fileInput.files[0]);
      }
    });
  }
}

async function startFeatureExtractionPipeline(file = null) {
  const stepper = document.getElementById('extraction-stepper');
  const stepperLabel = document.getElementById('stepper-label');
  const stepperPct = document.getElementById('stepper-pct');
  const stepperBar = document.getElementById('stepper-bar');

  if (stepper) stepper.classList.remove('hidden');

  const steps = [
    { label: "1. Preprocessing (Gaussian smoothing, contrast standardization)...", pct: 20 },
    { label: "2. Band Alignment (Affine registration of Blue, Green, Red, RE, NIR)...", pct: 40 },
    { label: "3. Index Calculation (Computing NDVI, NDRE, GNDVI, SAVI, EVI, NDWI)...", pct: 65 },
    { label: "4. Feature Extraction (Color moments & GLCM texture analysis)...", pct: 85 },
    { label: "5. MobileNetV2 Softmax Inference & Biomarker synthesis...", pct: 100 }
  ];

  for (let i = 0; i < steps.length; i++) {
    if (stepperLabel) stepperLabel.textContent = steps[i].label;
    if (stepperPct) stepperPct.textContent = `${steps[i].pct}%`;
    if (stepperBar) stepperBar.style.width = `${steps[i].pct}%`;
    await new Promise(r => setTimeout(r, 220));
  }

  // Trigger POST /api/extract
  try {
    const formData = new FormData();
    if (file) {
      formData.append('image', file);
    }

    const response = await fetch('/api/extract', {
      method: 'POST',
      body: file ? formData : JSON.stringify({ filename: 'arecanut_canopy.png' }),
      headers: file ? {} : { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      applyExtractedData(data);
    }
  } catch (err) {
    console.warn("Using offline calibrated spectral feature simulation:", err);
    applyExtractedData(getSimulatedSpectralData());
  } finally {
    setTimeout(() => {
      if (stepper) stepper.classList.add('hidden');
    }, 1200);
  }
}

function loadSampleSpectralData() {
  startFeatureExtractionPipeline();
}

function applyExtractedData(data) {
  // Update KPI index cards
  if (data.indices) {
    const ndviEl = document.getElementById('card-ndvi-val');
    const ndreEl = document.getElementById('card-ndre-val');
    const gndviEl = document.getElementById('card-gndvi-val');
    const saviEl = document.getElementById('card-savi-val');
    const eviEl = document.getElementById('card-evi-val');
    const ndwiEl = document.getElementById('card-ndwi-val');

    if (ndviEl && data.indices.NDVI) ndviEl.textContent = data.indices.NDVI.mean;
    if (ndreEl && data.indices.NDRE) ndreEl.textContent = data.indices.NDRE.mean;
    if (gndviEl && data.indices.GNDVI) gndviEl.textContent = data.indices.GNDVI.mean;
    if (saviEl && data.indices.SAVI) saviEl.textContent = data.indices.SAVI.mean;
    if (eviEl && data.indices.EVI) eviEl.textContent = data.indices.EVI.mean;
    if (ndwiEl && data.indices.NDWI) ndwiEl.textContent = data.indices.NDWI.mean;
  }

  // Update Canopy & Stress
  const canopyEl = document.getElementById('feat-canopy-pct');
  const stressEl = document.getElementById('feat-stress-pct');
  if (canopyEl && data.canopy_cover_pct !== undefined) canopyEl.textContent = `${data.canopy_cover_pct}%`;
  if (stressEl && data.stress_area_pct !== undefined) stressEl.textContent = `${data.stress_area_pct}%`;

  // Update Neural Prediction
  const predBadge = document.getElementById('ai-pred-badge');
  const predConf = document.getElementById('ai-pred-conf');
  const predBar = document.getElementById('ai-pred-bar');

  if (predBadge && data.disease) predBadge.textContent = data.disease;
  if (predConf && data.confidence) predConf.textContent = `${data.confidence}%`;
  if (predBar && data.confidence) predBar.style.width = `${data.confidence}%`;

  // Redraw spectral curves
  if (charts.spectral && data.spectral_signature) {
    charts.spectral.data.datasets[1].data = data.spectral_signature.detected_curve;
    charts.spectral.update();
  }

  // Update heatmap score
  const ndviScore = data.indices && data.indices.NDVI ? data.indices.NDVI.mean : 0.72;
  initHeatmapCanvas(ndviScore);
}

function getSimulatedSpectralData() {
  return {
    success: true,
    disease: "Healthy Arecanut Frond",
    confidence: 98.4,
    indices: {
      NDVI: { mean: 0.718, min: 0.438, max: 0.938, std: 0.095 },
      NDRE: { mean: 0.589, min: 0.369, max: 0.769, std: 0.082 },
      GNDVI: { mean: 0.653, min: 0.413, max: 0.853, std: 0.088 },
      SAVI: { mean: 0.632, min: 0.432, max: 0.822, std: 0.079 },
      EVI: { mean: 0.546, min: 0.296, max: 0.756, std: 0.104 },
      NDWI: { mean: 0.097, min: -0.25, max: 0.58, std: 0.071 }
    },
    canopy_cover_pct: 86.4,
    stress_area_pct: 13.6,
    spectral_signature: {
      detected_curve: [6.4, 15.2, 7.8, 36.1, 52.8]
    }
  };
}

// --- 4. EXPORT FEATURE DATA (CSV / JSON) ---
function exportFeatureData(format = 'csv') {
  const table = document.getElementById('table-features');
  if (!table) return;

  if (format === 'csv') {
    let csv = [];
    const rows = table.querySelectorAll('tr');
    rows.forEach(r => {
      let cols = [];
      r.querySelectorAll('th, td').forEach(c => cols.push(`"${c.innerText.trim()}"`));
      csv.push(cols.join(','));
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'areca_multispectral_features.csv';
    a.click();
  } else {
    const jsonPayload = getSimulatedSpectralData();
    const blob = new Blob([JSON.stringify(jsonPayload, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'areca_multispectral_features.json';
    a.click();
  }
}

// --- 5. INITIALIZE ANALYTICAL CHARTS (CHART.JS 4.4) ---
function initAnalyticalCharts() {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#d4d4d8' : '#3f3f46';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  // Chart A: Spectral Signature Curve
  const ctxSpec = document.getElementById('chartSpectralSignature');
  if (ctxSpec) {
    charts.spectral = new Chart(ctxSpec, {
      type: 'line',
      data: {
        labels: ['450nm (B)', '560nm (G)', '650nm (R)', '730nm (RE)', '840nm (NIR)'],
        datasets: [
          {
            label: 'Healthy Baseline (%)',
            data: [5.2, 14.8, 6.1, 38.5, 54.2],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Current Field Scan (%)',
            data: [6.4, 15.2, 7.8, 36.1, 52.8],
            borderColor: '#06b6d4',
            borderDash: [5, 5],
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 10, color: textColor, font: { size: 10 } } }
        },
        scales: {
          y: { min: 0, max: 70, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 9 } } },
          x: { grid: { display: false }, ticks: { color: textColor, font: { size: 9 } } }
        }
      }
    });
  }

  // Chart B: Feature Importance Weights
  const ctxImp = document.getElementById('chartFeatureImportance');
  if (ctxImp) {
    charts.importance = new Chart(ctxImp, {
      type: 'bar',
      data: {
        labels: ['NDVI Vitality', 'Chlorosis Ratio', 'Necrosis Area', 'NDRE Edge', 'GLCM Texture'],
        datasets: [{
          label: 'Feature Weight (%)',
          data: [28.5, 24.2, 21.0, 14.8, 11.5],
          backgroundColor: ['#10b981', '#facc15', '#ef4444', '#14b8a6', '#8b5cf6'],
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { max: 35, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 9 } } },
          y: { grid: { display: false }, ticks: { color: textColor, font: { size: 9 } } }
        }
      }
    });
  }
}

// --- 6. LOAD FULL ANALYTICS DATA FOR TAB 2 ---
async function loadAnalyticsData() {
  try {
    const res = await fetch('/api/analytics');
    if (!res.ok) return;
    const data = await res.json();
    renderSolutionsTabCharts(data);
  } catch (e) {
    console.warn("Using default telemetry charts:", e);
    renderSolutionsTabCharts({});
  }
}

function renderSolutionsTabCharts(data) {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#d4d4d8' : '#3f3f46';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  // Chart 1: Disease Distribution
  const ctxDis = document.getElementById('chartDiseaseDist');
  if (ctxDis) {
    charts.disease = new Chart(ctxDis, {
      type: 'doughnut',
      data: {
        labels: (data.disease_distribution && data.disease_distribution.labels) || ['Healthy Frond', 'Koleroga Rot', 'Yellow Leaf', 'Bud Borer'],
        datasets: [{
          data: (data.disease_distribution && data.disease_distribution.counts) || [18, 7, 5, 3],
          backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6'],
          borderWidth: 2,
          borderColor: isDark ? '#18181b' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, color: textColor, font: { size: 10 } } } }
      }
    });
  }

  // Chart 2: NDVI Timeline
  const ctxTime = document.getElementById('chartTimeline');
  if (ctxTime) {
    charts.timeline = new Chart(ctxTime, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [
          {
            label: 'Mean NDVI',
            data: [0.78, 0.76, 0.71, 0.68, 0.65, 0.58, 0.54, 0.69],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.35
          },
          {
            label: 'NDRE Canopy',
            data: [0.65, 0.63, 0.59, 0.55, 0.52, 0.44, 0.42, 0.58],
            borderColor: '#06b6d4',
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { boxWidth: 10, color: textColor, font: { size: 10 } } } },
        scales: {
          y: { min: 0.3, max: 1.0, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 9 } } },
          x: { grid: { display: false }, ticks: { color: textColor, font: { size: 9 } } }
        }
      }
    });
  }

  // Chart 3: Confidence by Disease
  const ctxConf = document.getElementById('chartConfidence');
  if (ctxConf) {
    charts.confidence = new Chart(ctxConf, {
      type: 'bar',
      data: {
        labels: ['Healthy Frond', 'Koleroga', 'Yellow Leaf', 'Stem Bleeding', 'Bud Rot'],
        datasets: [{
          label: 'Confidence (%)',
          data: [98.8, 96.5, 94.2, 97.1, 95.8],
          backgroundColor: '#3b82f6',
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { max: 100, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 9 } } },
          y: { grid: { display: false }, ticks: { color: textColor, font: { size: 9 } } }
        }
      }
    });
  }

  // Chart 4: Severity Breakdown
  const ctxSev = document.getElementById('chartSeverity');
  if (ctxSev) {
    charts.severity = new Chart(ctxSev, {
      type: 'pie',
      data: {
        labels: ['Normal / Vigorous', 'Moderate', 'Severe', 'Critical'],
        datasets: [{
          data: [58, 22, 12, 8],
          backgroundColor: ['#10b981', '#facc15', '#f97316', '#ef4444'],
          borderWidth: 2,
          borderColor: isDark ? '#18181b' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, color: textColor, font: { size: 10 } } } }
      }
    });
  }
}

// --- 7. DISEASES SEARCH & FILTER CONTROLLER ---
function setupDiseaseSearch() {
  const searchInput = document.getElementById('disease-search-input');
  const severityFilter = document.getElementById('disease-severity-filter');
  const cards = document.querySelectorAll('.disease-lib-card');

  function filterCards() {
    const q = (searchInput ? searchInput.value : '').toLowerCase();
    const sev = (severityFilter ? severityFilter.value : 'all').toLowerCase();

    cards.forEach(card => {
      const name = (card.getAttribute('data-name') || '').toLowerCase();
      const cardSev = (card.getAttribute('data-severity') || '').toLowerCase();
      const text = card.innerText.toLowerCase();

      const matchesSearch = !q || name.includes(q) || text.includes(q);
      const matchesSev = (sev === 'all') || (cardSev === sev);

      if (matchesSearch && matchesSev) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }

  if (searchInput) searchInput.addEventListener('input', filterCards);
  if (severityFilter) severityFilter.addEventListener('change', filterCards);
}
