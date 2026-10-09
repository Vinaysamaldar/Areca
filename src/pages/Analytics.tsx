import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Layers,
  Upload,
  Cpu,
  BarChart3,
  TrendingUp,
  Download,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  FileCode
} from "lucide-react";

type ActiveTab = "extraction" | "analytics" | "diseases" | "history";
type BandKey = "blue" | "green" | "red" | "redEdge" | "nir";
type IndexKey = "ndvi" | "ndre" | "gndvi" | "savi" | "evi" | "ndwi";

interface IndexMetric {
  name: string;
  formula: string;
  descEn: string;
  descKn: string;
  mean: number;
  min: number;
  max: number;
  std: number;
}

export const Analytics: React.FC = () => {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>("extraction");
  const [selectedBand, setSelectedBand] = useState<BandKey>("nir");
  const [selectedIndex, setSelectedIndex] = useState<IndexKey>("ndvi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const indicesMetrics: Record<IndexKey, IndexMetric> = {
    ndvi: {
      name: "NDVI (Normalized Difference Vegetation Index)",
      formula: "(NIR - Red) / (NIR + Red)",
      descEn: "Standard benchmark for foliar chlorophyll vitality and canopy vigor.",
      descKn: "ಎಲೆಗಳ ಕ್ಲೋರೋಫಿಲ್ ಮತ್ತು ಹಸಿರು ಸಾಂದ್ರತೆಯನ್ನು ಅಳೆಯುವ ಪ್ರಮುಖ ಸೂಚ್ಯಂಕ.",
      mean: 0.684,
      min: 0.125,
      max: 0.892,
      std: 0.142
    },
    ndre: {
      name: "NDRE (Normalized Difference Red Edge)",
      formula: "(NIR - RedEdge) / (NIR + RedEdge)",
      descEn: "Penetrates dense multi-tier canopy to detect mid-stage stress.",
      descKn: "ದಟ್ಟವಾದ ಅಡಿಕೆ ಮರದ ಸುಳಿಯ ಒಳಭಾಗದ ರೋಗ ಲಕ್ಷಣಗಳನ್ನು ಪತ್ತೆ ಮಾಡುತ್ತದೆ.",
      mean: 0.542,
      min: 0.082,
      max: 0.765,
      std: 0.128
    },
    gndvi: {
      name: "GNDVI (Green Normalized Difference Vegetation Index)",
      formula: "(NIR - Green) / (NIR + Green)",
      descEn: "High sensitivity to nitrogen assimilation and deep vascular water content.",
      descKn: "ಸಾರಜನಕ ಕೊರತೆ ಮತ್ತು ನೀರಿನ ಅಂಶದ ವ್ಯತ್ಯಾಸವನ್ನು ನಿಖರವಾಗಿ ಅಳೆಯುತ್ತದೆ.",
      mean: 0.612,
      min: 0.145,
      max: 0.810,
      std: 0.115
    },
    savi: {
      name: "SAVI (Soil-Adjusted Vegetation Index)",
      formula: "1.5 * (NIR - Red) / (NIR + Red + 0.5)",
      descEn: "Calibrates canopy readings by cancelling plantation soil background reflection.",
      descKn: "ತೋಟದ ಮಣ್ಣಿನ ಪ್ರತಿಫಲನವನ್ನು ಕಡಿಮೆ ಮಾಡಿ ಕೇವಲ ಎಲೆಯ ಆರೋಗ್ಯವನ್ನು ಅಳೆಯುತ್ತದೆ.",
      mean: 0.588,
      min: 0.110,
      max: 0.774,
      std: 0.121
    },
    evi: {
      name: "EVI (Enhanced Vegetation Index)",
      formula: "2.5 * (NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1)",
      descEn: "Corrects for atmospheric aerosols and canopy saturation in high biomass groves.",
      descKn: "ದಟ್ಟ ಕಾಂಡ ಹಾಗೂ ದಟ್ಟ ಅಡಿಕೆ ಮರಗಳಲ್ಲಿ ನಿಖರವಾದ ಹಸಿರು ಪ್ರಮಾಣವನ್ನು ನೀಡುತ್ತದೆ.",
      mean: 0.635,
      min: 0.095,
      max: 0.840,
      std: 0.136
    },
    ndwi: {
      name: "NDWI (Normalized Difference Water Index)",
      formula: "(Green - NIR) / (Green + NIR)",
      descEn: "Quantifies plant moisture stress and canopy drought/waterlogging.",
      descKn: "ಅಡಿಕೆ ಎಲೆಗಳ ತೇವಾಂಶ ಮತ್ತು ನೀರಿನ ಕೊರತೆ ಅಥವಾ ಜೌಗು ಸ್ಥಿತಿಯನ್ನು ಅಳೆಯುತ್ತದೆ.",
      mean: -0.215,
      min: -0.680,
      max: 0.140,
      std: 0.155
    }
  };

  const stepsList = [
    t("1. Preprocessing & radiometric calibration", "1. ಚಿತ್ರದ ಸಿದ್ಧತೆ ಮತ್ತು ರೇಡಿಯೋಮೆಟ್ರಿಕ್ ಹೊಂದಾಣಿಕೆ"),
    t("2. Sub-pixel 5-band image co-registration", "2. 5 ಬ್ಯಾಂಡ್‌ಗಳ ಚಿತ್ರ ಜೋಡಣೆ"),
    t("3. Radiometric index calculation (NDVI, NDRE)", "3. ರೇಡಿಯೋಮೆಟ್ರಿಕ್ ಸೂಚ್ಯಂಕಗಳ ಲೆಕ್ಕಾಚಾರ"),
    t("4. GLCM texture & color moment extraction", "4. ರಚನೆ ಮತ್ತು ಬಣ್ಣದ ಲಕ್ಷಣಗಳ ಬೇರ್ಪಡಿಕೆ"),
    t("5. MobileNetV2 Softmax disease diagnosis", "5. ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ರೋಗ ವರ್ಗೀಕರಣ")
  ];

  const runExtraction = () => {
    setIsProcessing(true);
    setProgressStep(0);
    const interval = setInterval(() => {
      setProgressStep((prev) => {
        if (prev >= 4) {
          clearInterval(interval);
          setIsProcessing(false);
          renderHeatmap(selectedIndex);
          return 4;
        }
        return prev + 1;
      });
    }, 400);
  };

  // Draw Heatmap on Canvas
  const renderHeatmap = (idxKey: IndexKey) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Create high-tech synthetic radiometric heatmap
    const imgData = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - w / 2;
        const dy = y - h / 2;
        const dist = Math.sqrt(dx * dx + dy * dy) / (w / 2);
        const noise = Math.sin(x * 0.08) * Math.cos(y * 0.08) * 0.2;
        let val = 1.0 - Math.min(1.0, dist + noise);

        if (idxKey === "ndwi") val = 1.0 - val;

        const i = (y * w + x) * 4;
        // Turbo Colormap synthesis
        if (val > 0.65) {
          // Healthy Green
          imgData.data[i] = 16;
          imgData.data[i + 1] = Math.floor(185 * val);
          imgData.data[i + 2] = 129;
          imgData.data[i + 3] = 230;
        } else if (val > 0.35) {
          // Moderate Yellow/Orange
          imgData.data[i] = Math.floor(245 * (1 - val));
          imgData.data[i + 1] = Math.floor(190 * val);
          imgData.data[i + 2] = 40;
          imgData.data[i + 3] = 230;
        } else {
          // Stressed Red
          imgData.data[i] = 239;
          imgData.data[i + 1] = Math.floor(68 * val);
          imgData.data[i + 2] = 68;
          imgData.data[i + 3] = 240;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

  useEffect(() => {
    renderHeatmap(selectedIndex);
  }, [selectedIndex]);

  // Export CSV Handler
  const exportFeaturesCsv = () => {
    const csvRows = [
      ["Metric", "Formula", "Mean", "Min", "Max", "StdDev"],
      ...Object.values(indicesMetrics).map((m) => [m.name, m.formula, m.mean, m.min, m.max, m.std]),
      ["Canopy Cover %", "Foliar ROI Coverage", 82.4, 0, 100, 4.2],
      ["Stress Area %", "Lesion Necrosis Index", 18.5, 0, 100, 3.8],
      ["GLCM Contrast", "Sobel 2D Roughness", 24.8, 4.2, 48.0, 5.6]
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ArecaAI_MultiSpectral_Features.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-500/30">
          <Layers className="w-3.5 h-3.5" />
          <span>{t("Multi-Spectral Analysis • Precision Agriculture", "ಬಹು-ಸ್ಪೆಕ್ಟ್ರಲ್ ವಿಶ್ಲೇಷಣೆ • ನಿಖರ ಕೃಷಿ")}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {t("Multi-Spectral", "ಬಹು-ಸ್ಪೆಕ್ಟ್ರಲ್")}{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            {t("Feature Extraction", "ಲಕ್ಷಣಗಳ ವಿಶ್ಲೇಷಣೆ")}
          </span>
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          {t(
            "Extract remote sensing radiometric indices (NDVI, NDRE, GNDVI, SAVI, EVI, NDWI), GLCM surface textures, and spectral curves to diagnose areca pathology.",
            "ಡ್ರೋನ್ ಮತ್ತು ಕ್ಯಾಮೆರಾ ಚಿತ್ರಗಳಿಂದ ಎನ್‌ಡಿವಿಐ, ಎನ್‌ಡಿಆರ್‌ಇ, ಎಸ್‌ಎವಿಐ, ಇವಿಐ ಸೂಚ್ಯಂಕಗಳು ಹಾಗೂ ರೋಗ ಲಕ್ಷಣಗಳ ಗಣಿತೀಯ ವಿಶ್ಲೇಷಣೆ."
          )}
        </p>
      </div>

      {/* 4 Tabs Navigation Dock */}
      <div className="flex border-b border-zinc-800 space-x-2 sm:space-x-4 overflow-x-auto">
        {[
          { key: "extraction", labelEn: "Feature Extraction", labelKn: "ಲಕ್ಷಣಗಳ ವಿಶ್ಲೇಷಣೆ", icon: Cpu },
          { key: "analytics", labelEn: "Solutions & Analytics", labelKn: "ಪರಿಹಾರ & ಸಂಖ್ಯಾಶಾಸ್ತ್ರ", icon: BarChart3 },
          { key: "diseases", labelEn: "Diseases Library", labelKn: "ರೋಗಗಳ ಕೋಶ", icon: Layers },
          { key: "history", labelEn: "History & Comparison", labelKn: "ಇತಿಹಾಸ & ಹೋಲಿಕೆ", icon: TrendingUp }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as ActiveTab)}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                isActive
                  ? "border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-xl"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{lang === "kn" ? tab.labelKn : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: FEATURE EXTRACTION */}
      {activeTab === "extraction" && (
        <div className="space-y-10">
          
          {/* Upload & Band Selector Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Upload Card & Band Selector (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-zinc-900/80 rounded-3xl p-6 sm:p-8 border border-zinc-800 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>{t("Multi-Spectral Imagery Ingestion", "ಚಿತ್ರಗಳ ಅಪ್‌ಲೋಡ್")}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={runExtraction}
                    className="text-xs text-emerald-400 hover:underline font-bold"
                  >
                    {t("Use Sample Drone Data", "ಮಾದರಿ ಡೇಟಾ ಬಳಸಿ")}
                  </button>
                </div>

                {/* Dropzone Container */}
                <div className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer bg-zinc-950/50 space-y-3 transition-colors">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-zinc-200">
                      {t("Drag & drop 5-band TIFF/JPG or RGB photo", "5-ಬ್ಯಾಂಡ್ ಚಿತ್ರಗಳು ಅಥವಾ ಎಲೆ ಚಿತ್ರವನ್ನು ಹಾಕಿ")}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {t("Bands: Blue (450nm), Green (560nm), Red (650nm), Red Edge (730nm), NIR (840nm)", "ಬ್ಯಾಂಡ್‌ಗಳು: ಬ್ಲೂ, ಗ್ರೀನ್, ರೆಡ್, ರೆಡ್ ಎಡ್ಜ್, ಎನ್‌ಐಆರ್")}
                    </p>
                  </div>
                </div>

                {/* Band Selector Buttons */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 block">
                    {t("Select Spectral Band Channel:", "ಸ್ಪೆಕ್ಟ್ರಲ್ ಬ್ಯಾಂಡ್ ಆಯ್ಕೆ:")}
                  </label>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    {[
                      { key: "blue", label: "Blue 450nm" },
                      { key: "green", label: "Green 560nm" },
                      { key: "red", label: "Red 650nm" },
                      { key: "redEdge", label: "RE 730nm" },
                      { key: "nir", label: "NIR 840nm" }
                    ].map((b) => (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => setSelectedBand(b.key as BandKey)}
                        className={`p-2 rounded-xl font-bold transition-all ${
                          selectedBand === b.key
                            ? "bg-emerald-600 text-white shadow"
                            : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extraction Stepper & Trigger */}
                <button
                  type="button"
                  onClick={runExtraction}
                  disabled={isProcessing}
                  className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold py-3.5 px-4 rounded-xl shadow transition-all active:scale-95 disabled:opacity-50"
                >
                  <Cpu className="w-5 h-5" />
                  <span>{isProcessing ? t("Processing Radiometry...", "ವಿಶ್ಲೇಷಣೆ ಪ್ರಗತಿಯಲ್ಲಿದೆ...") : t("Extract Features & Classify", "ಲಕ್ಷಣಗಳನ್ನು ಹೊರತೆಗೆಯಿರಿ")}</span>
                </button>

                {/* Stepper Progress */}
                {isProcessing && (
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-emerald-400">
                      <span>{stepsList[progressStep]}</span>
                      <span>{Math.round(((progressStep + 1) / 5) * 100)}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${((progressStep + 1) / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Right: Heatmap Overlay & Radiometric Indices (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-zinc-900/80 rounded-3xl p-6 sm:p-8 border border-zinc-800 space-y-6">
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {t("Radiometric Vegetation Heatmap", "ರೇಡಿಯೋಮೆಟ್ರಿಕ್ ಹೀಟ್‌ಮ್ಯಾಪ್")}
                    </h3>
                    <p className="text-xs text-zinc-400">{indicesMetrics[selectedIndex].name}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Turbo Colormap
                  </span>
                </div>

                {/* Heatmap Canvas Container */}
                <div className="relative aspect-square max-h-72 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-inner bg-zinc-950 flex items-center justify-center">
                  <canvas ref={canvasRef} width={280} height={280} className="w-full h-full object-cover" />
                  
                  {/* Overlay legend */}
                  <div className="absolute bottom-3 left-3 right-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 flex items-center justify-between text-[10px]">
                    <span className="text-rose-400 font-bold">Stressed (Low)</span>
                    <div className="w-24 h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500 mx-2"></div>
                    <span className="text-emerald-400 font-bold">Healthy (High)</span>
                  </div>
                </div>

                {/* Index Selector Pills */}
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(indicesMetrics) as IndexKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSelectedIndex(k)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                        selectedIndex === k
                          ? "bg-emerald-600 text-white shadow"
                          : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>

                {/* Metric Statistics Summary */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">{t("Mean", "ಸರಾಸರಿ")}</span>
                    <span className="font-extrabold text-emerald-400 text-sm">+{indicesMetrics[selectedIndex].mean}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">{t("Min", "ಕನಿಷ್ಠ")}</span>
                    <span className="font-extrabold text-rose-400 text-sm">{indicesMetrics[selectedIndex].min}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">{t("Max", "ಗರಿಷ್ಠ")}</span>
                    <span className="font-extrabold text-teal-400 text-sm">{indicesMetrics[selectedIndex].max}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">{t("StdDev", "ವ್ಯತ್ಯಾಸ")}</span>
                    <span className="font-extrabold text-amber-400 text-sm">±{indicesMetrics[selectedIndex].std}</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Feature Table & Spectral Signature Curve */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Feature Table (7 cols) */}
            <div className="lg:col-span-7 bg-zinc-900/80 rounded-3xl p-6 sm:p-8 border border-zinc-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {t("Extracted Radiometric & GLCM Features", "ಹೊರತೆಗೆಯಲಾದ ರೇಡಿಯೋಮೆಟ್ರಿಕ್ ಮತ್ತು ರಚನೆ ಲಕ್ಷಣಗಳು")}
                  </h3>
                  <p className="text-xs text-zinc-400">{t("Quantified texture variance, color moments and vegetation indices", "ಎಲೆ ರೋಗ ಲಕ್ಷಣಗಳ ಗಣಿತೀಯ ಮೌಲ್ಯಗಳು")}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={exportFeaturesCsv}
                    className="inline-flex items-center space-x-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold px-3 py-1.5 rounded-xl text-zinc-200 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-zinc-800 rounded-xl">
                  <thead className="bg-zinc-950 text-zinc-400">
                    <tr>
                      <th className="p-2.5">Feature Metric</th>
                      <th className="p-2.5">Formula / Band</th>
                      <th className="p-2.5">Mean Value</th>
                      <th className="p-2.5">Range [Min - Max]</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    {Object.entries(indicesMetrics).map(([k, m]) => (
                      <tr key={k} className="hover:bg-zinc-800/40">
                        <td className="p-2.5 font-bold text-white uppercase">{k}</td>
                        <td className="p-2.5 font-mono text-[11px] text-zinc-400">{m.formula}</td>
                        <td className="p-2.5 font-extrabold text-emerald-400">+{m.mean}</td>
                        <td className="p-2.5 text-zinc-400">[{m.min} .. {m.max}]</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                            Normal
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-zinc-950/60 font-semibold">
                      <td className="p-2.5 text-white">Canopy Cover %</td>
                      <td className="p-2.5 font-mono text-zinc-400">Foliar ROI Mask</td>
                      <td className="p-2.5 text-emerald-400 font-bold">82.4%</td>
                      <td className="p-2.5 text-zinc-400">[74% .. 91%]</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300">Healthy</span></td>
                    </tr>
                    <tr className="bg-zinc-950/60 font-semibold">
                      <td className="p-2.5 text-white">Stress Area %</td>
                      <td className="p-2.5 font-mono text-zinc-400">Necrosis Index</td>
                      <td className="p-2.5 text-rose-400 font-bold">18.5%</td>
                      <td className="p-2.5 text-zinc-400">[12% .. 24%]</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">Mild Lesion</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Spectral Signature Curve (5 cols) */}
            <div className="lg:col-span-5 bg-zinc-900/80 rounded-3xl p-6 sm:p-8 border border-zinc-800 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">
                  {t("Spectral Signature Curve", "ಸ್ಪೆಕ್ಟ್ರಲ್ ಸಿಗ್ನೇಚರ್ ವಕ್ರರೇಖೆ")}
                </h3>
                <p className="text-xs text-zinc-400">
                  {t("Reflectance % across wavelengths (Healthy vs Koleroga)", "ತರಂಗಾಂತರಗಳ ಪ್ರತಿಫಲನ (ಆರೋಗ್ಯಕರ vs ಕೊಳೆರೋಗ)")}
                </p>
              </div>

              {/* Graphic Spectral Curve Simulation */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span>Healthy Palm</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span>Koleroga Infected</span>
                  </span>
                </div>

                <div className="h-44 w-full flex items-end justify-between gap-3 pt-6 border-b border-l border-zinc-800 px-2 pb-2">
                  {[
                    { label: "Blue 450", hVal: 15, dVal: 22 },
                    { label: "Green 560", hVal: 32, dVal: 24 },
                    { label: "Red 650", hVal: 18, dVal: 38 },
                    { label: "RE 730", hVal: 72, dVal: 48 },
                    { label: "NIR 840", hVal: 92, dVal: 54 }
                  ].map((band, bIdx) => (
                    <div key={bIdx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1.5 h-full">
                        <div
                          className="w-3 bg-emerald-500 rounded-t"
                          style={{ height: `${band.hVal}%` }}
                          title={`Healthy: ${band.hVal}%`}
                        ></div>
                        <div
                          className="w-3 bg-rose-500 rounded-t"
                          style={{ height: `${band.dVal}%` }}
                          title={`Infected: ${band.dVal}%`}
                        ></div>
                      </div>
                      <span className="text-[9px] text-zinc-400 font-medium whitespace-nowrap">{band.label}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-zinc-400 italic">
                  Notice the sharp depression in NIR reflectance (840nm) and rise in Red (650nm) characteristic of foliar tissue necrosis.
                </p>
              </div>

              {/* MobileNetV2 Softmax Bridge */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-zinc-200">MobileNetV2 Softmax Diagnosis</span>
                  <span className="text-emerald-400">96.8% Confidence</span>
                </div>
                <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[96.8%]"></div>
                </div>
                <span className="text-[11px] text-zinc-400 block">
                  Top Feature Contribution: NDVI Vitality (28.5%), Carotenoid Chlorosis (24.2%)
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: SOLUTIONS & ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t("Total Scans This Month", "ತಿಂಗಳ ಒಟ್ಟು ಸ್ಕ್ಯಾನ್‌ಗಳು")}</span>
              <div className="text-3xl font-extrabold text-white">48</div>
              <span className="text-xs text-emerald-400 font-semibold">+18% vs last month</span>
            </div>
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t("Healthy Canopy Ratio", "ಆರೋಗ್ಯಕರ ಮರಗಳ ಪ್ರಮಾಣ")}</span>
              <div className="text-3xl font-extrabold text-emerald-400">76.4%</div>
              <span className="text-xs text-zinc-400 font-medium">37/48 plots thriving</span>
            </div>
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t("Top Flagged Pathology", "ಹೆಚ್ಚು ಕಂಡುಬಂದ ರೋಗ")}</span>
              <div className="text-2xl font-extrabold text-amber-400">Koleroga</div>
              <span className="text-xs text-zinc-400 font-medium">6 alerts during heavy rain</span>
            </div>
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t("Mean AI Confidence", "ಸರಾಸರಿ ನಿಖರತೆ")}</span>
              <div className="text-3xl font-extrabold text-teal-400">97.2%</div>
              <span className="text-xs text-emerald-400 font-semibold">Trained on 9,000+ images</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISEASES */}
      {activeTab === "diseases" && (
        <div className="bg-zinc-900/80 rounded-3xl p-8 border border-zinc-800 text-center space-y-4">
          <Layers className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">{t("Integrated Disease Spectral Catalog", "ರೋಗಗಳ ಸ್ಪೆಕ್ಟ್ರಲ್ ಮಾಹಿತಿ")}</h3>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto">
            {t(
              "View the comprehensive disease cards with spectral properties in our Disease Library section.",
              "ಎಲ್ಲಾ ರೋಗಗಳ ಲಕ್ಷಣಗಳು ಮತ್ತು ಔಷಧಿಗಳನ್ನು ರೋಗಗಳ ಮಾಹಿತಿ ಪುಟದಲ್ಲಿ ವೀಕ್ಷಿಸಿ."
            )}
          </p>
          <a
            href="/diseases"
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow"
          >
            <span>{t("Open Diseases Library", "ರೋಗಗಳ ಕೋಶ ತೆರೆಯಿರಿ")}</span>
            <span>→</span>
          </a>
        </div>
      )}

      {/* TAB 4: HISTORY */}
      {activeTab === "history" && (
        <div className="bg-zinc-900/80 rounded-3xl p-8 border border-zinc-800 text-center space-y-4">
          <TrendingUp className="w-10 h-10 text-teal-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">{t("Scan History & Temporal Comparison", "ಸ್ಕ್ಯಾನ್ ಇತಿಹಾಸ ಮತ್ತು ಕಾಲೋಚಿತ ಹೋಲಿಕೆ")}</h3>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto">
            {t(
              "Review past diagnoses, track foliar NDVI trends, and run before/after comparisons.",
              "ಹಿಂದಿನ ರೋಗ ಪರೀಕ್ಷೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಕಾಲಾನಂತರದ ಸುಧಾರಣೆಯನ್ನು ಹೋಲಿಕೆ ಮಾಡಿ."
            )}
          </p>
          <a
            href="/history"
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow"
          >
            <span>{t("Open History Archive", "ಇತಿಹಾಸ ಪುಟಕ್ಕೆ ಹೋಗಿ")}</span>
            <span>→</span>
          </a>
        </div>
      )}

    </div>
  );
};
