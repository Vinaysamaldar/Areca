"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface AnimatedTabsProps {
  tabs?: Tab[];
  defaultTab?: string;
  className?: string;
}

const defaultTabs: Tab[] = [
  {
    id: "leaf",
    label: "Leaf Diagnosis",
    content: (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80"
          alt="Arecanut Leaf Examination"
          className="rounded-lg w-full h-60 object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />

        <div className="flex flex-col gap-y-2 justify-center">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 w-fit">
            <span>🌿 Foliage Health</span>
          </div>
          <h2 className="text-2xl font-bold mb-0 text-white mt-0 !m-0">
            Yellow Leaf & Blight Scan
          </h2>
          <p className="text-sm text-gray-200 mt-0">
            Detects Yellow Leaf Disease (YLD), leaf spot, and necrotic lesions
            using multi-spectral green-excess segmentation algorithms.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "nut",
    label: "Nut / Fruit Rot",
    content: (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80"
          alt="Areca Nut Bunches"
          className="rounded-lg w-full h-60 object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />
        <div className="flex flex-col gap-y-2 justify-center">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 w-fit">
            <span>🥥 Yield Protection</span>
          </div>
          <h2 className="text-2xl font-bold mb-0 text-white mt-0 !m-0">
            Koleroga (Mahali) Early Detection
          </h2>
          <p className="text-sm text-gray-200 mt-0">
            Identifies fungal fruit rot water-soaked lesions early before premature
            nut drop occurs, prompting immediate 1% Bordeaux mixture advisory.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "stem-root",
    label: "Stem & Root Health",
    content: (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80"
          alt="Palm Stem and Root Base"
          className="rounded-lg w-full h-60 object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />
        <div className="flex flex-col gap-y-2 justify-center">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 w-fit">
            <span>🪵 Basal Vascular Check</span>
          </div>
          <h2 className="text-2xl font-bold mb-0 text-white mt-0 !m-0">
            Stem Bleeding & Anabe Rot
          </h2>
          <p className="text-sm text-gray-200 mt-0">
            Analyzes basal stem exudates and root rot indicators to prevent
            structural tree collapse and fungal propagation through the soil.
          </p>
        </div>
      </div>
    ),
  },
];

const AnimatedTabs = ({
  tabs = defaultTabs,
  defaultTab,
  className,
}: AnimatedTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id);

  if (!tabs?.length) return null;

  return (
    <div className={cn("w-full max-w-2xl flex flex-col gap-y-2", className)}>
      <div className="flex gap-2 flex-wrap bg-[#11111198] bg-opacity-50 backdrop-blur-sm p-1.5 rounded-xl border border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium rounded-lg text-white outline-none transition-colors hover:text-emerald-300",
              activeTab === tab.id ? "text-white font-semibold" : "text-gray-300"
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-[#1e293bd1] bg-opacity-70 shadow-[0_0_20px_rgba(16,185,129,0.25)] border border-emerald-500/30 backdrop-blur-sm !rounded-lg"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-5 bg-[#11111198] shadow-[0_0_25px_rgba(0,0,0,0.35)] text-white bg-opacity-60 backdrop-blur-md rounded-2xl border border-white/10 min-h-64 h-full overflow-hidden">
        <AnimatePresence mode="wait">
          {tabs.map(
            (tab) =>
              activeTab === tab.id && (
                <motion.div
                  key={tab.id}
                  initial={{
                    opacity: 0,
                    scale: 0.96,
                    x: -12,
                    filter: "blur(10px)",
                  }}
                  animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.96, x: 12, filter: "blur(10px)" }}
                  transition={{
                    duration: 0.4,
                    ease: "circInOut",
                  }}
                >
                  {tab.content}
                </motion.div>
              )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export { AnimatedTabs };
