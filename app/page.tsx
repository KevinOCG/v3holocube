"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

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

  return (
    <div className="relative h-12 w-full">
      {/* Curve SVG - stretched to fill width */}
      <svg viewBox="-2 -5 104 110" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <line x1="0" y1="0" x2="0" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        <line x1="100" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <polyline points={points} fill="none" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={`0,0 ${points} 100,${(1 - getBaseGoldMultiplier(28)) * 100} 100,100 0,100`} fill="url(#goldFill)" />
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f5c842" />
            <stop offset="100%" stopColor="#d4a06c" />
          </linearGradient>
          <linearGradient id="goldFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(245,200,66,0.12)" />
            <stop offset="100%" stopColor="rgba(245,200,66,0)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Indicator dot - positioned as overlay so it doesn't stretch */}
      <div 
        className="absolute pointer-events-none"
        style={{ 
          left: `${currentX}%`, 
          top: `${(currentY / 100) * 100}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="relative">
          <div className="absolute inset-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5c842]/30 blur-sm" />
          <div className="h-3 w-3 rounded-full bg-[#f5c842] border-2 border-[#090605] shadow-[0_0_8px_rgba(245,200,66,0.6)]" />
        </div>
      </div>
    </div>
  );
}

/* ── Play Log — fixed height ── */
function PlayLog({ log, onReset }: { log: LogEntry[]; onReset: () => void }) {
  if (log.length === 0) return null;

  const wins = log.filter((l) => l.result === "hit").length;
  const losses = log.length - wins;

  return (
    <div className="rounded-[1.5rem] border border-[#f0dcc6]/10 bg-[linear-gradient(180deg,rgba(255,248,240,0.04),rgba(14,8,6,0.42))] p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">History</div>
          <div className="flex items-center gap-1 text-xs font-bold">
            <span className="text-[#f5c842]">{wins}W</span>
            <span className="text-white/20">·</span>
            <span className="text-white/40">{losses}L</span>
          </div>
        </div>
        <button
          onClick={onReset}
          className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[9px] font-semibold text-white/50 transition hover:border-white/30 hover:text-white/80"
        >
          Reset
        </button>
      </div>
      <div className="h-[8rem] space-y-1 overflow-y-auto pr-1">
        {[...log].reverse().map((entry, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center justify-between rounded-xl border px-3 py-1.5 text-xs",
              entry.result === "hit"
                ? "border-[#f5c842]/15 bg-[#f5c842]/[0.04]"
                : "border-white/5 bg-white/[0.02]"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/20">#{log.length - i}</span>
              <span className="text-white/50">{entry.picks.join(", ")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/30">→ {entry.landed}</span>
              {entry.result === "hit" ? (
                <span className="font-bold text-[#f5c842] text-[10px] tracking-wide">
                  +{entry.goldEarned} Gold
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/25">
                  MISS
                </span>
              )}
            </div>
          </div>
        ))}
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
}: {
  landed: Character["id"];
  selected: Character["id"][];
  rotationDeg: number;
  isSpinning: boolean;
  spinPhase: "idle" | "spinning" | "done";
  result: "hit" | "miss" | null;
}) {
  return (
    <div className="relative flex h-[34rem] w-full items-center justify-center overflow-hidden">
      <motion.div
        className="absolute h-[36rem] w-[36rem] rounded-full bg-[#7c5237]/20 blur-3xl"
        animate={isSpinning ? { scale: [1, 1.08, 1.02], opacity: [0.55, 0.82, 0.6] } : { scale: 1, opacity: 0.55 }}
        transition={{ duration: 2.15, ease: [0.12, 0.82, 0.18, 1] }}
      />
      <motion.div
        className="absolute h-[24rem] w-[24rem] rounded-full bg-[#d39a66]/10 blur-3xl"
        animate={isSpinning ? { scale: [1, 1.16, 1.02], opacity: [0.3, 0.55, 0.32] } : { scale: 1, opacity: 0.3 }}
        transition={{ duration: 2.15, ease: [0.12, 0.82, 0.18, 1] }}
      />
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
                                    "relative h-full w-full overflow-hidden rounded-[2rem] border bg-[linear-gradient(180deg,rgba(255,248,240,0.12),rgba(255,244,235,0.03)_18%,rgba(20,12,8,0.3)_100%)] backdrop-blur-2xl transition-all duration-500",
                                    isSelected 
                                      ? "border-[#f5c842]/50 ring-2 ring-[#f5c842]/30 shadow-[0_0_30px_rgba(245,200,66,0.2)]" 
                                      : "border-[#d3b08b]/12",
                                    face.glow,
                                    isLanded && result === "hit" && "shadow-[0_0_120px_rgba(245,200,66,0.6),0_0_60px_rgba(245,200,66,0.4)] border-[#f5c842]/80",
                                    isLanded && result === "miss" && "shadow-[0_0_120px_rgba(220,38,38,0.5),0_0_60px_rgba(220,38,38,0.3)] border-red-500/70"
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
                    <div className="rounded-full border border-[#f1dfc9]/12 bg-[linear-gradient(180deg,rgba(38,23,16,0.5),rgba(20,12,8,0.62))] px-5 py-2 text-xl font-black tracking-tight text-[#fff8ef] shadow-[inset_0_1px_0_rgba(255,245,234,0.08)]">
                      {face.name}
                    </div>
                  </div>

{isSelected && (
                                    <div className="absolute right-3 top-3 rounded-full border border-[#f5c842]/40 bg-[#f5c842]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f5c842] backdrop-blur-md shadow-[0_0_12px_rgba(245,200,66,0.3)]">
                                      Selected
                                    </div>
                                  )}

                  {isLanded && result === "hit" && (
                                    <>
                                      <div className="absolute inset-0 rounded-[2rem] ring-[3px] ring-[#f5c842] shadow-[inset_0_0_40px_rgba(245,200,66,0.35)]" />
                                      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(245,200,66,0.2),transparent_70%)]" />
                                    </>
                                  )}
                                  {isLanded && result === "miss" && (
                                    <>
                                      <div className="absolute inset-0 rounded-[2rem] ring-[3px] ring-red-500 shadow-[inset_0_0_40px_rgba(220,38,38,0.3)]" />
                                      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15),transparent_70%)]" />
                                    </>
                                  )}
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
  const [lastResult, setLastResult] = useState<{
    result: "hit" | "miss";
    landedId: Character["id"];
    selectedIds: Character["id"][];
    goldEarned: number;
  } | null>(null);
  const [flash, setFlash] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [depositPhase, setDepositPhase] = useState<DepositPhase>("deposit");
  const [musicMuted, setMusicMuted] = useState(false);

  const animRef = useRef<number | null>(null);
  const rotRef = useRef(0);
  const spinSoundRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const loseSoundRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  // Initialize lofi background music
  useEffect(() => {
    const audio = new Audio("https://cdn.pixabay.com/audio/2024/11/06/audio_c9b2b89f0c.mp3");
    audio.loop = true;
    audio.volume = 0.22;
    musicRef.current = audio;

    const tryPlay = () => {
      audio.play().catch(() => {
        // Autoplay blocked — try on first user interaction
        const unlock = () => {
          audio.play().catch(() => {});
          document.removeEventListener("click", unlock);
          document.removeEventListener("keydown", unlock);
        };
        document.addEventListener("click", unlock, { once: true });
        document.addEventListener("keydown", unlock, { once: true });
      });
    };
    tryPlay();

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Sync mute state to audio element
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.muted = musicMuted;
    }
  }, [musicMuted]);

  const playSpinSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Create a whooshing spin sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.5);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 3);
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 3);
  }, []);

  const playWinSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Victory fanfare - ascending notes
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.12);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + i * 0.12);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + i * 0.12 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.12 + 0.4);
      
      oscillator.start(audioContext.currentTime + i * 0.12);
      oscillator.stop(audioContext.currentTime + i * 0.12 + 0.5);
    });
  }, []);

  const playEpicWinSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Impact thud
    const bufferSize = audioContext.sampleRate * 0.15;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 4);
    }
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = buffer;
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.35, audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
    noiseSource.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    noiseSource.start(audioContext.currentTime);

    // Big chord swell — major chord C4 + E4 + G4 + C5
    const chordNotes = [261.63, 329.63, 392.00, 523.25, 659.25];
    chordNotes.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.type = i < 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq * 0.5, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq, audioContext.currentTime + 0.08);
      gain.gain.setValueAtTime(0, audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.4);
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + 1.5);
    });

    // Ascending sparkle arpeggio
    const sparkle = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    sparkle.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioContext.currentTime + 0.1 + i * 0.1);
      gain.gain.setValueAtTime(0, audioContext.currentTime + 0.1 + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.1 + i * 0.1 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1 + i * 0.1 + 0.35);
      osc.start(audioContext.currentTime + 0.1 + i * 0.1);
      osc.stop(audioContext.currentTime + 0.1 + i * 0.1 + 0.4);
    });
  }, []);

  const playLoseSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Sad descending tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
  }, []);

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

  // Preserve current result as "last" so outcome card doesn't vanish mid-spin
  if (result) {
    setLastResult({
      result,
      landedId: landed,
      selectedIds: [...selected],
      goldEarned: depositNum * getGoldRateNum(selected.length, dayMultiplier),
    });
  }
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
      Face 2 at 180° → container needs -180° (or 180°)
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
  setLastResult(null);
  setResult(isHit ? "hit" : "miss");
        
        // Play win or lose sound — epic if single-pick win
        if (isHit) {
          if (selected.length === 1) {
            playEpicWinSound();
          } else {
            playWinSound();
          }
        } else {
          playLoseSound();
        }

        const goldEarned = isHit
          ? (depositNum * currentGoldRate).toFixed(0)
          : "0";

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
  }, [spinning, selected, depositNum, dayMultiplier, playSpinSound, playWinSound, playLoseSound, playEpicWinSound]);

  function resetLog() {
    setLog([]);
    setResult(null);
    setLastResult(null);
  }

  const hitChance = selected.length === 1 ? "25%" : selected.length === 2 ? "50%" : "75%";
  const goldRate = getGoldRate(selected.length, dayMultiplier);

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

      {/* ── Toobins art element ── */}
      <img src="/toobins-r.png" alt="" className="pointer-events-none fixed right-0 top-0 h-auto w-[28rem] object-contain opacity-20 mix-blend-lighten lg:opacity-30" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 md:px-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
              <img src="/logo.png" alt="birb" className="h-7 w-auto object-contain md:h-9" />
            </div>
            <div className="inline-flex rounded-full border border-[#f0dcc6]/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70 backdrop-blur-md">
              Cube Concept
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-full border border-[#d4a06c]/30 bg-[#d4a06c]/10 px-4 py-2 text-sm text-[#f0dcc6] backdrop-blur-md">
              SOL: F8ow...Pepn
            </div>
            {/* Music mute toggle */}
            <button
              onClick={() => setMusicMuted((m) => !m)}
              title={musicMuted ? "Unmute music" : "Mute music"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/60 backdrop-blur-md transition hover:border-white/30 hover:text-white/90"
            >
              {musicMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
            <button className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">
              Disconnect
            </button>
          </div>
        </header>

        <section className="grid items-stretch gap-10 py-8 lg:grid-cols-2 lg:py-12">
          <div className="order-2 flex flex-col lg:order-1">
            <div className="mb-6 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-100/80">
                Premium playtest concept
              </div>
              <h1 className="text-4xl font-black leading-[1.1] tracking-tight md:text-6xl">
                Predict the landing.
                <span className="block bg-gradient-to-r from-white via-[#f8e7d4] to-[#d4a06c] bg-clip-text text-transparent pb-1">
                  Keep your BIRB.
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/70 md:text-lg">
                Pick 1–3 faces, spin the prism, and earn Gold when your prediction hits. This is a front-end playtest concept with your uploaded art wired in.
              </p>
            </div>

            {/* ── Prism Container ── */}
            <div className="relative flex flex-1 min-h-[30rem] items-center justify-center rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl">
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

              {/* Gold glow on landing */}
              <AnimatePresence>
                {spinPhase === "done" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-[2.25rem]",
                      result === "hit"
                        ? "bg-[radial-gradient(circle_at_center,rgba(245,200,66,0.2),rgba(212,160,108,0.08)_40%,transparent_70%)] shadow-[inset_0_0_80px_rgba(245,200,66,0.12)]"
                        : "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_50%)]"
                    )}
                  />
                )}
              </AnimatePresence>

              {/* Epic win burst — single pick only */}
              <AnimatePresence>
                {spinPhase === "done" && result === "hit" && selected.length === 1 && (
                  <>
                    <motion.div
                      key="epic-burst"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: [0, 0.9, 0.5, 0], scale: [0.6, 1.2, 1.5, 2] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.1, times: [0, 0.18, 0.5, 1], ease: "easeOut" }}
                      className="pointer-events-none absolute inset-0 rounded-[2.25rem] bg-[radial-gradient(circle_at_center,rgba(245,200,66,0.55),rgba(245,200,66,0.1)_45%,transparent_70%)]"
                    />
                    <motion.div
                      key="epic-ring"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.8, 1.05, 1.15] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, times: [0, 0.3, 1] }}
                      className="pointer-events-none absolute inset-0 rounded-[2.25rem] shadow-[inset_0_0_0_3px_rgba(245,200,66,0.8),0_0_60px_rgba(245,200,66,0.4)]"
                    />
                  </>
                )}
              </AnimatePresence>

              <HoloPrism
                isSpinning={spinning}
                spinPhase={spinPhase}
                landed={landed}
                selected={selected}
                rotationDeg={rotationDeg}
                result={result}
              />
            </div>
          </div>

          <div className="order-1 flex flex-col lg:order-2">
            <div className="flex flex-1 flex-col rounded-[2.2rem] border border-[#f0dcc6]/10 bg-[linear-gradient(180deg,rgba(255,248,240,0.06),rgba(255,244,235,0.025))] p-6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/45">Entry Flow</div>
                  <div className="mt-1 text-2xl font-black tracking-tight">Simple. Guided. Fast.</div>
                </div>
                <div className="text-right text-sm text-white/50">Playtest</div>
              </div>

              {/* ── Deposit ── */}
              <div className={cn(
                "rounded-[1.6rem] border p-4 shadow-[inset_0_1px_0_rgba(255,245,234,0.04)] transition-colors duration-500",
                depositPhase === "ready"
                  ? "border-[#f5c842]/20 bg-[linear-gradient(180deg,rgba(245,200,66,0.06),rgba(14,8,6,0.42))]"
                  : "border-[#f0dcc6]/10 bg-[linear-gradient(180deg,rgba(255,248,240,0.04),rgba(14,8,6,0.42))]"
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
                      className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#f5c842]"
                    >
                      ✓ Deposited
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
                          ? "border-[#f5c842]/35 bg-[linear-gradient(135deg,rgba(245,200,66,0.12),rgba(240,220,198,0.07))] shadow-[0_0_28px_rgba(245,200,66,0.15)]"
                          : "border-[#f0dcc6]/8 bg-[linear-gradient(180deg,rgba(255,248,240,0.02),rgba(18,10,8,0.45))] hover:border-[#f0dcc6]/18 hover:bg-[#f0dcc6]/[0.05]"
                      )}
                    >
                      <div className={cn(
                        "absolute inset-0 transition-opacity duration-300",
                        active
                          ? "bg-[radial-gradient(circle_at_top_left,rgba(245,200,66,0.1),transparent_40%)] opacity-100"
                          : "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_28%)] opacity-100"
                      )} />
                      <div className="relative flex items-center gap-3">
                        <div className={cn(
                          "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[1.25rem] border p-2 shadow-[inset_0_1px_0_rgba(255,245,234,0.06)] backdrop-blur-md transition-all duration-300",
                          active
                            ? "border-[#f5c842]/20 bg-[radial-gradient(circle_at_top,rgba(142,95,61,0.35),rgba(28,17,12,0.34))]"
                            : "border-[#f0dcc6]/8 bg-[radial-gradient(circle_at_top,rgba(80,60,40,0.18),rgba(28,17,12,0.34))]"
                        )}>
                          <CharacterArt
                            src={character.image}
                            alt={character.name}
                            className={cn(
                              "h-full w-full rounded-xl object-cover mix-blend-lighten transition-all duration-300",
                              active ? "opacity-100 saturate-100" : "opacity-40 saturate-0"
                            )}
                          />
                        </div>
                        <div>
                          <div className={cn(
                            "text-base font-bold transition-colors duration-300",
                            active ? "text-white" : "text-white/35"
                          )}>
                            {character.name}
                          </div>
                          <div className={cn(
                            "text-xs uppercase tracking-[0.18em] transition-colors duration-300",
                            active ? "text-[#f5c842]/80" : "text-white/25"
                          )}>
                            {active ? "Selected" : "Tap to select"}
                          </div>
                        </div>
                      </div>
                      {active && (
                        <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#f5c842] shadow-[0_0_6px_rgba(245,200,66,0.8)]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ── Risk Indicator ── */}
              {(() => {
                const riskLevel = selected.length === 1 ? "high" : selected.length === 2 ? "medium" : "low";
                const riskConfig = {
                  high: {
                    label: "HIGH RISK",
                    desc: "1 pick · 25% hit chance · 4.40x reward",
                    bar: "w-full",
                    color: "text-red-400",
                    border: "border-red-500/25",
                    bg: "bg-red-500/8",
                    fill: "bg-red-500",
                    dots: 3,
                  },
                  medium: {
                    label: "MEDIUM RISK",
                    desc: "2 picks · 50% hit chance · 2.05x reward",
                    bar: "w-2/3",
                    color: "text-[#f5c842]",
                    border: "border-[#f5c842]/20",
                    bg: "bg-[#f5c842]/5",
                    fill: "bg-[#f5c842]",
                    dots: 2,
                  },
                  low: {
                    label: "LOW RISK",
                    desc: "3 picks · 75% hit chance · 1.20x reward",
                    bar: "w-1/3",
                    color: "text-emerald-400",
                    border: "border-emerald-500/20",
                    bg: "bg-emerald-500/5",
                    fill: "bg-emerald-400",
                    dots: 1,
                  },
                }[riskLevel];

                return (
                  <div className={cn("mt-3 flex items-center justify-between rounded-[1.2rem] border px-4 py-2.5 transition-all duration-300", riskConfig.border, riskConfig.bg)}>
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((dot) => (
                          <div
                            key={dot}
                            className={cn(
                              "h-2 w-2 rounded-full transition-all duration-300",
                              dot <= riskConfig.dots ? riskConfig.fill : "bg-white/10"
                            )}
                          />
                        ))}
                      </div>
                      <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", riskConfig.color)}>
                        {riskConfig.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/35">{riskConfig.desc}</span>
                  </div>
                );
              })()}

              {/* ── Day Decay Slider ── */}
              <div className="mt-5 rounded-[1.6rem] border border-[#f5c842]/15 bg-[linear-gradient(180deg,rgba(245,200,66,0.04),rgba(14,8,6,0.42))] p-4 shadow-[inset_0_1px_0_rgba(245,200,66,0.06)]">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs uppercase tracking-[0.18em] text-white/45">Gold Rate Decay</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/35">Day</span>
                    <span className="text-lg font-black text-[#f5c842]">{currentDay}</span>
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
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-[#f5c842] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#f5c842] [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(245,200,66,0.4)]"
                  />
                  <span className="text-[10px] uppercase tracking-[0.15em] text-white/30">28</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="text-white/40">
                    Boost: <span className="font-bold text-[#f5c842]">{(dayMultiplier * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-white/30">
                    {currentDay === 1 ? "Peak early-bird bonus" : currentDay <= 7 ? "Strong early bonus" : currentDay <= 14 ? "Bonus decaying" : currentDay <= 21 ? "Moderate bonus" : "Floor rate — still rewarding"}
                  </div>
                </div>
              </div>

              {/* ── Stats ── */}
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  { label: "Hit Chance", value: hitChance },
                  { label: "Gold Rate", value: goldRate, highlight: true },
                  { label: "Deposit", value: `${depositNum || 0} BIRB` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "rounded-[1.3rem] border p-4 shadow-[0_12px_30px_rgba(0,0,0,0.18)]",
                      "highlight" in item && item.highlight
                        ? "border-[#f5c842]/15 bg-[linear-gradient(180deg,rgba(245,200,66,0.06),rgba(255,244,235,0.02))]"
                        : "border-[#f0dcc6]/10 bg-[linear-gradient(180deg,rgba(255,248,240,0.05),rgba(255,244,235,0.02))]"
                    )}
                  >
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">{item.label}</div>
                    <div className={cn(
                      "mt-2 text-2xl font-black",
                      "highlight" in item && item.highlight && "text-[#f5c842]"
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
              <div className="flex-1" />

              {/* ── Main action button with deposit flow ── */}
              <button
                onClick={handleMainAction}
                disabled={buttonDisabled}
                className={cn(
                  "mt-5 h-14 w-full rounded-2xl text-base font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50",
                  depositPhase === "ready"
                    ? "bg-[linear-gradient(135deg,#b8432f,#d44a35)] hover:brightness-110 shadow-[0_0_24px_rgba(212,74,53,0.25)]"
                    : depositPhase === "receiving"
                      ? "bg-[#5a3f34]"
                      : "bg-red-600 hover:bg-red-500"
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

        {/* ── Outcome + History — full width row below the two columns ── */}
        {(result || lastResult || log.length > 0) && (
          <div className="grid grid-cols-1 gap-4 pb-8 lg:grid-cols-2">
            {/* Outcome — shows live result, or grayed-out previous result while spinning */}
            {(() => {
              const displayResult = result ?? lastResult?.result ?? null;
              const displayLanded = result ? landed : lastResult?.landedId ?? landed;
              const displaySelected = result ? selected : lastResult?.selectedIds ?? selected;
              const displayGold = result
                ? depositNum * getGoldRateNum(selected.length, dayMultiplier)
                : lastResult?.goldEarned ?? 0;
              const isPast = !result && !!lastResult;

              if (!displayResult) return <div />;

              return (
                <motion.div
                  key={isPast ? "past" : "current"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: isPast ? 0.45 : 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={cn(
                    "relative overflow-hidden rounded-[1.5rem] border p-5 transition-all duration-500",
                    displayResult === "hit"
                      ? "border-[#f5c842]/30 bg-[linear-gradient(180deg,rgba(245,200,66,0.08),rgba(212,160,108,0.04))]"
                      : "border-white/10 bg-white/5",
                    isPast && "grayscale"
                  )}
                >
                  {displayResult === "hit" && !isPast && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.6, 0.3] }}
                      transition={{ duration: 1.5, times: [0, 0.3, 1] }}
                      className="pointer-events-none absolute inset-0 rounded-[1.5rem] bg-[radial-gradient(circle_at_50%_0%,rgba(245,200,66,0.2),transparent_60%)]"
                    />
                  )}
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">Outcome</div>
                      {isPast && (
                        <div className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-widest text-white/35">
                          Previous
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "mt-2 text-2xl font-black leading-tight",
                      displayResult === "hit" && !isPast && "bg-gradient-to-r from-[#f5c842] via-[#fde68a] to-[#d4a06c] bg-clip-text text-transparent",
                      displayResult === "hit" && isPast && "text-white/50",
                      displayResult === "miss" && "text-white/50"
                    )}>
                      {displayResult === "hit"
                        ? displaySelected.length === 1
                          ? "LEGENDARY. Max Gold."
                          : "Hit. Gold earned."
                        : "Miss. No Gold this round."}
                    </div>
                    {displayResult === "hit" && displaySelected.length === 1 && !isPast && (
                      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#f5c842]/60">
                        High Risk · Single Pick · Victory
                      </div>
                    )}
                    <div className="mt-3 text-sm leading-6 text-white/55">
                      The prism landed on{" "}
                      <span className="font-medium text-white/75">
                        {CHARACTERS.find((c) => c.id === displayLanded)?.name}
                      </span>.{" "}
                      {displayResult === "hit" ? "Pick matched." : "Pick missed."}
                      {displayResult === "hit" && (
                        <span className={cn("ml-1 font-bold", isPast ? "text-white/35" : "text-[#f5c842]")}>
                          +{displayGold.toFixed(0)} Gold
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* History */}
            <PlayLog log={log} onReset={resetLog} />
          </div>
        )}
      </div>
    </div>
  );
}
