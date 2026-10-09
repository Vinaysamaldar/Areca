import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Solutions } from "./pages/Solutions";
import { Analytics } from "./pages/Analytics";
import { Diseases } from "./pages/Diseases";
import { History } from "./pages/History";
import { AppDownload } from "./pages/AppDownload";
import { NotFound } from "./pages/NotFound";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-[#070b09] text-gray-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
          <Navbar />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/solutions" element={<Solutions />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/diseases" element={<Diseases />} />
              <Route path="/history" element={<History />} />
              <Route path="/app" element={<AppDownload />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </LanguageProvider>
  );
}
