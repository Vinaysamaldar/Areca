import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import {
  History as HistoryIcon,
  Search,
  Trash2,
  Download,
  Camera,
  Layers,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  FileSpreadsheet
} from "lucide-react";

interface ScanRecord {
  id: string | number;
  date: string;
  plot: string;
  disease: string;
  diseaseKn?: string;
  confidence: number;
  severity: string;
  ndvi: number;
  imageUrl?: string;
}

const DEFAULT_MOCK_HISTORY: ScanRecord[] = [
  {
    id: "scan_101",
    date: "2026-10-08 14:32",
    plot: "Plot A - North Ridge",
    disease: "Koleroga",
    diseaseKn: "ಕೊಳೆರೋಗ (ಮಹಾಲಿ)",
    confidence: 96.5,
    severity: "Critical",
    ndvi: 0.342,
    imageUrl: "/static/images/sample_koleroga.jpg"
  },
  {
    id: "scan_102",
    date: "2026-10-07 11:15",
    plot: "Plot B - Riverbank Block",
    disease: "Yellow Leaf Disease",
    diseaseKn: "ಹಳದಿ ಎಲೆ ರೋಗ",
    confidence: 94.2,
    severity: "High",
    ndvi: 0.418,
    imageUrl: "/static/images/sample_yellow_leaf.jpg"
  },
  {
    id: "scan_103",
    date: "2026-10-05 09:40",
    plot: "Plot C - Young Palms",
    disease: "Healthy",
    diseaseKn: "ಆರೋಗ್ಯಕರ ಮರ",
    confidence: 99.1,
    severity: "Healthy",
    ndvi: 0.785,
    imageUrl: "/static/images/sample_healthy.jpg"
  }
];

export const History: React.FC = () => {
  const { lang, t } = useLanguage();
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPlot, setSelectedPlot] = useState("all");
  const [selectedDisease, setSelectedDisease] = useState("all");
  const [compareA, setCompareA] = useState<ScanRecord | null>(null);
  const [compareB, setCompareB] = useState<ScanRecord | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("areca_scan_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecords(parsed);
          return;
        }
      }
    } catch (_) {}
    setRecords(DEFAULT_MOCK_HISTORY);
  }, []);

  const saveRecords = (newRecords: ScanRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem("areca_scan_history", JSON.stringify(newRecords));
  };

  const deleteRecord = (id: string | number) => {
    const updated = records.filter((r) => r.id !== id);
    saveRecords(updated);
  };

  const exportCsv = () => {
    const header = ["ID", "Date", "Plot", "Disease", "Confidence (%)", "Severity", "NDVI"];
    const rows = records.map((r) => [r.id, r.date, r.plot, r.disease, r.confidence, r.severity, r.ndvi]);
    const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ArecaAI_Scan_History.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.disease.toLowerCase().includes(search.toLowerCase()) ||
      (r.diseaseKn && r.diseaseKn.includes(search)) ||
      r.plot.toLowerCase().includes(search.toLowerCase());
    const matchesPlot = selectedPlot === "all" || r.plot.toLowerCase().includes(selectedPlot.toLowerCase());
    const matchesDisease = selectedDisease === "all" || r.disease.toLowerCase() === selectedDisease.toLowerCase();
    return matchesSearch && matchesPlot && matchesDisease;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-500/30">
            <HistoryIcon className="w-3.5 h-3.5" />
            <span>{t("Diagnostic Timeline & Archival", "ರೋಗ ಪರೀಕ್ಷೆಗಳ ಇತಿಹಾಸ")}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-2">
            {t("Plantation Scan History", "ತೋಟದ ಸ್ಕ್ಯಾನ್ ದಾಖಲೆಗಳು")}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {t(
              "Track temporal progression of foliar diseases, monitor plot treatment response, and compare index maps.",
              "ಹಿಂದಿನ ಪರೀಕ್ಷೆಗಳ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ಚಿಕಿತ್ಸೆಯ ನಂತರದ ಸುಧಾರಣೆಯನ್ನು ಹೋಲಿಕೆ ಮಾಡಿ."
            )}
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={exportCsv}
            disabled={records.length === 0}
            className="inline-flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-zinc-700 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{t("Export CSV", "ಸಿಎಸ್‌ವಿ ಡೌನ್‌ಲೋಡ್")}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search by disease or plot...", "ರೋಗ ಅಥವಾ ಪ್ಲಾಟ್ ಹುಡುಕಿ...")}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={selectedPlot}
          onChange={(e) => setSelectedPlot(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">{t("All Plantation Plots", "ಎಲ್ಲಾ ಪ್ಲಾಟ್‌ಗಳು")}</option>
          <option value="Plot A">Plot A - North Ridge</option>
          <option value="Plot B">Plot B - Riverbank Block</option>
          <option value="Plot C">Plot C - Young Palms</option>
          <option value="Plot D">Plot D - Valley Terrace</option>
        </select>

        <select
          value={selectedDisease}
          onChange={(e) => setSelectedDisease(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">{t("All Diseases", "ಎಲ್ಲಾ ರೋಗಗಳು")}</option>
          <option value="Healthy">Healthy (ಆರೋಗ್ಯಕರ)</option>
          <option value="Koleroga">Koleroga (ಕೊಳೆರೋಗ)</option>
          <option value="Yellow Leaf Disease">Yellow Leaf Disease (ಹಳದಿ ಎಲೆ)</option>
          <option value="Bud Rot">Bud Rot (ಸುಳಿ ಕೊಳೆ)</option>
        </select>
      </div>

      {/* History Table or Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-900/60 rounded-3xl p-12 border border-zinc-800 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center">
            <HistoryIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {t("No Scan History Recorded Yet", "ಇನ್ನೂ ಯಾವುದೇ ಸ್ಕ್ಯಾನ್ ದಾಖಲಾಗಿಲ್ಲ")}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {t(
              "Your plantation diagnostic scans will be logged here automatically with confidence levels and NDVI health ratings.",
              "ನೀವು ಮಾಡುವ ಎಲ್ಲಾ ರೋಗ ಪರೀಕ್ಷೆಗಳು ಇಲ್ಲಿ ದಿನಾಂಕ ಮತ್ತು ನಿಖರತೆಯೊಂದಿಗೆ ದಾಖಲಾಗುತ್ತವೆ."
            )}
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>{t("Start First Disease Scan", "ಮೊದಲ ಪರೀಕ್ಷೆ ಆರಂಭಿಸಿ")}</span>
          </Link>
        </div>
      ) : (
        <div className="bg-zinc-900/80 rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">{t("Thumbnail & Date", "ಚಿತ್ರ ಮತ್ತು ದಿನಾಂಕ")}</th>
                  <th className="p-4">{t("Plantation Plot", "ಪ್ಲಾಟ್")}</th>
                  <th className="p-4">{t("Diagnosed Disease", "ರೋಗ ನಿರ್ಣಯ")}</th>
                  <th className="p-4">{t("Confidence", "ನಿಖರತೆ")}</th>
                  <th className="p-4">{t("NDVI Health", "ಎನ್‌ಡಿವಿಐ")}</th>
                  <th className="p-4">{t("Severity", "ತೀವ್ರತೆ")}</th>
                  <th className="p-4 text-right">{t("Actions", "ಕ್ರಿಯೆ")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-200">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-4 flex items-center space-x-3">
                      <img
                        src={item.imageUrl || "/static/images/sample_healthy.jpg"}
                        alt={item.disease}
                        className="w-12 h-12 rounded-xl object-cover border border-zinc-700 bg-zinc-950 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=200&q=80";
                        }}
                      />
                      <div>
                        <span className="font-bold text-white block">{item.date}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">ID: {item.id}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-medium">
                        {item.plot}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-extrabold text-white block">
                        {lang === "kn" ? item.diseaseKn || item.disease : item.disease}
                      </span>
                      {item.diseaseKn && lang !== "kn" && (
                        <span className="text-[11px] text-emerald-400 font-kannada">{item.diseaseKn}</span>
                      )}
                    </td>

                    <td className="p-4 font-bold text-emerald-400">
                      {item.confidence}%
                    </td>

                    <td className="p-4 font-mono font-bold text-teal-400">
                      +{item.ndvi}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          item.severity === "Critical"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : item.severity === "High"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => deleteRecord(item.id)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                        title="Delete scan record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
