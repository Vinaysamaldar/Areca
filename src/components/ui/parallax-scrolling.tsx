'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { Camera, ChevronDown, Sparkles } from 'lucide-react';

export interface ParallaxComponentProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  ctaText?: string;
  ctaHref?: string;
  layer1Image?: string;
  layer2Image?: string;
  layer4Image?: string;
  children?: React.ReactNode;
}

export function ParallaxComponent({
  title = "ArecaAI",
  subtitle = "Precision Agricultural Disease Detection for Arecanut Palms",
  badge = "MobileNetV2 CNN • Multi-Spectral Pathology",
  ctaText = "Instant Crop Scanner",
  ctaHref = "#scanner",
  layer1Image = "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1920&q=80",
  layer2Image = "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1920&q=80",
  layer4Image = "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1920&q=80",
  children
}: ParallaxComponentProps) {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const triggerElement = parallaxRef.current?.querySelector('[data-parallax-layers]');

    if (triggerElement) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerElement,
          start: "0% 0%",
          end: "100% 0%",
          scrub: 0
        }
      });

      const layers = [
        { layer: "1", yPercent: 70 },
        { layer: "2", yPercent: 55 },
        { layer: "3", yPercent: 40 },
        { layer: "4", yPercent: 10 }
      ];

      layers.forEach((layerObj, idx) => {
        tl.to(
          triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
          {
            yPercent: layerObj.yPercent,
            ease: "none"
          },
          idx === 0 ? undefined : "<"
        );
      });
    }

    const lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      if (triggerElement) {
        gsap.killTweensOf(triggerElement);
      }
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="parallax relative w-full overflow-hidden" ref={parallaxRef}>
      {/* 3D Multi-Layer Parallax Header */}
      <section className="parallax__header relative w-full h-[85vh] sm:h-[92vh] min-h-[580px] overflow-hidden bg-zinc-950">
        <div className="parallax__visuals relative w-full h-full overflow-hidden">
          <div className="parallax__black-line-overflow absolute top-0 left-0 w-full h-[2px] bg-transparent z-10 pointer-events-none"></div>

          <div data-parallax-layers className="parallax__layers relative w-full h-full overflow-hidden">
            {/* Layer 1: Background Canopy */}
            <img
              src={layer1Image}
              loading="eager"
              width="1920"
              data-parallax-layer="1"
              alt="Background plantation canopy"
              className="parallax__layer-img absolute inset-0 w-full h-full object-cover pointer-events-none brightness-75 contrast-110"
            />

            {/* Layer 2: Palm Grove Midground */}
            <img
              src={layer2Image}
              loading="eager"
              width="1920"
              data-parallax-layer="2"
              alt="Midground palm groves"
              className="parallax__layer-img absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80 mix-blend-screen"
            />

            {/* Layer 3: Title and Interactive Call to Action */}
            <div
              data-parallax-layer="3"
              className="parallax__layer-title absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-20 pointer-events-auto"
            >
              {badge && (
                <div className="inline-flex items-center space-x-2 bg-emerald-950/80 backdrop-blur-md text-emerald-400 text-xs font-bold px-4 py-1.5 rounded-full border border-emerald-500/40 shadow-xl mb-4 animate-in fade-in duration-500">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>{badge}</span>
                </div>
              )}

              <h1 className="parallax__title text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-white uppercase drop-shadow-[0_15px_35px_rgba(0,0,0,0.9)]">
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                  {title}
                </span>
              </h1>

              {subtitle && (
                <p className="mt-4 max-w-2xl text-sm sm:text-base md:text-lg text-zinc-200 font-medium drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] px-4">
                  {subtitle}
                </p>
              )}

              {ctaText && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={ctaHref}
                    className="inline-flex items-center space-x-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-2xl shadow-emerald-950 transition-all hover:scale-105 active:scale-95"
                  >
                    <Camera className="w-5 h-5" />
                    <span>{ctaText}</span>
                  </a>
                </div>
              )}
            </div>

            {/* Layer 4: Foreground Lush Fronds */}
            <img
              src={layer4Image}
              loading="eager"
              width="1920"
              data-parallax-layer="4"
              alt="Foreground palm leaves"
              className="parallax__layer-img absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85 contrast-125"
            />
          </div>

          {/* Smooth Fade Transition into Page Content */}
          <div className="parallax__fade absolute bottom-0 left-0 w-full h-44 sm:h-56 bg-gradient-to-t from-[#070b09] via-[#070b09]/80 to-transparent pointer-events-none z-20 flex items-end justify-center pb-6">
            <a
              href="#scanner"
              className="text-emerald-400 hover:text-emerald-300 transition-colors pointer-events-auto animate-bounce flex flex-col items-center gap-1 text-xs font-semibold"
            >
              <span>Scroll to Scanner</span>
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Optional Body Content Container */}
      {children && (
        <section className="parallax__content relative bg-[#070b09]">
          {children}
        </section>
      )}
    </div>
  );
}

export default ParallaxComponent;
