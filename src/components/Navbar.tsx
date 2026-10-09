import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import {
  Menu,
  X,
  Camera,
  Home,
  BookOpen,
  Calendar,
  Activity,
  History,
  Download,
  Leaf
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { lang, setLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", labelEn: "Home", labelKn: "ಮುಖಪುಟ", icon: Home },
    { to: "/solutions", labelEn: "Solutions & Calendar", labelKn: "ಚಿಕಿತ್ಸೆ ಮತ್ತು ಕ್ಯಾಲೆಂಡರ್", icon: Calendar },
    { to: "/analytics", labelEn: "Analytics", labelKn: "ವಿಶ್ಲೇಷಣೆ", icon: Activity },
    { to: "/diseases", labelEn: "Diseases", labelKn: "ರೋಗಗಳು", icon: BookOpen },
    { to: "/history", labelEn: "History", labelKn: "ಇತಿಹಾಸ", icon: History },
    { to: "/app", labelEn: "App", labelKn: "ಆಪ್", icon: Download }
  ];

  return (
    <>
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo & Branding */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Leaf className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <span className="block text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  ArecaAI
                </span>
                <span className="block text-[10px] sm:text-xs font-medium text-zinc-400 leading-none">
                  {t("Arecanut Disease Detection", "ಅಡಿಕೆ ರೋಗ ಪತ್ತೆ ಹಚ್ಚುವಿಕೆ")}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
              {navLinks.map((link) => {
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === "/"}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                        isActive
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-950"
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                      }`
                    }
                  >
                    <span>{lang === "kn" ? link.labelKn : link.labelEn}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Right Controls: Language & CTA */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              
              {/* Language Switcher */}
              <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    lang === "en"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang("kn")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    lang === "kn"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  ಕನ್ನಡ
                </button>
              </div>

              {/* Scan CTA */}
              <Link
                to="/#scanner"
                className="hidden sm:inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs lg:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-950 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>{t("Scan Plant", "ಗಿಡ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ")}</span>
              </Link>

              {/* Mobile Hamburger Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-zinc-800 space-y-2 animate-in slide-in-from-top duration-200">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === "/"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "text-zinc-300 hover:bg-zinc-900"
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 text-emerald-400" />
                    <span>{lang === "kn" ? link.labelKn : link.labelEn}</span>
                  </NavLink>
                );
              })}
            </div>
          )}

        </div>
      </header>

      {/* Mobile Bottom Dock Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 px-2 py-1.5 shadow-2xl">
        <div className="grid grid-cols-5 items-center text-center max-w-lg mx-auto">
          {navLinks.slice(0, 5).map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
                    isActive ? "text-emerald-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 truncate max-w-[60px]">
                  {lang === "kn" ? link.labelKn : link.labelEn}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
};
