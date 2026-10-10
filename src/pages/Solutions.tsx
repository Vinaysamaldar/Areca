import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import diseasesData from "@/data/diseases.json";
import { scansService, ScanRecord } from "@/services/scansService";
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  Sprout,
  FlaskConical,
  ShieldAlert,
  Bell,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
  ChevronLeft,
  CalendarPlus,
  Info
} from "lucide-react";

interface CalendarEvent {
  id: string;
  monthIndex: number; // 0-11
  monthNameEn: string;
  monthNameKn: string;
  titleEn: string;
  titleKn: string;
  category: "spraying" | "fertilizer" | "inspection" | "harvest";
  dateFormatted: string;
  descriptionEn: string;
  descriptionKn: string;
}

const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "evt-1",
    monthIndex: 4, // May
    monthNameEn: "May",
    monthNameKn: "ಮೇ",
    titleEn: "Pre-Monsoon 1% Bordeaux Spray",
    titleKn: "ಮುಂಗಾರು ಪೂರ್ವ 1% ಬೋರ್ಡೋ ದ್ರಾವಣ ಸಿಂಪಡಣೆ",
    category: "spraying",
    dateFormatted: "May 15 - May 30",
    descriptionEn: "Apply prophylactic 1% Bordeaux mixture on all developing bunches and crowns before monsoon squalls begin.",
    descriptionKn: "ಮುಂಗಾರು ಮಳೆ ಆರಂಭಕ್ಕೂ ಮುನ್ನವೇ ಗೊನೆ ಮತ್ತು ಸುಳಿಗಳಿಗೆ 1% ಬೋರ್ಡೋ ದ್ರಾವಣವನ್ನು ರಕ್ಷಣಾತ್ಮಕವಾಗಿ ಸಿಂಪಡಿಸಿ."
  },
  {
    id: "evt-2",
    monthIndex: 4, // May
    monthNameEn: "May",
    monthNameKn: "ಮೇ",
    titleEn: "Drainage Trench & Basin Inspection",
    titleKn: "ಬಸಿಗಾಲುವೆ ಮತ್ತು ಬದುಗಳ ದುರಸ್ತಿ",
    category: "inspection",
    dateFormatted: "May 20 - June 05",
    descriptionEn: "Clean and deepen 60cm drainage trenches between rows to avoid water stagnation in heavy rains.",
    descriptionKn: "ತೋಟದಲ್ಲಿ ನೀರು ನಿಲ್ಲದಂತೆ ಸಾಲುಗಳ ನಡುವೆ 60 ಸೆಂ.ಮೀ ಆಳದ ಚರಂಡಿಗಳನ್ನು ಸ್ವಚ್ಛಗೊಳಿಸಿ."
  },
  {
    id: "evt-3",
    monthIndex: 5, // June
    monthNameEn: "June",
    monthNameKn: "ಜೂನ್",
    titleEn: "Bunch Covering (Kotte Tying)",
    titleKn: "ಗೊನೆಗಳಿಗೆ ಕೊಟ್ಟೆ (ಪ್ಲಾಸ್ಟಿಕ್ ಕವರ್) ಕಟ್ಟುವುದು",
    category: "spraying",
    dateFormatted: "June 01 - June 20",
    descriptionEn: "Cover bunches with 200-gauge UV polythene bags to block Koleroga spore splash during heavy monsoonal rain.",
    descriptionKn: "ಕೊಳೆರೋಗದ ಸೋಂಕು ತಗುಲದಂತೆ 200 ಗೇಜ್ ಪಾಲಿಥೀನ್ ಚೀಲಗಳನ್ನು ಗೊನೆಗಳಿಗೆ ಕಟ್ಟಿ."
  },
  {
    id: "evt-4",
    monthIndex: 6, // July
    monthNameEn: "July",
    monthNameKn: "ಜುಲೈ",
    titleEn: "Mid-Monsoon Rain Break Curative Spray",
    titleKn: "ಮಳೆ ಬಿಡುವಿನ ವೇಳೆಯ ಎರಡನೇ ಸಿಂಪಡಣೆ",
    category: "spraying",
    dateFormatted: "July 10 - July 25",
    descriptionEn: "During 3-day rain breaks, spray Metalaxyl-Mancozeb (2.5 g/L) or 1% Bordeaux mixture.",
    descriptionKn: "ಮಳೆ ಬಿಡುವು ನೀಡಿದ ದಿನಗಳಲ್ಲಿ ಮೆಟಾಲಾಕ್ಸಿಲ್-ಮ್ಯಾಂಕೋಜೆಬ್ ಅಥವಾ ಬೋರ್ಡೋ ದ್ರಾವಣವನ್ನು ಸಿಂಪಡಿಸಿ."
  },
  {
    id: "evt-5",
    monthIndex: 7, // August
    monthNameEn: "August",
    monthNameKn: "ಆಗಸ್ಟ್",
    titleEn: "Crown Bud Rot & Fallen Nut Sanitation",
    titleKn: "ಸುಳಿ ಕೊಳೆ ತಪಾಸಣೆ ಮತ್ತು ನೆಲ ಸ್ವಚ್ಛತೆ",
    category: "inspection",
    dateFormatted: "August 05 - August 20",
    descriptionEn: "Inspect central spindle leaves. Collect and burn all dropped rotten nuts to break pathogen spore cycles.",
    descriptionKn: "ಸುಳಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ. ನೆಲಕ್ಕೆ ಬಿದ್ದ ಕೊಳೆತ ಕಾಯಿಗಳನ್ನು ಆಯ್ದು ಸುಟ್ಟು ಹಾಕಿ ರೋಗಾಣು ಹರಡುವುದನ್ನು ತಡೆಯಿರಿ."
  },
  {
    id: "evt-6",
    monthIndex: 8, // September
    monthNameEn: "September",
    monthNameKn: "ಸೆಪ್ಟೆಂಬರ್",
    titleEn: "Post-Monsoon Organic Compost & Neem Cake",
    titleKn: "ಮಳೆಗಾಲದ ನಂತರ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಮತ್ತು ಬೇವಿನ ಹಿಂಡಿ",
    category: "fertilizer",
    dateFormatted: "Sept 10 - Sept 30",
    descriptionEn: "Fork in 20kg FYM + 2kg Neem cake enriched with Trichoderma harzianum per palm basin.",
    descriptionKn: "ಪ್ರತಿ ಮರದ ಬುಡಕ್ಕೆ 20 ಕೆ.ಜಿ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಮತ್ತು 2 ಕೆ.ಜಿ ಬೇವಿನ ಹಿಂಡಿ ಬೆರೆಸಿ ಮಣ್ಣಿಗೆ ಹಾಕಿ."
  },
  {
    id: "evt-7",
    monthIndex: 9, // October
    monthNameEn: "October",
    monthNameKn: "ಅಕ್ಟೋಬರ್",
    titleEn: "Balanced NPK Chemical Fertilization",
    titleKn: "ರಸಗೊಬ್ಬರ (NPK) ಮತ್ತು ಸೂಕ್ಷ್ಮ ಪೋಷಕಾಂಶಗಳ ಬಳಕೆ",
    category: "fertilizer",
    dateFormatted: "Oct 05 - Oct 25",
    descriptionEn: "Apply second split of NPK (100:40:140g) along with 25g Zinc Sulphate and 15g Borax.",
    descriptionKn: "ಶಿಫಾರಸು ಮಾಡಿದ ಸಾರಜನಕ, ರಂಜಕ, ಪೊಟ್ಯಾಶ್ ಮತ್ತು ಜಿಂಕ್-ಬೋರಾಕ್ಸ್ ಪೋಷಕಾಂಶಗಳನ್ನು ನೀಡಿ."
  },
  {
    id: "evt-8",
    monthIndex: 10, // November
    monthNameEn: "November",
    monthNameKn: "ನವೆಂಬರ್",
    titleEn: "Ripe Arecanut Harvesting & Drying",
    titleKn: "ಅಡಿಕೆ ಕೊಯ್ಲು ಮತ್ತು ಸಂಸ್ಕರಣೆ ಆರಂಭ",
    category: "harvest",
    dateFormatted: "Nov 01 - Dec 15",
    descriptionEn: "Begin selective harvesting of mature bunches. Dry nuts on clean raised tarpaulins or solar dryers.",
    descriptionKn: "ಪಕ್ವವಾದ ಅಡಿಕೆ ಗೊನೆಗಳನ್ನು ಕೊಯ್ದು ಸ್ವಚ್ಛವಾದ ಟಾರ್ಪಾಲಿನ್ ಮೇಲೆ ಹರಡಿ ಒಣಗಿಸಿ."
  }
];

export const Solutions: React.FC = () => {
  const { lang, t } = useLanguage();

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPart, setSelectedPart] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [remedyTabs, setRemedyTabs] = useState<Record<string, "organic" | "chemical">>({});

  // Calendar State
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [savedReminders, setSavedReminders] = useState<string[]>([]);
  const [recentScan, setRecentScan] = useState<ScanRecord | null>(null);
  const [reminderNotificationAlert, setReminderNotificationAlert] = useState<string | null>(null);

  // Load reminders and latest scan from scansService
  useEffect(() => {
    try {
      const stored = localStorage.getItem("areca_calendar_reminders");
      if (stored) {
        setSavedReminders(JSON.parse(stored));
      }
    } catch (_) {}

    const scans = scansService.getScans();
    if (scans && scans.length > 0) {
      setRecentScan(scans[0]);
    }

    const unsub = scansService.subscribe(() => {
      const updated = scansService.getScans();
      if (updated && updated.length > 0) {
        setRecentScan(updated[0]);
      }
    });

    return () => unsub();
  }, []);

  // Filter diseases
  const filteredDiseases = diseasesData.diseases.filter((d) => {
    const matchesSearch =
      d.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.name_kn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.pathogen.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPart = selectedPart === "all" || d.plantPart === selectedPart;
    const matchesSeverity = selectedSeverity === "all" || d.severity === selectedSeverity;

    return matchesSearch && matchesPart && matchesSeverity;
  });

  // Toggle remedy tab for a disease
  const setTab = (id: string, tab: "organic" | "chemical") => {
    setRemedyTabs((prev) => ({ ...prev, [id]: tab }));
  };

  // Toggle Reminder
  const toggleReminder = async (eventId: string, eventTitle: string) => {
    let updated: string[];
    if (savedReminders.includes(eventId)) {
      updated = savedReminders.filter((id) => id !== eventId);
      setReminderNotificationAlert(
        lang === "kn" ? `"${eventTitle}" ಜ್ಞಾಪನೆಯನ್ನು ತೆಗೆದುಹಾಕಲಾಗಿದೆ.` : `Reminder removed for "${eventTitle}".`
      );
    } else {
      updated = [...savedReminders, eventId];
      // Check notification permission
      if ("Notification" in window && Notification.permission !== "granted") {
        try {
          await Notification.requestPermission();
        } catch (_) {}
      }
      setReminderNotificationAlert(
        lang === "kn"
          ? `ಜ್ಞಾಪನೆ ಉಳಿಸಲಾಗಿದೆ: "${eventTitle}". ನಿಮ್ಮ ಕ್ಯಾಲೆಂಡರ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ!`
          : `Reminder saved for "${eventTitle}". Notification scheduled!`
      );
    }
    setSavedReminders(updated);
    try {
      localStorage.setItem("areca_calendar_reminders", JSON.stringify(updated));
    } catch (_) {}

    setTimeout(() => {
      setReminderNotificationAlert(null);
    }, 3500);
  };

  // Download .ics for Google/Apple Calendar
  const downloadIcs = (event: CalendarEvent) => {
    const now = new Date();
    const eventYear = now.getFullYear();
    const startDate = new Date(eventYear, event.monthIndex, 15, 9, 0, 0);
    const endDate = new Date(eventYear, event.monthIndex, 15, 11, 0, 0);

    const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const title = lang === "kn" ? event.titleKn : event.titleEn;
    const desc = lang === "kn" ? event.descriptionKn : event.descriptionEn;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ArecaAI//Seasonal Advisory Calendar//EN",
      "BEGIN:VEVENT",
      `SUMMARY:ArecaAI: ${title}`,
      `DESCRIPTION:${desc}`,
      "LOCATION:Arecanut Plantation",
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ArecaAI_Task_${event.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTHS_KN = ["ಜನ", "ಫೆಬ್ರ", "ಮಾರ್ಚ್", "ಏಪ್ರಿ", "ಮೇ", "ಜೂನ್", "ಜುಲೈ", "ಆಗ", "ಸೆಪ್ಟೆಂ", "ಅಕ್ಟೋ", "ನವೆಂ", "ಡಿಸೆಂ"];

  const getCategoryBadge = (category: CalendarEvent["category"]) => {
    switch (category) {
      case "spraying":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "fertilizer":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "inspection":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "harvest":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t("Agronomic Solutions & Seasonal Calendar", "ರೋಗ ಪರಿಹಾರಗಳು & ಕೃಷಿ ಕ್ಯಾಲೆಂಡರ್")}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {t("Disease Solutions & Advisory", "ಅಡಿಕೆ ರೋಗ ಪರಿಹಾರಗಳು")}
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          {t(
            "Evidence-based organic bio-controls, chemical fungicides, dosages, and monthly plantation management schedules.",
            "ಸಾವಯವ ಉಪಚಾರಗಳು, ರಾಸಾಯನಿಕ ಶಿಲೀಂಧ್ರನಾಶಕಗಳ ನಿಖರ ಪ್ರಮಾಣ ಮತ್ತು ಮಾಸಿಕ ತೋಟ ನಿರ್ವಹಣಾ ಕ್ಯಾಲೆಂಡರ್."
          )}
        </p>
      </div>

      {/* Linked Scan Result Banner (If farmer has recent scan) */}
      {recentScan && recentScan.severity !== "Healthy" && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-teal-950/60 border border-emerald-600/40 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                {t("Latest Field Scan Diagnostic", "ಇತ್ತೀಚಿನ ಗಿಡ ಪರೀಕ್ಷಾ ವರದಿ")}
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {lang === "kn" ? recentScan.disease_kn || recentScan.disease : recentScan.disease} ({recentScan.confidence.toFixed(1)}%)
              </h3>
              <p className="text-xs text-zinc-400">
                {t("Affected Part:", "ಬಾಧಿತ ಭಾಗ:")} <span className="capitalize text-zinc-200 font-semibold">{recentScan.plantPart}</span> •{" "}
                {t("Plot:", "ಪ್ಲಾಟ್:")} <span className="text-zinc-200">{recentScan.plot || "Main Plantation"}</span>
              </p>
            </div>
          </div>
          <a
            href={`#disease-${recentScan.disease.toLowerCase().includes("koleroga") ? "koleroga" : recentScan.disease.toLowerCase().includes("bud") ? "bud-rot" : "yellow-leaf"}`}
            className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all shrink-0 active:scale-95"
          >
            <span>{t("Jump to Treatment", "ಚಿಕಿತ್ಸೆಗೆ ತೆರಳಿ")}</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Notification Toast */}
      {reminderNotificationAlert && (
        <div className="fixed bottom-20 right-4 z-50 bg-emerald-900/90 border border-emerald-500 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{reminderNotificationAlert}</span>
        </div>
      )}

      {/* SECTION 1: SOLUTIONS LIBRARY */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sprout className="w-6 h-6 text-emerald-400" />
              <span>{t("Treatment Library (6 Conditions)", "ಚಿಕಿತ್ಸಾ ಮಾಹಿತಿ ಸಂಗ್ರಹ (6 ರೋಗಗಳು)")}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {t("Search and filter by affected plant part or infection severity.", "ಗಿಡದ ಭಾಗ ಅಥವಾ ತೀವ್ರತೆಯ ಆಧಾರದ ಮೇಲೆ ಶೋಧಿಸಿ.")}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("Search by disease or pathogen...", "ರೋಗ ಅಥವಾ ಔಷಧ ಹುಡುಕಿ...")}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-400 font-bold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t("Plant Part:", "ಗಿಡದ ಭಾಗ:")}</span>
          </span>
          {["all", "leaf", "bud", "nut", "stem", "root"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPart(p)}
              className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition-all ${
                selectedPart === p
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              {p === "all" ? t("All Parts", "ಎಲ್ಲಾ") : p}
            </button>
          ))}

          <span className="text-zinc-400 font-bold ml-2 mr-1">{t("Severity:", "ತೀವ್ರತೆ:")}</span>
          {["all", "Critical", "Moderate", "Low"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedSeverity(s)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                selectedSeverity === s
                  ? "bg-teal-600 text-white shadow-md shadow-teal-950"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              {s === "all" ? t("All Severities", "ಎಲ್ಲಾ") : s}
            </button>
          ))}
        </div>

        {/* Disease Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDiseases.map((d) => {
            const currentTab = remedyTabs[d.id] || "organic";
            return (
              <div
                key={d.id}
                id={`disease-${d.id}`}
                className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between hover:border-zinc-700 transition-colors"
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        d.severity === "Critical"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : d.severity === "Moderate"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      }`}
                    >
                      {d.severity} Severity
                    </span>
                    <span className="text-[11px] font-semibold bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full capitalize">
                      {t("Part:", "ಭಾಗ:")} {d.plantPart}
                    </span>
                  </div>

                  {/* Title & Pathogen */}
                  <div>
                    <h3 className="text-xl font-extrabold text-white">
                      {lang === "kn" ? d.name_kn : d.name_en}
                    </h3>
                    {lang !== "kn" && (
                      <p className="text-sm font-semibold text-emerald-400 font-kannada mt-0.5">
                        {d.name_kn}
                      </p>
                    )}
                    <p className="text-[11px] text-zinc-400 italic mt-1">
                      {t("Pathogen:", "ರೋಗಾಣು:")} {d.pathogen}
                    </p>
                  </div>

                  {/* Symptoms Accordion Box */}
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                      {t("Symptoms & Identification:", "ರೋಗದ ಲಕ್ಷಣಗಳು:")}
                    </span>
                    <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
                      {(lang === "kn" ? d.symptoms_kn : d.symptoms_en).slice(0, 3).map((sym, idx) => (
                        <li key={idx} className="leading-snug">
                          {sym}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Remedies Tabs: Organic vs Chemical */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setTab(d.id, "organic")}
                        className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                          currentTab === "organic"
                            ? "bg-emerald-600 text-white shadow"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <Sprout className="w-3.5 h-3.5" />
                        <span>{t("Organic Remedy", "ಸಾವಯವ")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab(d.id, "chemical")}
                        className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                          currentTab === "chemical"
                            ? "bg-amber-600 text-white shadow"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>{t("Chemical Remedy", "ರಾಸಾಯನಿಕ")}</span>
                      </button>
                    </div>

                    {/* Tab Content */}
                    {currentTab === "organic" ? (
                      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 text-xs space-y-1.5 animate-in fade-in">
                        <strong className="text-emerald-300 block font-bold">
                          {lang === "kn" ? d.organic_remedy.name_kn : d.organic_remedy.name_en}
                        </strong>
                        <p className="text-zinc-300">
                          <span className="font-semibold text-zinc-400">{t("Dose:", "ಪ್ರಮಾಣ:")}</span>{" "}
                          {lang === "kn" ? d.organic_remedy.dose_kn : d.organic_remedy.dose_en}
                        </p>
                        <p className="text-zinc-400 leading-relaxed text-[11px]">
                          <span className="font-semibold text-zinc-300">{t("Application:", "ವಿಧಾನ:")}</span>{" "}
                          {lang === "kn" ? d.organic_remedy.application_kn : d.organic_remedy.application_en}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-xs space-y-1.5 animate-in fade-in">
                        <strong className="text-amber-300 block font-bold">
                          {lang === "kn" ? d.chemical_remedy.name_kn : d.chemical_remedy.name_en}
                        </strong>
                        <p className="text-zinc-300">
                          <span className="font-semibold text-zinc-400">{t("Dose:", "ಪ್ರಮಾಣ:")}</span>{" "}
                          {lang === "kn" ? d.chemical_remedy.dose_kn : d.chemical_remedy.dose_en}
                        </p>
                        <p className="text-zinc-400 leading-relaxed text-[11px]">
                          <span className="font-semibold text-zinc-300">{t("Application:", "ವಿಧಾನ:")}</span>{" "}
                          {lang === "kn" ? d.chemical_remedy.application_kn : d.chemical_remedy.application_en}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Prevention Checklist */}
                  <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                      {t("Long-term Prevention:", "ಮುನ್ನೆಚ್ಚರಿಕೆ ಕ್ರಮಗಳು:")}
                    </span>
                    <ul className="text-[11px] text-zinc-400 space-y-1">
                      {(lang === "kn" ? d.prevention_kn : d.prevention_en).map((prev, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{prev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800">
                  <a
                    href="#calendar-section"
                    className="w-full inline-flex items-center justify-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>{t("Schedule Spray on Calendar", "ಕ್ಯಾಲೆಂಡರ್‌ನಲ್ಲಿ ಸಿಂಪಡಣೆ ನಿಗದಿ")}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer Banner */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200 block">{t("Official Advisory Disclaimer:", "ಕೃಷಿ ಸಲಹಾ ಸೂಚನೆ:")}</strong>
            {lang === "kn" ? diseasesData.disclaimer_kn : diseasesData.disclaimer_en}
          </p>
        </div>
      </section>

      {/* SECTION 2: MONTHLY & SEASONAL SPRAY CALENDAR */}
      <section id="calendar-section" className="space-y-6 pt-6 border-t border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-emerald-400" />
              <span>{t("Seasonal Disease-Prevention Calendar", "ಋತುಮಾನ ಆಧಾರಿತ ರೋಗ ನಿಯಂತ್ರಣ ಕ್ಯಾಲೆಂಡರ್")}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {t("Color-coded management tasks for Malnad & Coastal areca belts. Add reminders or export to Google Calendar.", "ಮಲೆನಾಡು ಮತ್ತು ಕರಾವಳಿ ಭಾಗಗಳ ಅಡಿಕೆ ತೋಟ ನಿರ್ವಹಣಾ ವೇಳಾಪಟ್ಟಿ.")}
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {t("Spraying", "ಸಿಂಪಡಣೆ")}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {t("Fertilizer", "ಗೊಬ್ಬರ")}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {t("Inspection", "ಪರಿಶೀಲನೆ")}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {t("Harvest", "ಕೊಯ್ಲು")}
            </span>
          </div>
        </div>

        {/* Month Selector Bar (Responsive Carousel) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {MONTHS_EN.map((m, idx) => {
            const hasEvents = CALENDAR_EVENTS.some((e) => e.monthIndex === idx);
            const isSelected = selectedMonth === idx;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMonth(idx)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-all ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950 scale-105"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                <span>{lang === "kn" ? MONTHS_KN[idx] : m}</span>
                {hasEvents && (
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ml-1.5 ${isSelected ? "bg-white" : "bg-emerald-400"}`}></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Calendar Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CALENDAR_EVENTS.filter((e) => e.monthIndex === selectedMonth).map((event) => {
            const isSaved = savedReminders.includes(event.id);
            return (
              <div
                key={event.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between hover:border-zinc-700 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryBadge(event.category)}`}>
                      {event.category}
                    </span>
                    <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{event.dateFormatted}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      {lang === "kn" ? event.titleKn : event.titleEn}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {lang === "kn" ? event.descriptionKn : event.descriptionEn}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleReminder(event.id, lang === "kn" ? event.titleKn : event.titleEn)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isSaved
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    }`}
                  >
                    <Bell className={`w-3.5 h-3.5 ${isSaved ? "text-emerald-400 fill-emerald-400" : "text-zinc-400"}`} />
                    <span>{isSaved ? t("Reminder Active", "ಜ್ಞಾಪನೆ ಸಕ್ರಿಯ") : t("Add Reminder", "ಜ್ಞಾಪನೆ ಸೇರಿಸಿ")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadIcs(event)}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                    title={t("Export to Calendar (.ics)", "ಕ್ಯಾಲೆಂಡರ್‌ಗೆ ರಫ್ತು")}
                  >
                    <Download className="w-3.5 h-3.5 text-teal-400" />
                    <span>.ICS</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {CALENDAR_EVENTS.filter((e) => e.monthIndex === selectedMonth).length === 0 && (
          <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
            <CalendarIcon className="w-10 h-10 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-bold text-zinc-300">
              {t("Routine Orchard Maintenance", "ಸಾಮಾನ್ಯ ತೋಟ ನಿರ್ವಹಣೆ")}
            </h4>
            <p className="text-xs text-zinc-500">
              {t(
                "No critical chemical sprays scheduled for this month. Maintain regular soil moisture inspections and basin weeding.",
                "ಈ ತಿಂಗಳಲ್ಲಿ ಯಾವುದೇ ತುರ್ತು ರಾಸಾಯನಿಕ ಸಿಂಪಡಣೆ ಅಗತ್ಯವಿಲ್ಲ. ನಿಯಮಿತ ನೀರು ಮತ್ತು ಕಳೆ ನಿರ್ವಹಣೆ ಮುಂದುವರಿಸಿ."
              )}
            </p>
          </div>
        )}
      </section>

    </div>
  );
};

export default Solutions;
