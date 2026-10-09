import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { Leaf, GraduationCap, ShieldCheck } from "lucide-react";

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 text-zinc-400 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Col 1: Branding */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold text-white">ArecaAI</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
            {t(
              "Precision agricultural diagnostic platform for Arecanut (Areca catechu) plantations. Powered by MobileNetV2 transfer learning, multi-spectral vegetation indices, and localized agronomic advisories.",
              "ಅಡಿಕೆ ಕೃಷಿಗಾಗಿ ನಿಖರವಾದ ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಆಧಾರಿತ ರೋಗ ಪತ್ತೆ ಮತ್ತು ಪರಿಹಾರ ವೇದಿಕೆ. ಮೊಬೈಲ್ ನೆಟ್ V2 ಮತ್ತು ಬಹು-ಸ್ಪೆಕ್ಟ್ರಲ್ ಸೂಚ್ಯಂಕಗಳ ಮೂಲಕ ರೈತರಿಗೆ ತಕ್ಷಣದ ನೆರವು."
            )}
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{t("Verified for Karnataka Malnad & Coastal Belts", "ಕರ್ನಾಟಕದ ಮಲೆನಾಡು ಮತ್ತು ಕರಾವಳಿ ಭಾಗಗಳಿಗೆ ಸೂಕ್ತ")}</span>
          </div>
        </div>

        {/* Col 2: Navigation Links */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            {t("Navigation", "ಪುಟಗಳು")}
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/" className="hover:text-emerald-400 transition-colors">{t("Home Scanner", "ಮುಖಪುಟ ಸ್ಕ್ಯಾನರ್")}</Link></li>
            <li><a href="/#scanner" className="hover:text-emerald-400 transition-colors">{t("Instant Disease Diagnosis", "ತಕ್ಷಣದ ರೋಗ ಪರೀಕ್ಷೆ")}</a></li>
          </ul>
        </div>

        {/* Col 3: Academic Credit */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>{t("Project & Guide", "ಯೋಜನೆ ಮತ್ತು ಮಾರ್ಗದರ್ಶಕರು")}</span>
          </h4>
          <p className="text-xs text-zinc-400">
            {t("Department of Computer Science & Engineering", "ಕಂಪ್ಯೂಟರ್ ಸೈನ್ಸ್ & ಎಂಜಿನಿಯರಿಂಗ್ ವಿಭಾಗ")}
          </p>
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-[10px] text-emerald-400 font-bold block">{t("Project Guide", "ಮಾರ್ಗದರ್ಶಕರು")}</span>
            <span className="font-semibold text-zinc-200">Prof. Vinutha H R</span>
            <span className="text-[11px] text-zinc-400 block mt-1">{t("Student Team", "ವಿದ್ಯಾರ್ಥಿ ತಂಡ")}: Gurunath, Ganesh, Sadashiv, Vinayaka</span>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-zinc-900 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} ArecaAI Precision Agriculture. {t("All rights reserved.", "ಎಲ್ಲಾ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.")}
      </div>
    </footer>
  );
};
