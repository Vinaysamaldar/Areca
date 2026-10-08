/**
 * ArecaAI Analytics & Telemetry Controller
 * Powered by Chart.js 4.4
 */

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupFilters();
  loadAnalyticsData();
});

let charts = {};

function setupTabs() {
  const tabLive = document.getElementById('tab-btn-live');
  const tabModel = document.getElementById('tab-btn-model');
  const tabDataset = document.getElementById('tab-btn-dataset');

  const contentLive = document.getElementById('tab-content-live');
  const contentModel = document.getElementById('tab-content-model');
  const contentDataset = document.getElementById('tab-content-dataset');

  const allTabs = [tabLive, tabModel, tabDataset];
  const allContents = [contentLive, contentModel, contentDataset];

  function activateTab(activeTab, activeContent) {
    allTabs.forEach(t => {
      t.className = "tab-btn pb-3 px-2 text-sm font-semibold border-b-2 border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200";
    });
    activeTab.className = "tab-btn active pb-3 px-2 text-sm font-bold border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400";

    allContents.forEach(c => c.classList.add('hidden'));
    activeContent.classList.remove('hidden');
  }

  if (tabLive) tabLive.addEventListener('click', () => activateTab(tabLive, contentLive));
  if (tabModel) tabModel.addEventListener('click', () => activateTab(tabModel, contentModel));
  if (tabDataset) tabDataset.addEventListener('click', () => activateTab(tabDataset, contentDataset));
}

function setupFilters() {
  const btnApply = document.getElementById('btn-apply-filter');
  const btnReset = document.getElementById('btn-reset-filter');
  const startDate = document.getElementById('filter-start-date');
  const endDate = document.getElementById('filter-end-date');
  const partSelect = document.getElementById('filter-part');

  if (btnApply) {
    btnApply.addEventListener('click', () => {
      loadAnalyticsData({
        start_date: startDate.value,
        end_date: endDate.value,
        part: partSelect.value
      });
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      startDate.value = '';
      endDate.value = '';
      partSelect.value = 'all';
      loadAnalyticsData();
    });
  }
}

async function loadAnalyticsData(params = {}) {
  try {
    const url = new URL('/api/analytics', window.location.origin);
    Object.keys(params).forEach(k => {
      if (params[k]) url.searchParams.append(k, params[k]);
    });

    const response = await fetch(url);
    if (!response.ok) throw new Error("Could not fetch analytics payload");

    const data = await response.json();
    updateSummaryCards(data);
    renderCharts(data);

  } catch (err) {
    console.warn("Analytics load warning:", err);
  }
}

function updateSummaryCards(data) {
  const totalEl = document.getElementById('stat-total-scans');
  const healthyEl = document.getElementById('stat-healthy-pct');
  const topEl = document.getElementById('stat-top-disease');
  const confEl = document.getElementById('stat-avg-conf');

  if (totalEl) totalEl.textContent = data.total_scans !== undefined ? data.total_scans : 0;
  if (healthyEl) healthyEl.textContent = `${data.healthy_pct || 0.0}%`;
  if (topEl) topEl.textContent = data.most_common_disease || 'None';
  if (confEl) confEl.textContent = `${data.avg_confidence || 0.0}%`;
}

function renderCharts(data) {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#d4d4d8' : '#3f3f46';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  // Destroy existing charts to avoid canvas reuse error
  Object.values(charts).forEach(c => {
    if (c) c.destroy();
  });
  charts = {};

  const palette = ['#16a34a', '#dc2626', '#ea580c', '#2563eb', '#9333ea', '#059669', '#d97706', '#0284c7'];

  // 1. Disease Distribution (Doughnut)
  const ctxDisease = document.getElementById('chartDiseaseDist');
  if (ctxDisease && data.disease_distribution) {
    charts.disease = new Chart(ctxDisease, {
      type: 'doughnut',
      data: {
        labels: data.disease_distribution.labels,
        datasets: [{
          data: data.disease_distribution.counts,
          backgroundColor: palette,
          borderWidth: 2,
          borderColor: isDark ? '#18181b' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, color: textColor, font: { size: 10 } } }
        }
      }
    });
  }

  // 2. Scans by Plant Part (Bar)
  const ctxPart = document.getElementById('chartPartDist');
  if (ctxPart && data.part_distribution) {
    charts.part = new Chart(ctxPart, {
      type: 'bar',
      data: {
        labels: data.part_distribution.labels,
        datasets: [{
          label: 'Scans',
          data: data.part_distribution.counts,
          backgroundColor: ['#22c55e', '#f97316', '#a16207', '#84cc16'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: gridColor }, ticks: { color: textColor, precision: 0 } },
          x: { grid: { display: false }, ticks: { color: textColor } }
        }
      }
    });
  }

  // 3. Scans Over Time (Line)
  const ctxTimeline = document.getElementById('chartTimeline');
  if (ctxTimeline && data.timeline_distribution) {
    charts.timeline = new Chart(ctxTimeline, {
      type: 'line',
      data: {
        labels: data.timeline_distribution.dates,
        datasets: [{
          label: 'Daily Scans',
          data: data.timeline_distribution.counts,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: gridColor }, ticks: { color: textColor, precision: 0 } },
          x: { grid: { display: false }, ticks: { color: textColor, font: { size: 9 } } }
        }
      }
    });
  }

  // 4. Avg Confidence per Disease (Horizontal Bar)
  const ctxConf = document.getElementById('chartConfidence');
  if (ctxConf && data.confidence_by_disease) {
    charts.confidence = new Chart(ctxConf, {
      type: 'bar',
      data: {
        labels: data.confidence_by_disease.labels,
        datasets: [{
          label: 'Confidence (%)',
          data: data.confidence_by_disease.averages,
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
          x: { max: 100, min: 0, grid: { color: gridColor }, ticks: { color: textColor } },
          y: { grid: { display: false }, ticks: { color: textColor, font: { size: 9 } } }
        }
      }
    });
  }

  // 5. Healthy vs Diseased Ratio (Doughnut)
  const ctxHealthy = document.getElementById('chartHealthyRatio');
  if (ctxHealthy && data.healthy_vs_diseased) {
    charts.healthy = new Chart(ctxHealthy, {
      type: 'doughnut',
      data: {
        labels: data.healthy_vs_diseased.labels,
        datasets: [{
          data: data.healthy_vs_diseased.counts,
          backgroundColor: ['#22c55e', '#ef4444'],
          borderWidth: 2,
          borderColor: isDark ? '#18181b' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, color: textColor } }
        }
      }
    });
  }

  // 6. Severity Breakdown (Pie)
  const ctxSev = document.getElementById('chartSeverity');
  if (ctxSev && data.severity_breakdown) {
    charts.severity = new Chart(ctxSev, {
      type: 'pie',
      data: {
        labels: data.severity_breakdown.labels,
        datasets: [{
          data: data.severity_breakdown.counts,
          backgroundColor: ['#22c55e', '#eab308', '#f97316', '#ef4444'],
          borderWidth: 2,
          borderColor: isDark ? '#18181b' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, color: textColor } }
        }
      }
    });
  }
}
