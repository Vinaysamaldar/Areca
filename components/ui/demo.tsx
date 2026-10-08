import React from "react";
import { AnimatedTabs } from "@/components/ui/animated-tabs";

const AnimatedTabsDemo = () => {
  return (
    <div className="w-full flex justify-center items-center py-8 px-4 bg-gradient-to-br from-slate-950 via-zinc-900 to-emerald-950 min-h-screen">
      <div className="flex flex-col items-center gap-4 max-w-3xl w-full">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            ArecaCare Plant Part Explorer
          </h1>
          <p className="text-sm text-gray-400">
            Intelligent multi-organ disease classification & treatment advisory
          </p>
        </div>
        <AnimatedTabs />
      </div>
    </div>
  );
};

export { AnimatedTabsDemo };
