'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

export interface ParallaxComponentProps {
  title?: string;
  layer1Image?: string;
  layer2Image?: string;
  layer4Image?: string;
}

export function ParallaxComponent({
  title = "Parallax",
  layer1Image = "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1600&q=80",
  layer2Image = "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80",
  layer4Image = "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1600&q=80"
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
      // Clean up GSAP and ScrollTrigger instances
      ScrollTrigger.getAll().forEach(st => st.kill());
      if (triggerElement) {
        gsap.killTweensOf(triggerElement);
      }
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="parallax relative w-full" ref={parallaxRef}>
      <section className="parallax__header relative w-full h-screen min-h-[600px] overflow-hidden">
        <div className="parallax__visuals relative w-full h-full overflow-hidden">
          <div className="parallax__black-line-overflow absolute top-0 left-0 w-full h-[2px] bg-transparent z-10"></div>
          <div data-parallax-layers className="parallax__layers relative w-full h-full overflow-hidden">
            <img
              src={layer1Image}
              loading="eager"
              width="1600"
              data-parallax-layer="1"
              alt="Background layer"
              className="parallax__layer-img absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
            />
            <img
              src={layer2Image}
              loading="eager"
              width="1600"
              data-parallax-layer="2"
              alt="Midground layer"
              className="parallax__layer-img absolute top-0 left-0 w-full h-full object-cover pointer-events-none opacity-85"
            />
            <div
              data-parallax-layer="3"
              className="parallax__layer-title absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
            >
              <h2 className="parallax__title text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-white uppercase drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                {title}
              </h2>
            </div>
            <img
              src={layer4Image}
              loading="eager"
              width="1600"
              data-parallax-layer="4"
              alt="Foreground layer"
              className="parallax__layer-img absolute top-0 left-0 w-full h-full object-cover pointer-events-none opacity-90"
            />
          </div>
          <div className="parallax__fade absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[#070b09] to-transparent pointer-events-none z-20"></div>
        </div>
      </section>
      <section className="parallax__content relative py-20 px-6 flex justify-center items-center bg-[#070b09]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          viewBox="0 0 160 160"
          fill="none"
          className="osmo-icon-svg max-w-[120px] max-h-[120px] text-emerald-400"
        >
          <path
            d="M94.8284 53.8578C92.3086 56.3776 88 54.593 88 51.0294V0H72V59.9999C72 66.6273 66.6274 71.9999 60 71.9999H0V87.9999H51.0294C54.5931 87.9999 56.3777 92.3085 53.8579 94.8283L18.3431 130.343L29.6569 141.657L65.1717 106.142C67.684 103.63 71.9745 105.396 72 108.939V160L88.0001 160L88 99.9999C88 93.3725 93.3726 87.9999 100 87.9999H160V71.9999H108.939C105.407 71.9745 103.64 67.7091 106.12 65.1938L106.142 65.1716L141.657 29.6568L130.343 18.3432L94.8284 53.8578Z"
            fill="currentColor"
          ></path>
        </svg>
      </section>
    </div>
  );
}

export default ParallaxComponent;
