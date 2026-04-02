"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ActiveTeamBar } from "../components/active-team-bar";

/* ── Lofi Music System ── */
function useLofiMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false); // Start unmuted for autoplay
  const [volume, setVolume] = useState(0.06); // Lower default volume

  useEffect(() => {
    // Create audio element on mount
    const audio = new Audio('/lofi-track.mp3');
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    // Attempt autoplay
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay was prevented, user needs to interact first
        setIsMuted(true);
      });
    }

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.play().catch(() => {});
      setIsMuted(false);
    } else {
      audio.pause();
      setIsMuted(true);
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  return { isMuted, toggleMute, volume, handleVolumeChange };
}

/* ── Sound Effects System ── */
function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSpinSound = useCallback(() => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);

    // Create continuous spinning whoosh
    const spinInterval = setInterval(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150 + Math.random() * 100, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    }, 80);

    setTimeout(() => clearInterval(spinInterval), 2800);
  }, [getAudioContext]);

  const playWinSound = useCallback((isDramatic = false) => {
    const ctx = getAudioContext();
    
    // Triumphant ascending notes
    const notes = isDramatic ? [523, 659, 784, 1047, 1319] : [523, 659, 784];
    const duration = isDramatic ? 0.25 : 0.15;
    
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      
      const startTime = ctx.currentTime + i * duration;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(isDramatic ? 0.5 : 0.35, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.02, startTime + duration * 1.5);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration * 1.5);
    });

    // Add shimmer for dramatic wins
    if (isDramatic) {
      for (let i = 0; i < 8; i++) {
        const shimmer = ctx.createOscillator();
        const shimmerGain = ctx.createGain();
        shimmer.connect(shimmerGain);
        shimmerGain.connect(ctx.destination);
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(2000 + Math.random() * 2000, ctx.currentTime);
        const startTime = ctx.currentTime + 0.5 + i * 0.1;
        shimmerGain.gain.setValueAtTime(0.08, startTime);
        shimmerGain.gain.exponentialRampToValueAtTime(0.002, startTime + 0.2);
        shimmer.start(startTime);
        shimmer.stop(startTime + 0.2);
      }
    }
  }, [getAudioContext]);

  const playLoseSound = useCallback(() => {
    const ctx = getAudioContext();
    
    // Descending disappointed notes
    const notes = [392, 330, 262];
    
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      
      const startTime = ctx.currentTime + i * 0.12;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.02, startTime + 0.2);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.25);
    });
  }, [getAudioContext]);

  return { playSpinSound, playWinSound, playLoseSound };
}

type Character = {
  id: "birb" | "pip" | "toobins" | "zen";
  name: string;
  image: string;
  tint: string;
  glow: string;
};

const CHARACTERS: Character[] = [
  { id: "birb", name: "Birb", image: "/bird.png", tint: "from-[#5a3f34]/85 via-[#724d3b]/65 to-[#1b130f]/95", glow: "shadow-[0_0_40px_rgba(182,146,114,0.22)]" },
  { id: "pip", name: "Pip", image: "/pip.png", tint: "from-[#6e4a37]/85 via-[#8b5a40]/65 to-[#1d130f]/95", glow: "shadow-[0_0_40px_rgba(220,164,128,0.22)]" },
  { id: "toobins", name: "Toobins", image: "/toobins.png", tint: "from-[#655042]/85 via-[#7d6451]/65 to-[#1e1712]/95", glow: "shadow-[0_0_40px_rgba(207,188,165,0.22)]" },
  { id: "zen", name: "Zen", image: "/zen.png", tint: "from-[#704534]/85 via-[#92563f]/65 to-[#1b120d]/95", glow: "shadow-[0_0_40px_rgba(226,158,114,0.22)]" },
];

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

function CharacterArt({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={className} />;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -8 * t);
}

type LogEntry = {
  picks: string[];
  landed: string;
  result: "hit" | "miss";
  goldEarned: string; // e.g. "+4.40x" or "0"
  deposit: number;
};

/* ── Share Modal Component ── */
function ShareModal({ 
  isOpen, 
  onClose, 
  birbDeposit, 
  goldEarned, 
  riskLevel 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  birbDeposit: number; 
  goldEarned: number;
  riskLevel: "High" | "Medium" | "Low";
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);

  const riskColors = {
    High: { bg: "from-[#ffd700] to-[#ff8c00]", text: "text-[#ffd700]", label: "HIGH RISK" },
    Medium: { bg: "from-[#22c55e] to-[#16a34a]", text: "text-[#22c55e]", label: "MEDIUM RISK" },
    Low: { bg: "from-[#22c55e] to-[#15803d]", text: "text-[#22c55e]", label: "LOW RISK" },
  };

  const shareToTwitter = () => {
    const text = `Birbish AF! I just earned ${goldEarned.toLocaleString()} Gold on a ${riskLevel} Risk spin with ${birbDeposit.toLocaleString()} BIRB!`;
    const url = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const downloadImage = async () => {
    if (!cardRef.current) return;
    setCopying(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0604',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = 'birbish-win.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
    }
    setCopying(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1210] text-white/60 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Shareable Card */}
        <div
          ref={cardRef}
          className="overflow-hidden rounded-3xl border border-[#ffd700]/20 bg-black"
        >
          {/* Header with gold owl background */}
          <div className="relative px-8 pt-8 pb-6">
            {/* Gold owl background image */}
            <img 
              src="/images/birb-gold.jpg" 
              alt="" 
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
            />
            <div className="relative z-10">
              <div className={cn(
                "inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                `bg-gradient-to-r ${riskColors[riskLevel].bg} text-black`
              )}>
                {riskColors[riskLevel].label}
              </div>
              <h2 className="mt-4 font-heading text-5xl font-black tracking-tight text-white">
                Birbish AF
              </h2>
              <p className="mt-1 text-lg text-white/60">I struck GOLD on birb game</p>
            </div>
          </div>

          {/* Stats */}
          <div className="border-t border-[#ffd700]/10 bg-black px-8 py-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/40">BIRB Deposited</div>
                <div className="mt-1 font-heading text-3xl font-bold text-white">
                  {birbDeposit.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-white/40">Gold Earned</div>
                <div className={cn(
                  "mt-1 font-heading text-3xl font-bold",
                  riskLevel === "High" 
                    ? "bg-gradient-to-r from-[#ffd700] via-[#ffec8b] to-[#ffd700] bg-clip-text text-transparent"
                    : "text-[#22c55e]"
                )}>
                  +{goldEarned.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={downloadImage}
            disabled={copying}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#f0dcc6]/20 bg-[#1a1210] px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-[#2a1f1a] hover:text-white disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {copying ? "Saving..." : "Save Image"}
          </button>
          <button
            onClick={shareToTwitter}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1d9bf0] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1a8cd8]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Token Rain Animation for Legendary Wins ── */
function TokenRain({ isActive }: { isActive: boolean }) {
  const tokens = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
      size: 24 + Math.random() * 24,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 720,
    }));
  }, []);

  if (!isActive) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {tokens.map((token) => (
        <motion.div
          key={token.id}
          initial={{ 
            y: -100, 
            x: `${token.left}vw`,
            rotate: token.rotation,
            opacity: 0 
          }}
          animate={{ 
            y: '110vh',
            rotate: token.rotation + token.rotationSpeed,
            opacity: [0, 0.9, 0.9, 0]
          }}
          transition={{
            duration: token.duration,
            delay: token.delay,
            ease: 'linear',
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
          }}
          className="absolute"
          style={{ 
            left: 0,
            width: token.size,
            height: token.size,
          }}
        >
          <img 
            src="/images/birb-token.png" 
            alt="" 
            className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(255,200,100,0.5)]"
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ── Gold Rate Decay: day 1 = peak, day 28 = floor ── */
function getBaseGoldMultiplier(day: number): number {
  const floor = 0.35;
  const k = 0.038;
  return floor + (1 - floor) * Math.exp(-k * (day - 1));
}

function getGoldRateNum(picks: number, dayMultiplier: number): number {
  const baseRates: Record<number, number> = { 1: 4.40, 2: 2.05, 3: 1.20 };
  const base = baseRates[picks] || 1;
  return 1 + (base - 1) * dayMultiplier;
}

function getGoldRate(picks: number, dayMultiplier: number): string {
  return getGoldRateNum(picks, dayMultiplier).toFixed(2) + "x";
}

/* ── Deposit / Play State Machine ── */
type DepositPhase = "deposit" | "receiving" | "ready" | "spinning";

/* ── Day Decay Curve Visualization ── */
function DayDecayCurve({ currentDay }: { currentDay: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [circlePos, setCirclePos] = useState({ x: 0, y: 0 });

  const points = useMemo(() => {
    const pts: string[] = [];
    for (let d = 1; d <= 28; d++) {
      const x = ((d - 1) / 27) * 100;
      const y = (1 - getBaseGoldMultiplier(d)) * 100;
      pts.push(`${x},${y}`);
    }
    return pts.join(" ");
  }, []);

  const currentX = ((currentDay - 1) / 27) * 100;
  const currentY = (1 - getBaseGoldMultiplier(currentDay)) * 100;

  // Calculate actual pixel position for the circle overlay
  useEffect(() => {
    if (svgRef.current) {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      // Map viewBox coordinates to actual pixels
      const pixelX = (currentX / 100) * rect.width;
      const pixelY = ((currentY + 5) / 110) * rect.height; // Account for viewBox offset
      setCirclePos({ x: pixelX, y: pixelY });
    }
  }, [currentDay, currentX, currentY]);

  return (
    <div className="relative h-12 w-full">
      <svg ref={svgRef} viewBox="-2 -5 104 110" className="h-full w-full" preserveAspectRatio="none">
        <line x1="0" y1="0" x2="0" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        <line x1="100" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        <polyline points={points} fill="none" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <polyline points={`0,0 ${points} 100,${(1 - getBaseGoldMultiplier(28)) * 100} 100,100 0,100`} fill="url(#goldFill)" />
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d12429" />
            <stop offset="100%" stopColor="#ecd9ba" />
          </linearGradient>
          <linearGradient id="goldFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(209,36,41,0.12)" />
            <stop offset="100%" stopColor="rgba(209,36,41,0)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Circle indicator rendered as DOM element to maintain aspect ratio */}
      <div 
        className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d12429] shadow-[0_0_8px_rgba(209,36,41,0.6)]"
        style={{ left: circlePos.x, top: circlePos.y }}
      >
        <div className="absolute inset-[-4px] rounded-full border border-[#d12429]/40" />
      </div>
    </div>
  );
}

/* ── Prism Component ── */
function HoloPrism({
  landed,
  selected,
  rotationDeg,
  isSpinning,
  spinPhase,
  result,
  isDramaticWin,
  isGreenWin,
}: {
  landed: Character["id"];
  selected: Character["id"][];
  rotationDeg: number;
  isSpinning: boolean;
  spinPhase: "idle" | "spinning" | "done";
  result: "hit" | "miss" | null;
  isDramaticWin: boolean;
  isGreenWin: boolean;
}) {
  return (
    <div className="relative flex h-[34rem] w-full items-center justify-center overflow-hidden">
      <motion.div
        className={cn(
          "absolute h-[36rem] w-[36rem] rounded-full blur-3xl",
          isDramaticWin 
            ? "bg-[#ffd700]/45" 
            : isGreenWin 
              ? "bg-[#22c55e]/25" 
              : result === "miss" && spinPhase === "done" 
                ? "bg-[#dc2626]/20" 
                : "bg-[#7c5237]/20"
        )}
        animate={
          isDramaticWin 
            ? { scale: [1, 1.3, 1.1], opacity: [0.6, 1, 0.8] }
            : isGreenWin
              ? { scale: [1, 1.15, 1.05], opacity: [0.5, 0.85, 0.65] }
              : isSpinning 
                ? { scale: [1, 1.08, 1.02], opacity: [0.55, 0.82, 0.6] } 
                : { scale: 1, opacity: 0.55 }
        }
        transition={{ duration: isDramaticWin || isGreenWin ? 1.5 : 2.15, ease: [0.12, 0.82, 0.18, 1] }}
      />
      <motion.div
        className={cn(
          "absolute h-[24rem] w-[24rem] rounded-full blur-3xl",
          isDramaticWin 
            ? "bg-[#ffec8b]/35" 
            : isGreenWin 
              ? "bg-[#86efac]/15" 
              : result === "miss" && spinPhase === "done" 
                ? "bg-[#b91c1c]/15" 
                : "bg-[#d39a66]/10"
        )}
        animate={
          isDramaticWin
            ? { scale: [1, 1.4, 1.15], opacity: [0.4, 0.8, 0.5] }
            : isGreenWin
              ? { scale: [1, 1.25, 1.1], opacity: [0.35, 0.65, 0.45] }
              : isSpinning 
                ? { scale: [1, 1.16, 1.02], opacity: [0.3, 0.55, 0.32] } 
                : { scale: 1, opacity: 0.3 }
        }
        transition={{ duration: isDramaticWin || isGreenWin ? 1.5 : 2.15, ease: [0.12, 0.82, 0.18, 1] }}
      />
      
      {/* Dramatic win particles */}
      <AnimatePresence>
        {isDramaticWin && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-full bg-[#ffd700]"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 1, 
                  scale: 1 
                }}
                animate={{ 
                  x: Math.cos((i / 12) * Math.PI * 2) * 200,
                  y: Math.sin((i / 12) * Math.PI * 2) * 200,
                  opacity: 0,
                  scale: 0
                }}
                transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.05 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,242,226,0.12),transparent_16%),radial-gradient(circle_at_50%_86%,rgba(120,74,46,0.15),transparent_24%)]" />

      <AnimatePresence>
        {isSpinning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.28, 0.14, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.05, times: [0, 0.18, 0.56, 1] }}
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,245,233,0.18),transparent_24%)]"
          />
        )}
      </AnimatePresence>

      {/*
        3D Prism — each face is placed at rotateY(index * 90deg).
        Face 0 (Birb)    at   0° → faces viewer when container rotateY =   0°
        Face 1 (Pip)     at  90° → faces viewer when container rotateY = 270° (i.e. -90°)
        Face 2 (Toobins) at 180° → faces viewer when container rotateY = 180° (i.e. -180°)
        Face 3 (Zen)     at 270° → faces viewer when container rotateY =  90° (i.e. -270°)

        So to show face N to the viewer: container rotateY = (-N * 90) mod 360 = (360 - N*90) % 360
      */}
      <div className="relative flex items-center justify-center" style={{ perspective: "1700px" }}>
        <div
          className="relative h-[26rem] w-[26rem]"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${rotationDeg}deg)`,
          }}
        >
          {CHARACTERS.map((face, index) => {
            const angle = index * 90;
            const isSelected = selected.includes(face.id);
            const isLanded = landed === face.id && spinPhase === "done";

            return (
              <div
                key={face.id}
                className="absolute h-[19.5rem] w-[14.25rem]"
                style={{
                  top: "50%",
                  left: "50%",
                  marginTop: "-9.75rem",
                  marginLeft: "-7.125rem",
                  transform: `rotateY(${angle}deg) translateZ(120px)`,
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
              >
                <motion.div
                  animate={
                    isLanded ? { y: [-2, -12, -5], scale: [1, 1.04, 1.012] } : isSelected ? { y: [0, -3, 0] } : { y: 0 }
                  }
                  transition={isLanded ? { duration: 0.8, times: [0, 0.45, 1] } : isSelected ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                  className={cn(
                    "relative h-full w-full overflow-hidden rounded-[2rem] border bg-[linear-gradient(180deg,rgba(255,248,240,0.12),rgba(255,244,235,0.03)_18%,rgba(20,12,8,0.3)_100%)] backdrop-blur-2xl",
                    isSelected ? "border-[#e8c7a4]/30 ring-1 ring-[#e8c7a4]/22" : "border-[#d3b08b]/12",
                    face.glow,
                    isLanded && "shadow-[0_0_85px_rgba(238,205,166,0.2)]"
                  )}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-95", face.tint)} />
                  <div className="absolute inset-[1px] rounded-[1.95rem] bg-[linear-gradient(180deg,rgba(255,248,240,0.18),rgba(255,246,238,0.03)_28%,rgba(16,10,7,0.22)_100%)]" />
                  <div className="absolute inset-[10px] rounded-[1.7rem] border border-[#f1dcc6]/10 bg-[linear-gradient(180deg,rgba(58,37,25,0.18),rgba(18,10,8,0.3))]" />
                  <motion.div
                    className="absolute -left-14 top-0 h-full w-28 rotate-12 bg-[#f6ddc4]/10 blur-2xl"
                    animate={isSpinning ? { x: [-12, 30, 96, 150], opacity: [0.1, 0.3, 0.22, 0.06] } : { x: 0, opacity: 0.08 }}
                    transition={isSpinning ? { duration: 1.1, ease: "easeOut" } : { duration: 0.3 }}
                  />

                  <div className="relative flex h-full flex-col items-center justify-center px-5 py-6">
                    <div className="mb-5 flex h-[11rem] w-[11rem] items-center justify-center rounded-[1.85rem] border border-[#f1dcc6]/12 bg-[radial-gradient(circle_at_top,rgba(160,110,72,0.28),rgba(35,22,16,0.18))] p-3 shadow-[inset_0_1px_0_rgba(255,245,234,0.08)] backdrop-blur-xl">
                      <CharacterArt src={face.image} alt={face.name} className="h-full w-full rounded-[1.15rem] object-cover mix-blend-lighten drop-shadow-[0_18px_35px_rgba(0,0,0,0.42)]" />
                    </div>
                    <div className="rounded-full border border-[#f1dfc9]/12 bg-[linear-gradient(180deg,rgba(38,23,16,0.5),rgba(20,12,8,0.62))] px-5 py-2 font-heading text-xl font-black tracking-tight text-[#fff8ef] shadow-[inset_0_1px_0_rgba(255,245,234,0.08)]">
                      {face.name}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute right-3 top-3 rounded-full border border-[#f1ddc6]/16 bg-[#f0dcc6]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#fff6ed] backdrop-blur-md">
                      Selected
                    </div>
                  )}

                  {isLanded && <div className="absolute inset-0 rounded-[2rem] ring-2 ring-[#f2debf]/70" />}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute bottom-12 h-16 w-[24rem] rounded-full bg-black/45 blur-2xl"
        animate={isSpinning ? { scaleX: [1, 1.08, 1], opacity: [0.42, 0.58, 0.48] } : { scaleX: 1, opacity: 0.42 }}
        transition={{ duration: 2.05, ease: [0.12, 0.82, 0.18, 1] }}
      />
    </div>
  );
}

export default function Page() {
  const [deposit, setDeposit] = useState("1000");
  const [selected, setSelected] = useState<Character["id"][]>(["birb"]);
  const [spinning, setSpinning] = useState(false);
  const [spinPhase, setSpinPhase] = useState<"idle" | "spinning" | "done">("idle");
  const [landed, setLanded] = useState<Character["id"]>("birb");
  const [result, setResult] = useState<null | "hit" | "miss">(null);
  const [flash, setFlash] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [depositPhase, setDepositPhase] = useState<DepositPhase>("deposit");
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Lifetime stats (starting values for POC)
  const [totalBirbPlayed, setTotalBirbPlayed] = useState(15478);
  const [allTimeGold, setAllTimeGold] = useState(28814);
  const [dailyStreak, setDailyStreak] = useState(3); // Starting at day 3 for POC
  const [totalPlays, setTotalPlays] = useState(10); // Starting with 10 prior plays
  const [totalWins, setTotalWins] = useState(7); // 7 wins out of 10 = 70% WR

  const animRef = useRef<number | null>(null);
  const rotRef = useRef(0);

  const { playSpinSound, playWinSound, playLoseSound } = useSoundEffects();
  const { isMuted, toggleMute, volume, handleVolumeChange } = useLofiMusic();

  const depositNum = Math.max(0, Number(deposit) || 0);
  const dayMultiplier = getBaseGoldMultiplier(currentDay);

  /* ── Idle slow rotation ── */
  useEffect(() => {
    if (spinning || spinPhase === "done") return;
    let raf: number;
    let last = performance.now();
    function idleSpin(now: number) {
      const dt = now - last;
      last = now;
      rotRef.current += dt * 0.012;
      setRotationDeg(rotRef.current);
      raf = requestAnimationFrame(idleSpin);
    }
    raf = requestAnimationFrame(idleSpin);
    return () => cancelAnimationFrame(raf);
  }, [spinning, spinPhase]);

  /* ── Resume idle after landing ── */
  useEffect(() => {
    if (spinPhase !== "done") return;
    const timer = setTimeout(() => setSpinPhase("idle"), 3500);
    return () => clearTimeout(timer);
  }, [spinPhase]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  function togglePick(id: Character["id"]) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.length === 1 ? prev : prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  /* ── Deposit flow: deposit → receiving → ready → spin ── */
  function handleMainAction() {
    if (depositPhase === "deposit") {
      if (depositNum <= 0) return;
      setDepositPhase("receiving");
      // Simulate deposit processing
      setTimeout(() => {
        setDepositPhase("ready");
      }, 1800);
      return;
    }

    if (depositPhase === "ready") {
      doSpin();
      return;
    }
  }

  /* ── Spin logic with CORRECT front-face math ── */
  const doSpin = useCallback(() => {
    if (spinning) return;

    const next = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    const landedIndex = CHARACTERS.findIndex((c) => c.id === next.id);

    setResult(null);
    setFlash(false);
    setLanded(next.id);
    setSpinning(true);
    setSpinPhase("spinning");
    setDepositPhase("spinning");
    
    // Play spinning sound
    playSpinSound();

    const fullSpins = 3 + Math.floor(Math.random() * 2);

    /*
      FIX: To show face at index N to the viewer, the container must be at
      rotateY = -(N * 90) degrees (mod 360).
      
      Face 0 at 0°   → container needs 0° (or 360°)
      Face 1 at 90°  → container needs -90° (or 270°)
      Face 2 at 180° ���� container needs -180° (or 180°)
      Face 3 at 270° → container needs -270° (or 90°)
      
      We normalize to a positive target within the full-spin range.
    */
    const targetFaceAngle = ((360 - landedIndex * 90) % 360);
    const startDeg = rotRef.current;
    // Normalize current rotation to 0-360 range
    const currentMod = ((startDeg % 360) + 360) % 360;
    // Calculate target: snap to nearest base, add full spins, land on target face
    const targetDeg = startDeg - currentMod + fullSpins * 360 + targetFaceAngle;
    // Ensure we always spin forward (positive delta)
    const totalDelta = targetDeg - startDeg > 0 ? targetDeg - startDeg : targetDeg - startDeg + 360;
    const finalTarget = startDeg + totalDelta;

    const duration = 3200;
    const startTime = performance.now();
    const flashTime = duration * 0.85;
    let flashed = false;

    const currentGoldRate = getGoldRateNum(selected.length, dayMultiplier);

    function animate(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(t);
      const current = startDeg + totalDelta * eased;
      rotRef.current = current;
      setRotationDeg(current);

      if (!flashed && elapsed >= flashTime) {
        flashed = true;
        setFlash(true);
        setTimeout(() => setFlash(false), 300);
      }

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        rotRef.current = finalTarget;
        setRotationDeg(finalTarget);
        setSpinning(false);
        setSpinPhase("done");
        const isHit = selected.includes(next.id);
        setResult(isHit ? "hit" : "miss");
        
        // Play win or lose sound
        if (isHit) {
          // Dramatic sound for single pick win (highest risk)
          playWinSound(selected.length === 1);
        } else {
          playLoseSound();
        }

        const goldEarned = isHit
          ? (depositNum * currentGoldRate).toFixed(0)
          : "0";

        // Update lifetime stats
        setTotalBirbPlayed((prev) => prev + depositNum);
        setTotalPlays((prev) => prev + 1);
        if (isHit) {
          setAllTimeGold((prev) => prev + Math.round(depositNum * currentGoldRate));
          setTotalWins((prev) => prev + 1);
        }

        setLog((prev) => [
          ...prev,
          {
            picks: selected.map((s) => CHARACTERS.find((c) => c.id === s)?.name ?? s),
            landed: next.name,
            result: isHit ? "hit" : "miss",
            goldEarned,
            deposit: depositNum,
          },
        ]);

        // Reset deposit flow for next round
        setDepositPhase("deposit");
      }
    }

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);
  }, [spinning, selected, depositNum, dayMultiplier, playSpinSound, playWinSound, playLoseSound]);

  function resetLog() {
    setLog([]);
    setResult(null);
  }

  const hitChance = selected.length === 1 ? "25%" : selected.length === 2 ? "50%" : "75%";
  const goldRate = getGoldRate(selected.length, dayMultiplier);
  const riskLevel = selected.length === 1 ? "High" : selected.length === 2 ? "Medium" : "Low";
  const riskColor = selected.length === 1 ? "text-red-400" : selected.length === 2 ? "text-yellow-400" : "text-green-400";
  const riskBorder = selected.length === 1 ? "border-red-400/20 bg-red-500/5" : selected.length === 2 ? "border-yellow-400/20 bg-yellow-500/5" : "border-green-400/20 bg-green-500/5";

  /* ── Button label & style by deposit phase ── */
  const buttonLabel = {
    deposit: `Deposit ${depositNum > 0 ? depositNum.toLocaleString() : ""} BIRB`,
    receiving: "Receiving deposit...",
    ready: "Spin the Prism",
    spinning: "Spinning...",
  }[depositPhase];

  const buttonDisabled = depositPhase === "receiving" || depositPhase === "spinning" || (depositPhase === "deposit" && depositNum <= 0);

  return (
    <div className="min-h-screen overflow-hidden bg-[#090605] text-white">
      {/* ── Background: red smoke texture ── */}
      <div className="fixed inset-0">
        <img src="/bg-red.png" alt="" className="h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,6,5,0.6),rgba(9,6,5,0.3)_40%,rgba(9,6,5,0.85)_100%)]" />
      </div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(130,82,52,0.22),transparent_24%),radial-gradient(circle_at_78%_50%,rgba(179,120,76,0.14),transparent_16%),radial-gradient(circle_at_50%_110%,rgba(255,244,232,0.06),transparent_20%)]" />

      {/* ── Toobins art elements ── */}
      <img src="/toobins-r.png" alt="" className="pointer-events-none fixed right-0 top-0 h-auto w-[28rem] object-contain opacity-20 mix-blend-lighten lg:opacity-30" />

      {/* ── Token Rain for Legendary Wins ── */}
      <TokenRain isActive={result === "hit" && selected.length === 1 && spinPhase === "done"} />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 md:px-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="birb" className="h-8 w-auto object-contain md:h-10" />
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">
              Prism Concept
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            {/* Active Team Bar - shows team status or join prompt */}
            <ActiveTeamBar />
            {/* Music Controls */}
            <div className="flex items-center gap-2 rounded-full border border-[#ecd9ba]/15 bg-black/20 px-3 py-2 backdrop-blur-md">
              <button
                onClick={toggleMute}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition",
                  isMuted ? "text-[#ecd9ba]/40 hover:text-[#ecd9ba]/70" : "text-[#ecd9ba] hover:text-white"
                )}
                title={isMuted ? "Play music" : "Mute music"}
              >
                {isMuted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="0.3"
                step="0.005"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const newVol = parseFloat(e.target.value);
                  handleVolumeChange(newVol);
                  if (newVol > 0 && isMuted) {
                    toggleMute();
                  }
                }}
                className={cn(
                  "h-1 w-16 cursor-pointer appearance-none rounded-full bg-[#ecd9ba]/20 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
                  isMuted 
                    ? "[&::-webkit-slider-thumb]:bg-[#ecd9ba]/40" 
                    : "[&::-webkit-slider-thumb]:bg-[#d12429]"
                )}
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
            </div>
            <div className="rounded-full border border-[#ecd9ba]/30 bg-[#ecd9ba]/10 px-4 py-2 text-sm text-[#ecd9ba] backdrop-blur-md">
              SOL: F8ow...Pepn
            </div>
            <button className="rounded-full bg-[#d12429] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7d050d]">
              Disconnect
            </button>
          </div>
        </header>

        <section className="grid flex-1 gap-10 py-8 lg:grid-cols-2 lg:py-12">
          <div className="order-2 flex flex-col lg:order-1">
            <div className="mb-6 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d12429]/30 bg-[#d12429]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ecd9ba]/80">
                Birb Game 5
              </div>
              <h1 className="font-heading text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
                Predict the landing.
                <span className="block bg-gradient-to-r from-white via-[#ecd9ba] to-[#d12429] bg-clip-text text-transparent">
                  Keep your BIRB.
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/70 md:text-lg">
                Pick 1–3 faces, spin the prism, and stack Gold when your prediction hits. Risk more for bigger rewards.
              </p>
            </div>

            {/* ── Prism Container ── */}
            <div className="relative flex flex-1 items-center justify-center rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl">
              <AnimatePresence>
                {flash && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.55, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.32, times: [0, 0.22, 1] }}
                    className="pointer-events-none absolute inset-0 rounded-[2.25rem] bg-[radial-gradient(circle_at_center,rgba(255,244,230,0.28),transparent_26%)]"
                  />
                )}
              </AnimatePresence>

              {/* Glow on landing - Cream for high risk win, Green for medium/low risk win, Red for miss */}
              <AnimatePresence>
                {spinPhase === "done" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-[2.25rem]",
                      result === "hit" && selected.length === 1
                        ? "bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.4),rgba(255,236,139,0.18)_40%,transparent_70%)] shadow-[inset_0_0_100px_rgba(255,215,0,0.25)]"
                        : result === "hit"
                          ? "bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.25),rgba(22,163,74,0.1)_40%,transparent_70%)] shadow-[inset_0_0_80px_rgba(34,197,94,0.15)]"
                          : "bg-[radial-gradient(circle_at_center,rgba(209,36,41,0.25),rgba(125,5,13,0.1)_40%,transparent_70%)] shadow-[inset_0_0_80px_rgba(209,36,41,0.15)]"
                    )}
                  />
                )}
              </AnimatePresence>

              <HoloPrism
                isSpinning={spinning}
                spinPhase={spinPhase}
                landed={landed}
                selected={selected}
                rotationDeg={rotationDeg}
                result={result}
                isDramaticWin={result === "hit" && selected.length === 1 && spinPhase === "done"}
                isGreenWin={result === "hit" && selected.length > 1 && spinPhase === "done"}
              />
            </div>
          </div>

          <div className="order-1 flex flex-col lg:order-2">
            <div className="flex flex-1 flex-col rounded-[2.2rem] border border-[#ecd9ba]/10 bg-[linear-gradient(180deg,rgba(236,217,186,0.06),rgba(236,217,186,0.02))] p-6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[#ecd9ba]/50">Birb Game 5</div>
                  <div className="mt-1 font-heading text-2xl font-black tracking-tight">Select. Spin. Stack.</div>
                </div>
              </div>

              {/* ── Deposit ── */}
              <div className={cn(
                "rounded-[1.6rem] border p-4 shadow-[inset_0_1px_0_rgba(255,245,234,0.04)] transition-colors duration-500",
                depositPhase === "ready"
                  ? "border-[#d12429]/20 bg-[linear-gradient(180deg,rgba(209,36,41,0.06),rgba(14,8,6,0.42))]"
                  : "border-[#ecd9ba]/10 bg-[linear-gradient(180deg,rgba(236,217,186,0.04),rgba(14,8,6,0.42))]"
              )}>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs uppercase tracking-[0.18em] text-white/45">Deposit Amount</label>
                  {depositPhase === "receiving" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-[#d4a06c]"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-3 w-3 rounded-full border border-[#d4a06c] border-t-transparent"
                      />
                      Processing
                    </motion.div>
                  )}
                  {depositPhase === "ready" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#d12429]"
                    >
                      Deposited
                    </motion.div>
                  )}
                </div>
                <div className="relative">
                  <input
                    value={deposit}
                    onChange={(e) => {
                      setDeposit(e.target.value.replace(/[^\d]/g, ""));
                      // Reset deposit flow if they change the amount
                      if (depositPhase === "ready") setDepositPhase("deposit");
                    }}
                    disabled={depositPhase === "receiving" || depositPhase === "spinning"}
                    className="h-14 w-full rounded-2xl border border-[#f0dcc6]/10 bg-white/5 px-4 pr-20 text-xl font-bold text-white outline-none disabled:opacity-50"
                    placeholder="1000"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/60">BIRB</div>
                </div>
              </div>

              {/* ── Character picks ── */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                {CHARACTERS.map((character) => {
                  const active = selected.includes(character.id);
                  return (
                    <button
                      key={character.id}
                      onClick={() => togglePick(character.id)}
                      className={cn(
                        "group relative overflow-hidden rounded-[1.6rem] border p-3 text-left transition-all duration-300 shadow-[0_14px_40px_rgba(0,0,0,0.22)]",
                        active 
                          ? "border-[#c9a86c]/35 bg-[linear-gradient(180deg,rgba(201,168,108,0.1),rgba(160,130,80,0.05))] ring-1 ring-[#c9a86c]/15 shadow-[0_0_20px_rgba(201,168,108,0.1)]" 
                          : "border-[#f0dcc6]/8 bg-[linear-gradient(180deg,rgba(40,30,25,0.5),rgba(18,10,8,0.6))] hover:border-[#f0dcc6]/15 hover:bg-[rgba(40,30,25,0.7)]"
                      )}
                    >
                      <div className={cn(
                        "absolute inset-0 transition-opacity duration-300",
                        active 
                          ? "bg-[radial-gradient(circle_at_top_left,rgba(201,168,108,0.12),transparent_40%)] opacity-100" 
                          : "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_28%)] opacity-50"
                      )} />
                      <div className="relative flex items-center gap-3">
                        <div className={cn(
                          "flex h-16 w-16 items-center justify-center rounded-[1.25rem] border p-2 shadow-[inset_0_1px_0_rgba(255,245,234,0.06)] backdrop-blur-md transition-all duration-300",
                          active 
                            ? "border-[#c9a86c]/20 bg-[radial-gradient(circle_at_top,rgba(180,145,85,0.18),rgba(35,22,16,0.25))]" 
                            : "border-[#f0dcc6]/8 bg-[radial-gradient(circle_at_top,rgba(80,55,40,0.3),rgba(28,17,12,0.5))]"
                        )}>
                          <CharacterArt 
                            src={character.image} 
                            alt={character.name} 
                            className={cn(
                              "h-full w-full rounded-xl object-cover transition-all duration-300",
                              active 
                                ? "mix-blend-lighten opacity-100 saturate-100" 
                                : "mix-blend-luminosity opacity-50 saturate-0 group-hover:opacity-70 group-hover:saturate-50"
                            )} 
                          />
                        </div>
                        <div>
                          <div className={cn(
                            "text-base font-bold transition-colors duration-300",
                            active ? "text-white" : "text-white/50"
                          )}>{character.name}</div>
                          <div className={cn(
                            "text-xs uppercase tracking-[0.18em] transition-colors duration-300",
                            active ? "text-[#c9a86c]" : "text-white/30"
                          )}>
                            {active ? "Selected" : "Tap to select"}
                          </div>
                        </div>
                        {active && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c9a86c] text-[#1a1510]">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ── Day Decay Slider ── */}
              <div className="mt-5 rounded-[1.6rem] border border-[#d12429]/15 bg-[linear-gradient(180deg,rgba(209,36,41,0.04),rgba(14,8,6,0.42))] p-4 shadow-[inset_0_1px_0_rgba(209,36,41,0.06)]">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs uppercase tracking-[0.18em] text-white/45">Gold Rate Decay</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/35">Day</span>
                    <span className="font-heading text-lg font-black text-[#d12429]">{currentDay}</span>
                    <span className="text-xs text-white/35">/ 28</span>
                  </div>
                </div>
                <DayDecayCurve currentDay={currentDay} />
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-white/30">1</span>
                  <input
                    type="range"
                    min={1}
                    max={28}
                    value={currentDay}
                    onChange={(e) => setCurrentDay(Number(e.target.value))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-[#d12429] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#d12429] [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(209,36,41,0.4)]"
                  />
                  <span className="text-[10px] uppercase tracking-[0.15em] text-white/30">28</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="text-white/40">
                    Boost: <span className="font-bold text-[#d12429]">{(dayMultiplier * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-white/30">
                    {currentDay === 1 ? "Peak early-bird bonus" : currentDay <= 7 ? "Strong early bonus" : currentDay <= 14 ? "Bonus decaying" : currentDay <= 21 ? "Moderate bonus" : "Floor rate — still rewarding"}
                  </div>
                </div>
              </div>

              {/* ── Stats ── */}
              <div className="mt-5 grid grid-cols-4 gap-2">
                {[
                  { label: "Hit", value: hitChance },
                  { label: "Rate", value: goldRate, highlight: true },
                  { label: "Risk", value: riskLevel, isRisk: true },
                  { label: "Amt", value: `${depositNum || 0}` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "rounded-xl border px-2 py-3 text-center shadow-[0_8px_20px_rgba(0,0,0,0.15)]",
                      "highlight" in item && item.highlight
                        ? "border-[#d12429]/15 bg-[linear-gradient(180deg,rgba(209,36,41,0.06),rgba(236,217,186,0.02))]"
                        : "isRisk" in item && item.isRisk
                          ? riskBorder
                          : "border-[#f0dcc6]/10 bg-[linear-gradient(180deg,rgba(255,248,240,0.05),rgba(255,244,235,0.02))]"
                    )}
                  >
                    <div className="text-[9px] uppercase tracking-[0.15em] text-white/45">{item.label}</div>
                    <div className={cn(
                      "mt-1 font-heading text-base font-bold leading-tight",
                      "highlight" in item && item.highlight && "text-[#d12429]",
                      "isRisk" in item && item.isRisk && riskColor
                    )}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Info callout — red/brown instead of green ── */}
              <div className="mt-5 rounded-[1.5rem] border border-[#d4a06c]/20 bg-[#d4a06c]/10 p-4 text-sm text-[#f0dcc6]">
                Principal returned at month end. You are risking conversion efficiency, not deposited BIRB.
              </div>

              {/* Spacer to push button to bottom */}
              <div className="flex-1 min-h-4" />

              {/* ── Main action button with deposit flow ── */}
              <button
                onClick={handleMainAction}
                disabled={buttonDisabled}
                className={cn(
                  "mt-5 h-14 w-full rounded-2xl font-heading text-base font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50",
                  depositPhase === "ready"
                    ? "bg-[linear-gradient(135deg,#7d050d,#d12429)] hover:brightness-110 shadow-[0_0_24px_rgba(209,36,41,0.3)]"
                    : depositPhase === "receiving"
                      ? "bg-[#1e1a34]"
                      : "bg-[#d12429] hover:bg-[#7d050d]"
                )}
              >
                {depositPhase === "receiving" ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                    />
                    Receiving deposit...
                  </span>
                ) : (
                  buttonLabel
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ── Outcome and History - Horizontal Section ── */}
        <section className="relative mx-auto w-full max-w-7xl px-0 pb-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* ── Outcome Panel ── */}
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={cn(
                    "relative overflow-hidden rounded-[2rem] border p-6",
                    result === "hit" && selected.length === 1
                      ? "border-[#ffd700]/25 bg-[linear-gradient(180deg,rgba(255,215,0,0.08),rgba(20,14,12,0.95))]"
                      : result === "hit"
                        ? "border-[#22c55e]/25 bg-[linear-gradient(180deg,rgba(34,197,94,0.08),rgba(20,14,12,0.95))]"
                        : "border-[#dc2626]/20 bg-[linear-gradient(180deg,rgba(220,38,38,0.08),rgba(20,14,12,0.95))]"
                  )}
                >
                  {/* Radial glow overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.5, 0.25] }}
                    transition={{ duration: 1.5, times: [0, 0.3, 1] }}
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-[2rem]",
                      result === "hit" && selected.length === 1
                        ? "bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,0,0.25),transparent_60%)]"
                        : result === "hit"
                          ? "bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.2),transparent_60%)]"
                          : "bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.18),transparent_60%)]"
                    )}
                  />
                  {/* Decorative owl logo watermark on right */}
                  <img 
                    src="/images/birblogo-transparent.png" 
                    alt="" 
                    className="pointer-events-none absolute right-4 top-1/2 h-28 w-auto -translate-y-1/2 object-contain opacity-50 md:h-36"
                  />
                  <div className="relative z-10">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Outcome</div>
                    <div className={cn(
                      "mt-2 font-heading text-3xl font-black md:text-4xl",
                      result === "hit" && selected.length === 1
                        ? "bg-gradient-to-r from-[#ffd700] via-[#ffec8b] to-[#ffd700] bg-clip-text text-transparent"
                        : result === "hit" 
                          ? "text-[#22c55e]"
                          : "text-red-400"
                    )}>
                      {result === "hit" ? "Hit. Gold earned." : "Miss. No Gold this round."}
                    </div>
                    <div className="mt-3 text-sm leading-6 text-white/65">
                      The prism landed on {CHARACTERS.find((c) => c.id === landed)?.name}. {result === "hit" ? "Your pick matched." : "Your pick missed."}
                      {result === "hit" && (
                        <span className={cn(
                          "ml-1 font-bold",
                          selected.length === 1 ? "text-[#ffd700]" : "text-[#22c55e]"
                        )}>
                          +{(depositNum * getGoldRateNum(selected.length, dayMultiplier)).toFixed(0)} Gold
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Share button - only on hits, positioned absolutely */}
                  {result === "hit" && (
                    <button
                      onClick={() => setShowShareModal(true)}
                      className={cn(
                        "absolute bottom-5 right-5 flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                        selected.length === 1
                          ? "border-[#ffd700]/30 bg-[#ffd700]/10 text-[#ffd700] hover:bg-[#ffd700]/20"
                          : "border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20"
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      Share
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center rounded-[2rem] border border-[#f0dcc6]/10 bg-[linear-gradient(180deg,rgba(20,14,12,0.95),rgba(14,8,6,0.98))] p-6"
                >
                  <div className="text-center">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/30">Outcome</div>
                    <div className="mt-2 text-sm text-white/20">Spin to see results</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Right Column: Stats + History ── */}
            <div className="flex flex-col gap-4">
              {/* ── Player Stats Bar ── */}
              <div className="flex items-center justify-center gap-2">
                {/* Daily Streak */}
                <div className="flex items-center gap-1.5 rounded-xl border border-[#ffd700]/20 bg-[#ffd700]/5 px-2.5 py-1.5">
                  <div className="flex items-center gap-0.5">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition-all",
                          i < dailyStreak
                            ? "bg-[#ffd700] shadow-[0_0_4px_rgba(255,215,0,0.5)]"
                            : "bg-[#ecd9ba]/20"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-[#ffd700]">{dailyStreak} Day Streak</span>
                </div>

                {/* BIRB Played */}
                <div className="flex items-center gap-1.5 rounded-xl border border-[#ecd9ba]/20 bg-[#ecd9ba]/5 px-2.5 py-1.5">
                  <img src="/images/birb-token.png" alt="" className="h-4 w-4" />
                  <span className="text-[10px] uppercase tracking-wider text-[#ecd9ba]/50">BIRB Played</span>
                  <span className="text-xs font-bold text-[#ecd9ba]">{totalBirbPlayed.toLocaleString()}</span>
                </div>

                {/* All Time Gold */}
                <div className="flex items-center gap-1.5 rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/5 px-2.5 py-1.5">
                  <svg className="h-4 w-4 text-[#ffd700]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <span className="text-[10px] uppercase tracking-wider text-[#22c55e]/50">All Time Gold</span>
                  <span className="text-xs font-bold text-[#22c55e]">{allTimeGold.toLocaleString()}</span>
                </div>

                {/* Win Rate */}
                <div className="flex items-center gap-1.5 rounded-xl border border-[#8b5cf6]/20 bg-[#8b5cf6]/5 px-2.5 py-1.5">
                  <svg className="h-4 w-4 text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                  <span className="text-[10px] uppercase tracking-wider text-[#8b5cf6]/50">WR</span>
                  <span className="text-xs font-bold text-[#8b5cf6]">{Math.round((totalWins / totalPlays) * 100)}%</span>
                </div>
              </div>

              {/* ── History Panel ── */}
              <div className="relative flex-1 overflow-hidden rounded-[2rem] border border-[#f0dcc6]/10 bg-[linear-gradient(180deg,rgba(20,14,12,0.95),rgba(14,8,6,0.98))] p-5">
              {/* Decorative owl logo watermark */}
              <img 
                src="/images/birblogo-transparent.png" 
                alt="" 
                className="pointer-events-none absolute -right-4 bottom-0 h-32 w-auto object-contain opacity-25"
              />
              <div className="relative z-10 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">History</div>
                  {log.length > 0 && (
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <span className="text-[#ecd9ba]">{log.filter((l) => l.result === "hit").length}W</span>
                      <span className="text-white/25">·</span>
                      <span className="text-white/45">{log.filter((l) => l.result === "miss").length}L</span>
                    </div>
                  )}
                </div>
                {log.length > 0 && (
                  <button
                    onClick={resetLog}
                    className="rounded-full border border-white/20 bg-white/[0.03] px-4 py-1.5 text-[11px] font-medium text-white/60 transition hover:border-white/35 hover:bg-white/[0.06] hover:text-white/90"
                  >
                    Reset
                  </button>
                )}
              </div>
              {log.length === 0 ? (
                <div className="flex h-20 items-center justify-center text-sm text-white/30">
                  No plays yet
                </div>
              ) : (
                <div className="relative">
                  <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    {[...log].reverse().map((entry, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-shrink-0 min-w-[100px] rounded-xl border px-4 py-3",
                          entry.result === "hit"
                            ? "border-[#ecd9ba]/25 bg-[#ecd9ba]/[0.08]"
                            : "border-white/10 bg-white/[0.02]"
                        )}
                      >
                        <div className="flex items-center gap-2 text-[10px] text-white/45 mb-1.5">
                          <span className="font-medium">#{log.length - i}</span>
                          <span className="text-white/30">{entry.picks.join(", ")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white/60">{entry.landed}</span>
                          {entry.result === "hit" ? (
                            <span className="text-sm font-bold text-[#ecd9ba]">
                              +{entry.goldEarned}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400/70">
                              MISS
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Scroll indicators */}
                  {log.length > 4 && (
                    <>
                      <div className="pointer-events-none absolute left-0 top-0 bottom-3 w-6 bg-gradient-to-r from-[#140e0c] to-transparent" />
                      <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-6 bg-gradient-to-l from-[#140e0c] to-transparent" />
                    </>
                  )}
                </div>
              )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && result === "hit" && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            birbDeposit={depositNum}
            goldEarned={Math.round(depositNum * getGoldRateNum(selected.length, dayMultiplier))}
            riskLevel={selected.length === 1 ? "High" : selected.length === 2 ? "Medium" : "Low"}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
