import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { AlertTriangle, Home } from "lucide-react";

export const NotFound: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        
        <div>
          <span className="text-4xl sm:text-5xl font-black text-white block">404</span>
          <h2 className="text-xl font-bold text-zinc-100 mt-2">
            {t("Page Not Found", "ಪುಟ ಕಂಡುಬಂದಿಲ್ಲ")}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2">
            {t(
              "The requested URL could not be found on ArecaAI. Please check the address or return to the scanner.",
              "ನೀವು ಹುಡುಕುತ್ತಿರುವ ವೆಬ್ ಪುಟ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ವಿಳಾಸವನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ."
            )}
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-6 py-3 rounded-xl text-sm shadow transition-all active:scale-95"
        >
          <Home className="w-4 h-4" />
          <span>{t("Back to Home Scanner", "ಮುಖಪುಟ ಸ್ಕ್ಯಾನರ್‌ಗೆ ಹಿಂತಿರುಗಿ")}</span>
        </Link>
      </div>
    </div>
  );
};
