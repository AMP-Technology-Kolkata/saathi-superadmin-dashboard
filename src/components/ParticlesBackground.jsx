"use client";

import { useCallback } from "react";
import { Particles } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function ParticlesBackground() {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: false },
        background: { color: "transparent" },
        fpsLimit: 60,
        particles: {
          number: {
            value: 60,
            density: { enable: true, area: 800 },
          },
          color: { value: "#999999" },
          shape: { type: "circle" },
          opacity: { value: 0.5 },
          size: { value: { min: 1, max: 3 } },
          move: {
            enable: true,
            speed: 1,
            direction: "none",
            outModes: { default: "out" },
          },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: "repulse" },
            resize: true,
          },
          modes: { repulse: { distance: 100, duration: 0.4 } },
        },
        detectRetina: true,
      }}
      className="absolute inset-0 z-0"
    />
  );
}
