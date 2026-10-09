import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Calendar,
  Sprout,
  FlaskConical,
  ShieldAlert,
  Download,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";

interface SeasonSchedule {
  seasonEn: string;
  seasonKn: string;
  monthsEn: string;
  monthsKn: string;
  badge: string;
  actionsEn: string[];
  actionsKn: string[];
}

const SEASONS: SeasonSchedule[] = [
  {
    seasonEn: "Pre-Monsoon Preparation",
    seasonKn: "ಮುಂಗಾರು ಪೂರ್ವ ಸಿದ್ಧತೆ",
    monthsEn: "May - June",
    monthsKn: "ಮೇ - ಜೂನ್",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    actionsEn: [
      "Construct or deepen drainage trenches (depth 50-75 cm) to avert basin water stagnation",
      "Apply first prophylactic spray of 1% Bordeaux mixture on bunches before monsoonal squalls",
      "Bag developing bunches with 200-gauge polythene covers (Kotte tying) to block rain splash",
      "Apply 2 kg Neem cake enriched with Trichoderma harzianum around the root zone"
    ],
    actionsKn: [
      "ತೋಟದಲ್ಲಿ ನೀರು ನಿಲ್ಲದಂತೆ 50-75 ಸೆಂ.ಮೀ ಆಳದ ಬಸಿಗಾಲುವೆಗಳನ್ನು ನಿರ್ಮಿಸಿ ಅಥವಾ ಸ್ವಚ್ಛಗೊಳಿಸಿ",
      "ಮುಂಗಾರು ಮಳೆ ಆರಂಭಕ್ಕೂ ಮುನ್ನವೇ ಗೊನೆಗಳಿಗೆ 1% ಬೋರ್ಡೋ ದ್ರಾವಣದ ಮೊದಲ ಸಿಂಪಡಣೆ ಮಾಡಿ",
      "ಮಳೆಯ ಹನಿಗಳು ತಾಗದಂತೆ ಗೊನೆಗಳಿಗೆ 200 ಗೇಜ್ ಪ್ಲಾಸ್ಟಿಕ್ ಚೀಲಗಳನ್ನು (ಕೊಟ್ಟೆ) ಕಟ್ಟಿ",
      "ಪ್ರತಿ ಮರದ ಬುಡಕ್ಕೆ ಬೇವಿನ ಹಿಂಡಿಯೊಂದಿಗೆ ಟ್ರೈಕೋಡರ್ಮ ಮಿಕ್ಸ್ ಮಾಡಿ ಮಣ್ಣಿಗೆ ಸೇರಿಸಿ"
    ]
  },
  {
    seasonEn: "South-West Monsoon Peak",
    seasonKn: "ಮುಂಗಾರು ಮಳೆಗಾಲ",
    monthsEn: "July - August",
    monthsKn: "ಜುಲೈ - ಆಗಸ್ಟ್",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    actionsEn: [
      "Second spray of 1% Bordeaux mixture or Metalaxyl-Mancozeb (2.5 g/L) during rain breaks",
      "Daily inspection of crowns for early Bud Rot (spindle yellowing); apply Mancozeb sachets",
      "Promptly collect and burn all fallen rotting nuts from the plantation floor"
    ],
    actionsKn: [
      "ಮಳೆ ಬಿಡುವು ನೀಡಿದ ದಿನಗಳಲ್ಲಿ 1% ಬೋರ್ಡೋ ದ್ರಾವಣ ಅಥವಾ ಮೆಟಲಾಕ್ಸಿಲ್-ಮ್ಯಾಂಕೋಜೆಬ್ ಎರಡನೇ ಸಿಂಪಡಣೆ",
      "ಸುಳಿ ಕೊಳೆ ರೋಗದ ಲಕ್ಷಣಗಳಿಗಾಗಿ ಸುಳಿಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ; ಶಿಲೀಂಧ್ರನಾಶಕ ಪೊಟ್ಟಣ ಇಡಿ",
      "ಉದುರಿದ ಕೊಳೆತ ಕಾಯಿಗಳನ್ನು ತಕ್ಷಣವೇ ಆಯ್ದು ತೋಟದಿಂದ ಹೊರಗೆ ಹಾಕಿ ಸುಟ್ಟು ಹಾಕಿ"
    ]
  },
  {
    seasonEn: "Post-Monsoon Nutrition",
    seasonKn: "ಹಿಂಗಾರು ಕಾಲ ಮತ್ತು ಪೋಷಣೆ",
    monthsEn: "September - November",
    monthsKn: "ಸೆಪ್ಟೆಂಬರ್ - ನವೆಂಬರ್",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    actionsEn: [
      "Third spray of Copper Oxychloride (3 g/L) or Bordeaux mixture if late rains persist",
      "Apply major annual fertilizer dose: 100g N (220g Urea), 40g P2O5 (200g Rock Phosphate), 140g K2O (230g MOP)",
      "Examine trunks for Stem Bleeding; chisel cracks and swab with hot coal tar or Bordeaux paste",
      "Spray Carbendazim (1 g/L) or Mancozeb (2 g/L) for foliar Leaf Spot prevention"
    ],
    actionsKn: [
      "ಮಳೆ ಮುಂದುವರಿದರೆ ಕಾಪರ್ ಆಕ್ಸಿಕ್ಲೋರೈಡ್ (3 ಗ್ರಾಂ/ಲೀ) ಮೂರನೇ ಸಿಂಪಡಣೆ ಮಾಡಿ",
      "ವಾರ್ಷಿಕ ಪ್ರಮುಖ ರಸಗೊಬ್ಬರ ಪ್ರಮಾಣ: 100 ಗ್ರಾಂ ಸಾರಜನಕ, 40 ಗ್ರಾಂ ರಂಜಕ, 140 ಗ್ರಾಂ ಪೊಟ್ಯಾಶ್ ನೀಡಿ",
      "ಕಾಂಡ ಸೋರುವಿಕೆಯನ್ನು ಪರೀಕ್ಷಿಸಿ; ಗಾಯಗಳನ್ನು ಹೆರೆದು ಬೋರ್ಡೋ ಪೇಸ್ಟ್ ಅಥವಾ ಕೋಲ್ಟಾರ್ ಹಚ್ಚಿ",
      "ಎಲೆ ಚುಕ್ಕೆ ರೋಗ ತಡೆಗಟ್ಟಲು ಕಾರ್ಬೆಂಡಾಜಿಮ್ (1 ಗ್ರಾಂ/ಲೀ) ಸಿಂಪಡಿಸಿ"
    ]
  },
  {
    seasonEn: "Summer Irrigation & Protection",
    seasonKn: "ಬೇಸಿಗೆ ನಿರ್ವಹಣೆ ಮತ್ತು ನೀರಾವರಿ",
    monthsEn: "December - April",
    monthsKn: "ಡಿಸೆಂಬರ್ - ಏಪ್ರಿಲ್",
    badge: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    actionsEn: [
      "Irrigate palms at 150-200 liters per palm every 5-7 days; adopt drip irrigation",
      "Mulch basins with dry areca leaves or organic waste (10-15 cm) to preserve moisture",
      "White-wash trunks with 10% lime to protect young palms against southwestern sunscorch",
      "Spray Dimethoate (1.5 ml/L) or Neem oil (3%) for mites and pentatomid bugs"
    ],
    actionsKn: [
      "ಪ್ರತಿ 5-7 ದಿನಗಳಿಗೊಮ್ಮೆ ಮರಕ್ಕೆ 150-200 ಲೀಟರ್ ನೀರು ನೀಡಿ ಅಥವಾ ಹನಿ ನೀರಾವರಿ ಬಳಸಿ",
      "ತೇವಾಂಶ ಉಳಿಸಲು ಮರದ ಬುಡಕ್ಕೆ ಒಣ ಎಲೆಗಳು ಅಥವಾ ಕೃಷಿ ತ್ಯಾಜ್ಯಗಳಿಂದ ಹೊದಿಕೆ (ಮಲ್ಚಿಂಗ್) ಹಾಕಿ",
      "ಬಿಸಿಲಿನ ತಾಪದಿಂದ ಕಾಂಡ ಬಿರಿಯುವುದನ್ನು ತಪ್ಪಿಸಲು ಕಾಂಡಕ್ಕೆ ಸುಣ್ಣ ಬಳಿಯಿರಿ",
      "ನುಶಿ ಮತ್ತು ತಿಗಣೆ ಕೀಟಗಳ ನಿಯಂತ್ರಣಕ್ಕೆ ಬೇವಿನ ಎಣ್ಣೆ (3%) ಸಿಂಪಡಿಸಿ"
    ]
  }
];

export const Solutions: React.FC = () => {
  const { lang, t } = useLanguage();
  const [selectedDisease, setSelectedDisease] = useState<string>("all");

  const downloadCalendarIcs = () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ArecaAI//Seasonal Calendar//EN",
      "BEGIN:VEVENT",
      "SUMMARY:ArecaAI: Pre-Monsoon Bordeaux Spray Reminder",
      "DESCRIPTION:Apply 1% Bordeaux mixture on all developing areca bunches.",
      "DTSTART:20260525T080000Z",
      "DTEND:20260525T110000Z",
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "SUMMARY:ArecaAI: Monsoon Phytophthora Monitoring & 2nd Spray",
      "DESCRIPTION:Inspect crown buds and spray Metalaxyl-Mancozeb during rain break.",
      "DTSTART:20260715T080000Z",
      "DTEND:20260715T110000Z",
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ArecaAI_Annual_Spray_Calendar.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-500/30">
          <Calendar className="w-3.5 h-3.5" />
          <span>{t("Agronomic Prescription & Annual Schedule", "ಕೃಷಿ ಪರಿಹಾರಗಳು ಮತ್ತು ವಾರ್ಷಿಕ ವೇಳಾಪಟ್ಟಿ")}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {t("Solutions & Seasonal Spray Calendar", "ರೋಗ ಪರಿಹಾರಗಳು ಮತ್ತು ಸಿಂಪಡಣೆ ಕ್ಯಾಲೆಂಡರ್")}
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          {t(
            "Evidence-based disease prescriptions balancing organic bio-control agents and chemical fungicides, mapped to Karnataka's coastal and Malnad monsoon cycles.",
            "ಕರ್ನಾಟಕದ ಮಲೆನಾಡು ಮತ್ತು ಕರಾವಳಿ ಹವಾಮಾನಕ್ಕೆ ಅನುಗುಣವಾದ ಸಾವಯವ ಜೈವಿಕ ನಿಯಂತ್ರಣ ಹಾಗೂ ಶಿಲೀಂಧ್ರನಾಶಕಗಳ ಸಮಗ್ರ ವೇಳಾಪಟ್ಟಿ."
          )}
        </p>
      </div>

      {/* Seasonal Spray Calendar Section */}
      <div className="bg-zinc-900/80 rounded-3xl p-6 sm:p-10 border border-zinc-800 space-y-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{t("Karnataka Monsoonal Schedule", "ಕರ್ನಾಟಕದ ಮುಂಗಾರು-ಹಿಂಗಾರು ವೇಳಾಪಟ್ಟಿ")}</span>
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-1">
              {t("4-Season Plantation Protection Protocol", "4 ಕಾಲಗಳ ಬೆಳೆ ಸಂರಕ್ಷಣಾ ಕ್ಯಾಲೆಂಡರ್")}
            </h2>
          </div>

          <button
            type="button"
            onClick={downloadCalendarIcs}
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{t("Download Calendar (.ics)", "ಕ್ಯಾಲೆಂಡರ್ ಡೌನ್‌ಲೋಡ್ (.ics)")}</span>
          </button>
        </div>

        {/* 4 Seasons Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SEASONS.map((s, idx) => (
            <div
              key={idx}
              className="bg-zinc-950/70 rounded-2xl p-6 border border-zinc-800/80 space-y-4 hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {lang === "kn" ? s.seasonKn : s.seasonEn}
                  </h3>
                  <span className="text-xs text-zinc-400 font-medium">
                    {lang === "kn" ? s.monthsKn : s.monthsEn}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${s.badge}`}>
                  Stage {idx + 1}
                </span>
              </div>

              <ul className="space-y-2 text-xs text-zinc-300">
                {(lang === "kn" ? s.actionsKn : s.actionsEn).map((act, aIdx) => (
                  <li key={aIdx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Disease Remediation Master Matrix */}
      <div className="bg-zinc-900/80 rounded-3xl p-6 sm:p-10 border border-zinc-800 space-y-6 shadow-xl">
        <div className="border-b border-zinc-800 pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("Integrated Pest & Disease Management", "ಸಮಗ್ರ ರೋಗ ನಿಯಂತ್ರಣ")}</span>
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-1">
            {t("Organic vs. Chemical Remedies by Condition", "ರೋಗವಾರು ಸಾವಯವ ಮತ್ತು ರಾಸಾಯನಿಕ ಪರಿಹಾರಗಳು")}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Koleroga */}
          <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {t("Koleroga / Mahali", "ಕೊಳೆರೋಗ / ಮಹಾಲಿ")}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Critical
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5" /> {t("Organic / Cultural", "ಸಾವಯವ:")}
              </span>
              <p className="text-zinc-300">
                {t(
                  "Polythene bunch covers (200-gauge) tied before monsoon. Clean plantation basins and burn fallen rotten nuts.",
                  "ಮುಂಗಾರು ಪೂರ್ವದಲ್ಲಿ 200 ಗೇಜ್ ಪ್ಲಾಸ್ಟಿಕ್ ಚೀಲ (ಕೊಟ್ಟೆ) ಕಟ್ಟಿ. ಉದುರಿದ ಕೊಳೆತ ಕಾಯಿಗಳನ್ನು ಆಯ್ದು ಸುಟ್ಟು ಹಾಕಿ."
                )}
              </p>
            </div>
            <div className="space-y-2 text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <FlaskConical className="w-3.5 h-3.5" /> {t("Chemical Fungicides", "ರಾಸಾಯನಿಕ:")}
              </span>
              <p className="text-zinc-300">
                {t(
                  "1% Bordeaux mixture prophylactic spray. Curative: Metalaxyl-Mancozeb (2.5 g/L) or Fosetyl-Al (2 g/L).",
                  "1% ಬೋರ್ಡೋ ದ್ರಾವಣ ಮುನ್ನೆಚ್ಚರಿಕೆ ಸಿಂಪಡಣೆ. ನಂತರ ಮೆಟಲಾಕ್ಸಿಲ್-ಮ್ಯಾಂಕೋಜೆಬ್ (2.5 ಗ್ರಾಂ/ಲೀ) ಸಿಂಪಡಿಸಿ."
                )}
              </p>
            </div>
          </div>

          {/* Yellow Leaf Disease */}
          <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {t("Yellow Leaf Disease", "ಹಳದಿ ಎಲೆ ರೋಗ")}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                High
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5" /> {t("Organic / Cultural", "ಸಾವಯವ:")}
              </span>
              <p className="text-zinc-300">
                {t(
                  "Apply 500g lime/dolomite to reduce acidity. Grow green manure crops and intercrop with banana or cocoa.",
                  "ಆಮ್ಲೀಯತೆ ಕಡಿಮೆ ಮಾಡಲು 500 ಗ್ರಾಂ ಸುಣ್ಣ ಅಥವಾ ಡಾಲೋಮೈಟ್ ಹಾಕಿ. ಹಸಿರೆಲೆ ಗೊಬ್ಬರ ಮತ್ತು ಮಿಶ್ರಬೆಳೆ ಬೆಳೆಸಿ."
                )}
              </p>
            </div>
            <div className="space-y-2 text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <FlaskConical className="w-3.5 h-3.5" /> {t("Chemical Fungicides", "ರಾಸಾಯನಿಕ:")}
              </span>
              <p className="text-zinc-300">
                {t(
                  "Imidacloprid 17.8 SL (0.5 ml/L) to control plant hopper vectors. Root feeding with Oxytetracycline (500 ppm).",
                  "ಕೀಟ ನಿಯಂತ್ರಣಕ್ಕೆ ಇಮಿಡಾಕ್ಲೋಪ್ರಿಡ್ (0.5 ಮಿ.ಲೀ/ಲೀ) ಸಿಂಪಡಿಸಿ. ಬೇರಿಗೆ ಆಕ್ಸಿಟೆಟ್ರಾಸೈಕ್ಲಿನ್ (500 ppm) ನೀಡಿ."
                )}
              </p>
            </div>
          </div>

          {/* Bud Rot */}
          <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {t("Bud Rot (Kandakoradu)", "ಸುಳಿ ಕೊಳೆ ರೋಗ")}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Critical
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5" /> {t("Organic / Cultural", "ಸಾವಯವ:")}
              </span>
              <p className="text-zinc-300">
                {t(
                  "Scoop out diseased crown tissue gently; coat with 10% Bordeaux paste and protect crown with pot/cone.",
                  "ಕೊಳೆತ ಸುಳಿಯ ಭಾಗವನ್ನು ಸ್ವಚ್ಛಗೊಳಿಸಿ 10% ಬೋರ್ಡೋ ಪೇಸ್ಟ್ ಹಚ್ಚಿ ಮತ್ತು ಸುಳಿಗೆ ಮಡಕೆ ಅಥವಾ ಕೋನ್ ಮುಚ್ಚಿ."
                )}
              </p>
            </div>
            <div className="space-y-2 text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <FlaskConical className="w-3.5 h-3.5" /> {t("Chemical Fungicides", "ರಾಸಾಯನಿಕ:")}
              </span>
              <p className="text-zinc-300">
                {t(
                  "Place 5g Mancozeb perforated sachets in leaf axils. Drench crown with Copper Oxychloride (3 g/L).",
                  "ಎಲೆ ಸಂದಿನಲ್ಲಿ 5 ಗ್ರಾಂ ಮ್ಯಾಂಕೋಜೆಬ್ ಪೊಟ್ಟಣ ಇಡಿ. ಸುಳಿಗೆ ಕಾಪರ್ ಆಕ್ಸಿಕ್ಲೋರೈಡ್ (3 ಗ್ರಾಂ/ಲೀ) ಸುರಿಯಿರಿ."
                )}
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
