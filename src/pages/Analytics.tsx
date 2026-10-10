import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { scansService, ScanRecord } from "@/services/scansService";
import metricsDataRaw from "@/data/metrics.json";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  Activity,
  FileSpreadsheet,
  Download,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Cpu,
  BarChart3,
  TrendingUp,
  Camera,
  CheckCircle2,
  FileText
} from "lucide-react";

const CHART_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

export const Analytics: React.FC = () => {
  const { lang, t } = useLanguage();

  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [dateRange, setDateRange] = useState<"all" | "30d" | "7d">("all");
  const [timeframeView, setTimeframeView] = useState<"daily" | "weekly" | "monthly">("daily");
  const [activeTab, setActiveTab] = useState<"scans" | "model">("scans");

  useEffect(() => {
    setScans(scansService.getScans());
    const unsub = scansService.subscribe(() => {
      setScans(scansService.getScans());
    });
    return () => unsub();
  }, []);

  // Filter scans by date range
  const filteredScans = useMemo(() => {
    const now = Date.now();
    if (dateRange === "7d") {
      return scans.filter((s) => s.timestamp >= now - 7 * 24 * 60 * 60 * 1000);
    }
    if (dateRange === "30d") {
      return scans.filter((s) => s.timestamp >= now - 30 * 24 * 60 * 60 * 1000);
    }
    return scans;
  }, [scans, dateRange]);

  // Compute KPIs
  const totalScansCount = filteredScans.length;
  const healthyCount = filteredScans.filter((s) => s.disease.toLowerCase().includes("healthy")).length;
  const healthyPct = totalScansCount > 0 ? ((healthyCount / totalScansCount) * 100).toFixed(1) : "0";
  const diseasedPct = totalScansCount > 0 ? (100 - Number(healthyPct)).toFixed(1) : "0";

  // Scans this current calendar month
  const currentMonthScans = useMemo(() => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth();
    return scans.filter((s) => {
      const d = new Date(s.timestamp);
      return d.getFullYear() === currYear && d.getMonth() === currMonth;
    }).length;
  }, [scans]);

  // Disease frequency counts
  const diseaseDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredScans.forEach((s) => {
      const label = lang === "kn" ? (s.disease_kn || s.disease) : s.disease;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredScans, lang]);

  // Most common disease
  const mostCommonDisease = useMemo(() => {
    if (diseaseDistribution.length === 0) return "N/A";
    const nonHealthy = diseaseDistribution.filter((d) => !d.name.toLowerCase().includes("healthy") && !d.name.includes("ಆರೋಗ್ಯಕರ"));
    if (nonHealthy.length > 0) {
      nonHealthy.sort((a, b) => b.value - a.value);
      return nonHealthy[0].name;
    }
    return diseaseDistribution[0].name;
  }, [diseaseDistribution]);

  // Scans over time chart data
  const scansOverTime = useMemo(() => {
    const map: Record<string, number> = {};
    const sorted = [...filteredScans].sort((a, b) => a.timestamp - b.timestamp);

    sorted.forEach((s) => {
      const d = new Date(s.timestamp);
      let key = "";
      if (timeframeView === "monthly") {
        key = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      } else if (timeframeView === "weekly") {
        const weekNum = Math.ceil(d.getDate() / 7);
        key = `${d.toLocaleDateString("en-US", { month: "short" })} W${weekNum}`;
      } else {
        key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [filteredScans, timeframeView]);

  // Average confidence per disease
  const avgConfidencePerDisease = useMemo(() => {
    const sumMap: Record<string, { sum: number; count: number }> = {};
    filteredScans.forEach((s) => {
      const name = lang === "kn" ? (s.disease_kn || s.disease) : s.disease;
      if (!sumMap[name]) sumMap[name] = { sum: 0, count: 0 };
      sumMap[name].sum += s.confidence;
      sumMap[name].count += 1;
    });

    return Object.entries(sumMap).map(([name, stat]) => ({
      name,
      avgConfidence: Number((stat.sum / stat.count).toFixed(1))
    }));
  }, [filteredScans, lang]);

  // Export CSV handler
  const handleExportCSV = () => {
    const csvContent = scansService.exportCSV();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ArecaAI_Scan_Analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Safe Model Metrics parsing (fallbacks to "Not available" if missing)
  const metrics = metricsDataRaw as any;
  const hasModelMetrics = metrics && metrics.overall_metrics && metrics.model_info;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-500/30">
          <Activity className="w-3.5 h-3.5" />
          <span>{t("Diagnostic & Model Performance Analytics", "ರೋಗ ಪ್ರವೃತ್ತಿ & ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಮಾದರಿ ವಿಶ್ಲೇಷಣೆ")}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {t("Plantation & Model Analytics", "ತೋಟದ ವಿಶ್ಲೇಷಣೆ")}
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          {t(
            "Track longitudinal disease patterns from your field scans and inspect project model benchmark metrics.",
            "ನಿಮ್ಮ ತೋಟದ ಹಿಂದಿನ ಸ್ಕ್ಯಾನ್ ಇತಿಹಾಸ, ರೋಗ ಪ್ರವೃತ್ತಿಗಳು ಮತ್ತು AI ಮಾದರಿಯ ನಿಖರತೆಯ ಮೌಲ್ಯಮಾಪನ."
          )}
        </p>

        {/* View Switcher Tabs */}
        <div className="inline-flex p-1 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-bold mt-4">
          <button
            type="button"
            onClick={() => setActiveTab("scans")}
            className={`px-5 py-2.5 rounded-xl transition-all ${
              activeTab === "scans"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t("Scan History Trends", "ತೋಟದ ಸ್ಕ್ಯಾನ್ ಅಂಕಿಅಂಶ")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("model")}
            className={`px-5 py-2.5 rounded-xl transition-all ${
              activeTab === "model"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t("MobileNetV2 Model Benchmarks", "AI ಮಾದರಿ ಮೌಲ್ಯಮಾಪನ")}
          </button>
        </div>
      </div>

      {activeTab === "scans" ? (
        <>
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
            {/* Date Range Chips */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 font-semibold mr-1">{t("Filter Period:", "ಅವಧಿ:")}</span>
              {[
                { id: "all", labelEn: "All Time", labelKn: "ಎಲ್ಲಾ" },
                { id: "30d", labelEn: "Last 30 Days", labelKn: "ಕಳೆದ 30 ದಿನ" },
                { id: "7d", labelEn: "Last 7 Days", labelKn: "ಕಳೆದ 7 ದಿನ" }
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setDateRange(r.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                    dateRange === r.id
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                  }`}
                >
                  {lang === "kn" ? r.labelKn : r.labelEn}
                </button>
              ))}
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center space-x-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>{t("Export CSV", "CSV ರಫ್ತು")}</span>
              </button>
            </div>
          </div>

          {/* Empty State */}
          {totalScansCount === 0 ? (
            <div className="p-12 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{t("No Scan Data Yet", "ಇನ್ನೂ ಯಾವುದೇ ಸ್ಕ್ಯಾನ್ ದಾಖಲೆಗಳಿಲ್ಲ")}</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {t(
                    "Perform your first crop disease scan on the Home page to populate automatic trends, confidence metrics, and health distributions.",
                    "ಮುಖಪುಟದಲ್ಲಿ ಮೊದಲ ಗಿಡವನ್ನು ಪರೀಕ್ಷಿಸಿ. ಇಲ್ಲಿ ನಿಮ್ಮ ತೋಟದ ಆರೋಗ್ಯ ವರದಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ದಾಖಲಾಗುತ್ತದೆ."
                  )}
                </p>
              </div>
              <Link
                to="/#scanner"
                className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>{t("Scan Your First Plant", "ಮೊದಲ ಗಿಡ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ")}</span>
              </Link>
            </div>
          ) : (
            <>
              {/* KPI CARDS (4 CARDS) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Total Scans */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-xs font-semibold">{t("Total Scans", "ಒಟ್ಟು ಸ್ಕ್ಯಾನ್‌ಗಳು")}</span>
                    <Layers className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white">{totalScansCount}</div>
                  <p className="text-[11px] text-zinc-500">{t("Recorded across plots", "ವಿವಿಧ ಪ್ಲಾಟ್‌ಗಳಿಂದ")}</p>
                </div>

                {/* Healthy vs Diseased */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-xs font-semibold">{t("Healthy Canopy", "ಆರೋಗ್ಯ ಪ್ರಮಾಣ")}</span>
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-teal-400">{healthyPct}%</div>
                  <p className="text-[11px] text-zinc-500">
                    {t("Diseased:", "ಬಾಧಿತ:")} <span className="text-rose-400 font-bold">{diseasedPct}%</span>
                  </p>
                </div>

                {/* Most Common Disease */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-xs font-semibold">{t("Top Condition", "ಪ್ರಮುಖ ರೋಗ")}</span>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-amber-300 truncate" title={mostCommonDisease}>
                    {mostCommonDisease}
                  </div>
                  <p className="text-[11px] text-zinc-500">{t("High frequency pathogen", "ಹೆಚ್ಚು ಪತ್ತೆಯಾದ ರೋಗ")}</p>
                </div>

                {/* Scans This Month */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-xs font-semibold">{t("Scans This Month", "ಈ ತಿಂಗಳ ಸ್ಕ್ಯಾನ್")}</span>
                    <Calendar className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white">{currentMonthScans}</div>
                  <p className="text-[11px] text-zinc-500">{t("Active monitoring cycle", "ಪ್ರಸ್ತುತ ತಿಂಗಳ ಪರೀಕ್ಷೆ")}</p>
                </div>
              </div>

              {/* CHARTS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart 1: Disease Distribution Donut */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">{t("Disease Distribution", "ರೋಗಗಳ ಹಂಚಿಕೆ")}</h3>
                      <p className="text-xs text-zinc-400">{t("Relative proportion of flagged pathologies", "ಪತ್ತೆಯಾದ ರೋಗಗಳ ಶೇಕಡಾವಾರು ಪ್ರಮಾಣ")}</p>
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={diseaseDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {diseaseDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "0.75rem", fontSize: "12px" }}
                          itemStyle={{ color: "#ffffff" }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Scans Over Time with Daily/Weekly/Monthly Toggle */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white">{t("Scan Volume Over Time", "ದೈನಂದಿನ ಸ್ಕ್ಯಾನ್ ಪ್ರಮಾಣ")}</h3>
                      <p className="text-xs text-zinc-400">{t("Temporal distribution of orchard diagnostics", "ಸಮಯಾವಧಿಯ ಸ್ಕ್ಯಾನ್ ಬದಲಾವಣೆ")}</p>
                    </div>
                    {/* Timeframe View Toggle */}
                    <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[11px] font-semibold">
                      {(["daily", "weekly", "monthly"] as const).map((view) => (
                        <button
                          key={view}
                          type="button"
                          onClick={() => setTimeframeView(view)}
                          className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                            timeframeView === view ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {view}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scansOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                        <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "0.75rem", fontSize: "12px" }}
                        />
                        <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Average Confidence per Disease Bar Chart */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4 lg:col-span-2">
                  <div>
                    <h3 className="text-base font-bold text-white">{t("Average Classification Confidence (%)", "ಸರಾಸರಿ ನಿಖರತೆ (%)")}</h3>
                    <p className="text-xs text-zinc-400">{t("Model certainty per diagnostic class", "ಪ್ರತಿ ರೋಗದ ಸರಾಸರಿ ಕಾನ್ಫಿಡೆನ್ಸ್ ಪ್ರಮಾಣ")}</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={avgConfidencePerDisease}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={11} interval={0} angle={-15} textAnchor="end" height={50} />
                        <YAxis stroke="#71717a" fontSize={11} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "0.75rem", fontSize: "12px" }}
                        />
                        <Bar dataKey="avgConfidence" fill="#0d9488" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        /* SECTION B: MODEL PERFORMANCE METRICS (LOADED FROM metrics.json) */
        <div className="space-y-8 animate-in fade-in">
          {/* About Model Specs Card */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-teal-950/40 border border-emerald-800/60 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{t("Model Architecture Specifications", "ಮಾದರಿ ತಾಂತ್ರಿಕ ವಿವರಣೆ")}</h3>
                <p className="text-xs text-zinc-400">{t("MobileNetV2 Deep CNN Engine", "ಮೊಬೈಲ್ ನೆಟ್ V2 ಕನ್ವಲ್ಯೂಷನಲ್ ನೆಟ್‌ವರ್ಕ್")}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">{t("Architecture", "ಮಾದರಿ")}</span>
                <span className="font-semibold text-zinc-200">{metrics?.model_info?.architecture || "MobileNetV2"}</span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">{t("Input Shape", "ಇನ್‌ಪುಟ್ ಗಾತ್ರ")}</span>
                <span className="font-semibold text-zinc-200">{metrics?.model_info?.input_resolution || "224 x 224 x 3"}</span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">{t("Classes", "ವರ್ಗಗಳು")}</span>
                <span className="font-semibold text-zinc-200">{metrics?.model_info?.classes_count || 6} Classes</span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">{t("Dataset Size", "ಚಿತ್ರಗಳ ಸಂಖ್ಯೆ")}</span>
                <span className="font-semibold text-zinc-200">{metrics?.model_info?.dataset_images_count || 4200} Images</span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">{t("TFLite Size", "ಆಪ್ ತೂಕ")}</span>
                <span className="font-semibold text-zinc-200">{metrics?.model_info?.tflite_quantized_size_mb || 8.4} MB</span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">{t("Epochs", "ತರಬೇತಿ ಪುನರಾವರ್ತನೆ")}</span>
                <span className="font-semibold text-zinc-200">{metrics?.model_info?.training_epochs || 30}</span>
              </div>
            </div>
          </div>

          {/* Metric Cards: Accuracy, Precision, Recall, F1 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-xs font-semibold text-zinc-400 block">{t("Test Accuracy", "ನಿಖರತೆ (Accuracy)")}</span>
              <div className="text-3xl font-extrabold text-emerald-400">
                {hasModelMetrics ? `${(metrics.overall_metrics.accuracy * 100).toFixed(1)}%` : "Not available"}
              </div>
              <p className="text-[11px] text-zinc-500">{t("Held-out test validation set", "ಪರೀಕ್ಷಾ ಗುಂಪಿನಲ್ಲಿ")}</p>
            </div>

            <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-xs font-semibold text-zinc-400 block">{t("Macro Precision", "ಪ್ರಿಸಿಷನ್ (Precision)")}</span>
              <div className="text-3xl font-extrabold text-teal-400">
                {hasModelMetrics ? `${(metrics.overall_metrics.precision * 100).toFixed(1)}%` : "Not available"}
              </div>
              <p className="text-[11px] text-zinc-500">{t("Low false-positive rate", "ಕನಿಷ್ಠ ತಪ್ಪು ಫಲಿತಾಂಶ")}</p>
            </div>

            <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-xs font-semibold text-zinc-400 block">{t("Macro Recall", "ರಿಕಾಲ (Recall)")}</span>
              <div className="text-3xl font-extrabold text-blue-400">
                {hasModelMetrics ? `${(metrics.overall_metrics.recall * 100).toFixed(1)}%` : "Not available"}
              </div>
              <p className="text-[11px] text-zinc-500">{t("High true-positive sensitivity", "ರೋಗ ಪತ್ತೆ ಸಂವೇದನೆ")}</p>
            </div>

            <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-xs font-semibold text-zinc-400 block">{t("F1-Score", "F1 ಸ್ಕೋರ್")}</span>
              <div className="text-3xl font-extrabold text-purple-400">
                {hasModelMetrics ? `${(metrics.overall_metrics.f1_score * 100).toFixed(1)}%` : "Not available"}
              </div>
              <p className="text-[11px] text-zinc-500">{t("Harmonic mean balance", "ಸಮತೋಲಿತ ಅಂಕ")}</p>
            </div>
          </div>

          {/* Training History Curves (Accuracy & Loss) */}
          {metrics?.training_history && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h4 className="text-sm font-bold text-white">{t("Training vs Validation Accuracy", "ತರಬೇತಿ ಮತ್ತು ಪರೀಕ್ಷಾ ನಿಖರತೆ ರೇಖಾಚಿತ್ರ")}</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.training_history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="epoch" stroke="#71717a" fontSize={11} label={{ value: "Epoch", position: "insideBottom", offset: -5 }} />
                      <YAxis stroke="#71717a" fontSize={11} domain={[0.6, 1.0]} />
                      <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "0.75rem", fontSize: "12px" }} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Line type="monotone" dataKey="train_acc" name="Train Accuracy" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="val_acc" name="Val Accuracy" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h4 className="text-sm font-bold text-white">{t("Cross-Entropy Loss Reduction", "ಲಾಸ್ (Loss) ಇಳಿಕೆಯ ರೇಖಾಚಿತ್ರ")}</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.training_history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="epoch" stroke="#71717a" fontSize={11} label={{ value: "Epoch", position: "insideBottom", offset: -5 }} />
                      <YAxis stroke="#71717a" fontSize={11} domain={[0, 1.0]} />
                      <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "0.75rem", fontSize: "12px" }} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Line type="monotone" dataKey="train_loss" name="Train Loss" stroke="#f43f5e" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="val_loss" name="Val Loss" stroke="#fbbf24" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Per-Class Metrics Table */}
          {metrics?.per_class_metrics && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4 overflow-hidden">
              <h4 className="text-base font-bold text-white">{t("Per-Class Classification Report", "ಪ್ರತಿ ರೋಗದ ವಿವರವಾದ ಮೌಲ್ಯಮಾಪನ ಕೋಷ್ಟಕ")}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-4">{t("Disease Class", "ರೋಗದ ವರ್ಗ")}</th>
                      <th className="py-3 px-4">{t("Samples", "ಸ್ಯಾಂಪಲ್‌ಗಳು")}</th>
                      <th className="py-3 px-4">{t("Precision", "ಪ್ರಿಸಿಷನ್")}</th>
                      <th className="py-3 px-4">{t("Recall", "ರಿಕಾಲ")}</th>
                      <th className="py-3 px-4">{t("F1-Score", "F1 ಸ್ಕೋರ್")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {metrics.per_class_metrics.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {lang === "kn" ? (row.class_kn || row.class_name) : row.class_name}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400">{row.samples}</td>
                        <td className="py-3.5 px-4 text-teal-300">{(row.precision * 100).toFixed(1)}%</td>
                        <td className="py-3.5 px-4 text-blue-300">{(row.recall * 100).toFixed(1)}%</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400">{(row.f1_score * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Confusion Matrix Section */}
          {metrics?.confusion_matrix && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h4 className="text-base font-bold text-white">{t("Evaluation Confusion Matrix", "ಕನ್ಫ್ಯೂಷನ್ ಮ್ಯಾಟ್ರಿಕ್ಸ್")}</h4>
                <p className="text-xs text-zinc-400">
                  {t("True Label (Rows) vs Predicted Label (Columns)", "ನೈಜ ಫಲಿತಾಂಶ (ಅಡ್ಡಸಾಲು) vs ಊಹಿಸಿದ ಫಲಿತಾಂಶ (ಕಂಬಸಾಲು)")}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="text-center text-xs border-collapse mx-auto">
                  <thead>
                    <tr>
                      <th className="p-2 text-zinc-500 font-semibold text-[10px]"></th>
                      {metrics.confusion_matrix.labels.map((l: string, idx: number) => (
                        <th key={idx} className="p-2 text-zinc-400 font-bold text-[10px] uppercase truncate max-w-[80px]">
                          {l}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.confusion_matrix.matrix.map((row: number[], rIdx: number) => (
                      <tr key={rIdx}>
                        <td className="p-2 text-zinc-400 font-bold text-[10px] text-right truncate max-w-[80px]">
                          {metrics.confusion_matrix.labels[rIdx]}
                        </td>
                        {row.map((val: number, cIdx: number) => {
                          const isDiag = rIdx === cIdx;
                          return (
                            <td
                              key={cIdx}
                              className={`p-3 min-w-[55px] font-mono text-xs rounded-lg border border-zinc-800/80 ${
                                isDiag ? "bg-emerald-600/30 text-emerald-300 font-bold" : val > 0 ? "bg-rose-500/10 text-rose-300" : "bg-zinc-950 text-zinc-600"
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Analytics;
