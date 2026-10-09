import React from 'react';
import { ParallaxComponent } from '@/components/ui/parallax-scrolling';

export default function ParallaxDemo() {
  return (
    <div className="min-h-screen bg-[#070b09] text-white">
      <ParallaxComponent />
      <div className="osmo-credits py-8 text-center text-sm text-zinc-400">
        <p className="osmo-credits__p">
          Resource by{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.osmo.supply/"
            className="osmo-credits__p-a text-emerald-400 underline hover:text-emerald-300 transition-colors"
          >
            Osmo
          </a>
        </p>
      </div>
    </div>
  );
}
