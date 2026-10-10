import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { scansService, ScanRecord } from "@/services/scansService";
import {
  History as HistoryIcon,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  FileSpreadsheet,
  Download,
  Camera,
  RotateCcw,
  Eye,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Flame,
  FileText
} from "lucide-react";

export const History: React.FC = () => {
  const { lang, t } = useLanguage();

  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<"all" | "30d" | "7d">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest_conf" | "lowest_conf">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Detail Modal / Drawer state
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [showGradCam, setShowGradCam] = useState(false);

  // Clear all confirmation dialog state
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Subscribe to scansService
  useEffect(() => {
    setScans(scansService.getScans());
    const unsub = scansService.subscribe(() => {
      setScans(scansService.getScans());
    });
    return () => unsub();
  }, []);

  // Filter and sort scans
  const processedScans = useMemo(() => {
    let result = [...scans];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.disease.toLowerCase().includes(term) ||
          (s.disease_kn && s.disease_kn.toLowerCase().includes(term)) ||
          (s.plot && s.plot.toLowerCase().includes(term)) ||
          s.plantPart.toLowerCase().includes(term)
      );
    }

    // Disease filter
    if (diseaseFilter !== "all") {
      result = result.filter((s) => s.disease.toLowerCase().includes(diseaseFilter.toLowerCase()));
    }

    // Date range filter
    const now = Date.now();
    if (dateFilter === "7d") {
      result = result.filter((s) => s.timestamp >= now - 7 * 24 * 60 * 60 * 1000);
    } else if (dateFilter === "30d") {
      result = result.filter((s) => s.timestamp >= now - 30 * 24 * 60 * 60 * 1000);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") return b.timestamp - a.timestamp;
      if (sortBy === "oldest") return a.timestamp - b.timestamp;
      if (sortBy === "highest_conf") return b.confidence - a.confidence;
      if (sortBy === "lowest_conf") return a.confidence - b.confidence;
      return 0;
    });

    return result;
  }, [scans, searchTerm, diseaseFilter, dateFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedScans.length / itemsPerPage) || 1;
  const paginatedScans = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedScans.slice(start, start + itemsPerPage);
  }, [processedScans, currentPage]);

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = scansService.exportCSV();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ArecaAI_Scans_Archive_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Delete single scan
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    scansService.deleteScan(id);
    if (selectedScan && selectedScan.id === id) {
      setSelectedScan(null);
    }
  };

  // Clear all
  const handleClearAll = () => {
    scansService.clearAllScans();
    setShowClearConfirm(false);
    setSelectedScan(null);
  };

  // Status badge helper
  const getStatusBadge = (scan: ScanRecord) => {
    if (scan.confidence < 70) {
      return {
        labelEn: "Low Confidence",
        labelKn: "ಕಡಿಮೆ ನಿಖರತೆ",
        style: "bg-amber-500/20 text-amber-300 border-amber-500/40"
      };
    }
    if (scan.disease.toLowerCase().includes("healthy") || (scan.disease_kn && scan.disease_kn.includes("ಆರೋಗ್ಯಕರ"))) {
      return {
        labelEn: "Healthy Frond",
        labelKn: "ಆರೋಗ್ಯಕರ ಗಿಡ",
        style: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      };
    }
    return {
      labelEn: "Diseased",
      labelKn: "ರೋಗ ಬಾಧಿತ",
      style: "bg-rose-500/20 text-rose-300 border-rose-500/40"
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-500/30">
          <HistoryIcon className="w-3.5 h-3.5" />
          <span>{t("Diagnostic Records & Archive", "ಹಿಂದಿನ ಸ್ಕ್ಯಾನ್ ದಾಖಲೆಗಳು")}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {t("Field Scan History", "ಸ್ಕ್ಯಾನ್ ಇತಿಹಾಸ")}
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          {t(
            "Review past plantation diagnoses, inspect Grad-CAM heatmaps, verify confidence scores, and export audit reports.",
            "ನಿಮ್ಮ ತೋಟದ ಹಿಂದಿನ ಎಲ್ಲಾ ತಪಾಸಣೆಗಳು, ವಿವರವಾದ ಹೀಟ್‌ಮ್ಯಾಪ್ ಮತ್ತು ವರದಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ."
          )}
        </p>
      </div>

      {/* Controls Bar: Search, Filters, Sorting & Actions */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Search Box */}
          <div className="relative md:col-span-5">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t("Search by disease, plot, or plant part...", "ರೋಗ ಅಥವಾ ಪ್ಲಾಟ್ ಹುಡುಕಿ...")}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Disease Filter */}
          <div className="md:col-span-3">
            <select
              value={diseaseFilter}
              onChange={(e) => {
                setDiseaseFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">{t("All Conditions", "ಎಲ್ಲಾ ರೋಗಗಳು")}</option>
              <option value="koleroga">Koleroga (Mahali)</option>
              <option value="yellow">Yellow Leaf Disease</option>
              <option value="bud">Bud Rot</option>
              <option value="healthy">Healthy</option>
              <option value="spot">Leaf Spot</option>
              <option value="bleeding">Stem Bleeding</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="newest">{t("Newest First", "ಇತ್ತೀಚಿನವು")}</option>
              <option value="oldest">{t("Oldest First", "ಹಳೆಯವು")}</option>
              <option value="highest_conf">{t("Highest Confidence", "ಹೆಚ್ಚಿನ ನಿಖರತೆ")}</option>
              <option value="lowest_conf">{t("Lowest Confidence", "ಕಡಿಮೆ ನಿಖರತೆ")}</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={scans.length === 0}
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors disabled:opacity-40"
              title={t("Export all as CSV", "CSV ರಫ್ತು")}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              disabled={scans.length === 0}
              className="p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-colors disabled:opacity-40"
              title={t("Clear All History", "ಎಲ್ಲವನ್ನೂ ಅಳಿಸಿ")}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <Link
              to="/#scanner"
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl shadow transition-transform active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t("Rescan", "ಸ್ಕ್ಯಾನ್")}</span>
            </Link>
          </div>

        </div>

        {/* Date Filter Badges */}
        <div className="flex items-center gap-2 text-xs pt-1 border-t border-zinc-800/60">
          <span className="text-zinc-500 font-semibold">{t("Timeline:", "ಸಮಯ:")}</span>
          {(["all", "30d", "7d"] as const).map((df) => (
            <button
              key={df}
              type="button"
              onClick={() => {
                setDateFilter(df);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                dateFilter === df
                  ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {df === "all" ? t("All Time", "ಎಲ್ಲಾ") : df === "30d" ? t("Last 30 Days", "ಕಳೆದ 30 ದಿನ") : t("Last 7 Days", "ಕಳೆದ 7 ದಿನ")}
            </button>
          ))}
          <span className="ml-auto text-zinc-500 text-[11px]">
            {t("Showing", "ತೋರಿಸಲಾಗುತ್ತಿದೆ")} <strong className="text-zinc-300">{processedScans.length}</strong> {t("scans", "ದಾಖಲೆಗಳು")}
          </span>
        </div>
      </div>

      {/* Grid of Past Scans */}
      {processedScans.length === 0 ? (
        <div className="p-12 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center">
            <HistoryIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t("No Matching Scans Found", "ಯಾವುದೇ ದಾಖಲೆಗಳು ಸಿಗಲಿಲ್ಲ")}</h3>
            <p className="text-xs text-zinc-500 mt-1">
              {t("Try clearing your search query or take a new palm scan.", "ಬೇರೆ ಪದದಿಂದ ಹುಡುಕಿ ಅಥವಾ ಹೊಸ ಗಿಡವನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.")}
            </p>
          </div>
          <Link
            to="/#scanner"
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-transform"
          >
            <Camera className="w-4 h-4" />
            <span>{t("Scan Plant Now", "ಈಗಲೇ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ")}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedScans.map((scan) => {
            const status = getStatusBadge(scan);
            const dateStr = new Date(scan.timestamp).toLocaleString(lang === "kn" ? "kn-IN" : "en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div
                key={scan.id}
                onClick={() => {
                  setSelectedScan(scan);
                  setShowGradCam(false);
                }}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/50 rounded-3xl p-5 shadow-xl space-y-4 cursor-pointer transition-all hover:scale-[1.01] group flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Thumbnail & Badges */}
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
                    <img
                      src={scan.imageThumb || "/static/images/sample_koleroga.jpg"}
                      alt={scan.disease}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow backdrop-blur-md ${status.style}`}>
                        {lang === "kn" ? status.labelKn : status.labelEn}
                      </span>
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <span className="text-[10px] font-bold bg-zinc-900/90 text-zinc-300 px-2 py-0.5 rounded-lg border border-zinc-700 capitalize">
                        {scan.plantPart}
                      </span>
                    </div>
                  </div>

                  {/* Disease Info */}
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {lang === "kn" ? scan.disease_kn || scan.disease : scan.disease}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {t("Plot:", "ಪ್ಲಾಟ್:")} <span className="text-zinc-200">{scan.plot || "Main Plantation"}</span>
                    </p>
                  </div>

                  {/* Confidence Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                      <span>{t("Confidence", "ನಿಖರತೆ")}</span>
                      <span className="text-emerald-400 font-bold">{scan.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, scan.confidence)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Date & Delete */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{dateStr}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(scan.id, e)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title={t("Delete scan", "ಅಳಿಸಿ")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-emerald-400 text-xs font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span>{t("Details", "ವಿವರ")}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-30 hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-zinc-400 font-semibold">
            {t("Page", "ಪುಟ")} {currentPage} {t("of", "ರ")} {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-30 hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DETAIL DRAWER / MODAL */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedScan(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {t("Scan Pathology Inspection", "ಪರೀಕ್ಷಾ ವಿವರ")}
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                {lang === "kn" ? selectedScan.disease_kn || selectedScan.disease : selectedScan.disease}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {t("Scanned on", "ದಿನಾಂಕ:")} {new Date(selectedScan.timestamp).toLocaleString()} •{" "}
                {t("Plot:", "ಪ್ಲಾಟ್:")} {selectedScan.plot || "Main Plantation"}
              </p>
            </div>

            {/* Image Preview & Grad-CAM toggle */}
            <div className="space-y-3">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
                <img
                  src={selectedScan.imageThumb || "/static/images/sample_koleroga.jpg"}
                  alt="Scanned crop"
                  className="w-full h-full object-cover"
                />
                {showGradCam && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/50 via-amber-400/40 to-blue-500/20 mix-blend-color-dodge flex items-center justify-center">
                    <span className="px-3 py-1 rounded-full bg-black/60 text-white text-xs font-bold border border-white/20">
                      Grad-CAM Visual Heatmap
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowGradCam(!showGradCam)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    showGradCam
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                      : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showGradCam ? t("Hide Grad-CAM", "ಮೂಲ ಚಿತ್ರ") : t("View Grad-CAM Heatmap", "Grad-CAM ಹೀಟ್‌ಮ್ಯಾಪ್")}</span>
                </button>

                <a
                  href={`/report/${selectedScan.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t("Download PDF Report", "PDF ವರದಿ ಡೌನ್‌ಲೋಡ್")}</span>
                </a>
              </div>
            </div>

            {/* Top-3 Predictions */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {t("Top Diagnostic Probabilities", "ರೋಗ ನಿರ್ಣಯ ಸಂಭವನೀಯತೆ")}
              </h4>
              <div className="space-y-2">
                {(selectedScan.top3 || [
                  { disease: selectedScan.disease, disease_kn: selectedScan.disease_kn, confidence: selectedScan.confidence }
                ]).map((pred, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-200">
                        {lang === "kn" ? pred.disease_kn || pred.disease : pred.disease}
                      </span>
                      <span className="font-bold text-emerald-400">{pred.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, pred.confidence)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Treatment Recommendation shortcut */}
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-1.5">
              <strong className="text-emerald-300 block font-bold">
                {t("Recommended Immediate Treatment:", "ತಕ್ಷಣದ ಶಿಫಾರಸು ಚಿಕಿತ್ಸೆ:")}
              </strong>
              <p className="text-zinc-300">
                {lang === "kn"
                  ? "ಬಾಧಿತ ಭಾಗಕ್ಕೆ 1% ಬೋರ್ಡೋ ದ್ರಾವಣವನ್ನು ಸಿಂಪಡಿಸಿ ಅಥವಾ ಟ್ರೈಕೋಡರ್ಮಾ ಜೈವಿಕ ಗೊಬ್ಬರವನ್ನು ಬುಡಕ್ಕೆ ಹಾಕಿ."
                  : "Apply 1% Bordeaux mixture on the crown/bunches and ensure orchard drainage trenches are clear."}
              </p>
              <div className="pt-2">
                <Link
                  to="/solutions"
                  className="text-emerald-400 hover:underline font-semibold"
                >
                  {t("Open Full Treatment & Calendar Guide →", "ಸಂಪೂರ್ಣ ಚಿಕಿತ್ಸೆ ಮತ್ತು ಕ್ಯಾಲೆಂಡರ್ ನೋಡಿ →")}
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CONFIRM CLEAR ALL MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t("Clear All History?", "ಎಲ್ಲಾ ಇತಿಹಾಸ ಅಳಿಸುವುದೇ?")}</h3>
              <p className="text-xs text-zinc-400 mt-1">
                {t("This action will delete all saved scan records on this device. This cannot be undone.", "ಇದು ಈ ಡಿವೈಸ್‌ನಲ್ಲಿರುವ ಎಲ್ಲಾ ಸ್ಕ್ಯಾನ್ ದಾಖಲೆಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುತ್ತದೆ.")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
              >
                {t("Cancel", "ರದ್ದು")}
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg transition-colors"
              >
                {t("Yes, Clear All", "ಹೌದು, ಅಳಿಸಿ")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default History;
