"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

const COLORS = ["#ec4899", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#14b8a6"];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function ConfettiBurst({ active, onDone }: { active: boolean; onDone?: () => void }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;
    const ps: Particle[] = Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: randomBetween(5, 95),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: randomBetween(0, 0.4),
      duration: randomBetween(1.0, 1.8),
      size: randomBetween(6, 11),
      rotation: randomBetween(0, 360),
    }));
    setParticles(ps);
    const timeout = setTimeout(() => {
      setParticles([]);
      onDone?.();
    }, 2200);
    return () => clearTimeout(timeout);
  }, [active, onDone]);

  if (!particles.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-50" aria-hidden>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(120px) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s both`,
            // @ts-expect-error custom CSS var
            "--rot": `${p.rotation}deg`,
          }}
        />
      ))}
    </div>
  );
}
