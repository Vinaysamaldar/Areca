import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Download,
  Smartphone,
  Cpu,
  ShieldCheck,
  WifiOff,
  Zap,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

export const AppDownload: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-500/30">
          <Smartphone className="w-3.5 h-3.5" />
          <span>{t("Offline Edge Intelligence • Zero Cellular Needed", "ಆಫ್‌ಲೈನ್ ಮೊಬೈಲ್ ತಂತ್ರಜ್ಞಾನ • ಇಂಟರ್ನೆಟ್ ಅಗತ್ಯವಿಲ್ಲ")}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {t("Download ArecaAI Android App", "ಆಂಡ್ರಾಯ್ಡ್ ಆಪ್ ಡೌನ್‌ಲೋಡ್")}
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          {t(
            "Deploy quantized MobileNetV2 directly onto farmers' smartphones for instant on-device diagnosis deep in remote valleys with zero network coverage.",
            "ನೆಟ್‌ವರ್ಕ್ ಇಲ್ಲದ ದೂರದ ತೋಟಗಳಲ್ಲಿಯೂ ಕ್ಷಣಾರ್ಧದಲ್ಲಿ ಅಡಿಕೆ ರೋಗಗಳನ್ನು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಪತ್ತೆಹಚ್ಚಲು ಮೊಬೈಲ್ ಆಪ್ ಬಳಸಿ."
          )}
        </p>

        {/* APK Download Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/download-apk"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-emerald-950 transition-all hover:scale-105 active:scale-95"
          >
            <Download className="w-5 h-5" />
            <span>{t("Download APK (v1.0.0 Release)", "ಆಪ್ ಡೌನ್‌ಲೋಡ್ (APK v1.0.0)")}</span>
          </a>
        </div>
      </div>

      {/* 4 Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <WifiOff className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">{t("100% Offline Inference", "ಸಂಪೂರ್ಣ ಆಫ್‌ಲೈನ್")}</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {t("Runs TFLite quantized weights on mobile neural processors without internet.", "ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವಿಲ್ಲದೆಯೂ ಮೊಬೈಲ್‌ನಲ್ಲಿಯೇ ರೋಗ ಪತ್ತೆ ಮಾಡುತ್ತದೆ.")}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">{t("Sub-50ms Frame Rate", "ಅತ್ಯಂತ ವೇಗದ ವಿಶ್ಲೇಷಣೆ")}</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {t("Real-time camera bounding box tracking and instant confidence readout.", "ಕ್ಯಾಮರಾ ಮೂಲಕ ತಕ್ಷಣದ ನಿಖರ ಫಲಿತಾಂಶವನ್ನು ಒದಗಿಸುತ್ತದೆ.")}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">{t("Plant-Only Guardrails", "ಕೇವಲ ಅಡಿಕೆ ಗಿಡ ಮಾತ್ರ")}</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {t("Rejects accidental human faces, fingers, or clutter with clear error prompts.", "ಮನುಷ್ಯರ ಮುಖ ಅಥವಾ ಇತರ ಚಿತ್ರಗಳನ್ನು ತಿರಸ್ಕರಿಸಿ ತಪ್ಪು ರೋಗ ನಿರ್ಣಯ ತಡೆಯುತ್ತದೆ.")}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">{t("Lightweight 14MB APK", "ಕೇವಲ 14MB ಗಾತ್ರ")}</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {t("Optimized for entry-level Android devices running Android 7.0 and up.", "ಎಲ್ಲಾ ರೀತಿಯ ಸಾಮಾನ್ಯ ಆಂಡ್ರಾಯ್ಡ್ ಮೊಬೈಲ್‌ಗಳಲ್ಲಿ ಸುಲಭವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ.")}
          </p>
        </div>
      </div>

    </div>
  );
};
