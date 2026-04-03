"use client";
// Birb Coinflip - Gamified Staking with Streak Mechanics

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

/* ── Lofi Music System ── */
function useLofiMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.06);

  useEffect(() => {
    const audio = new Audio('/lofi-track.mp3');
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
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

  const playFlipSound = useCallback(() => {
    const ctx = getAudioContext();
    
    // Quick dramatic whoosh
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
    oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 0.15);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);

    // Rapid coin spinning clicks - faster and more intense
    let clickCount = 0;
    const maxClicks = 25;
    const spinInterval = setInterval(() => {
      clickCount++;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      
      const pitch = 1200 - (clickCount / maxClicks) * 600;
      osc.frequency.setValueAtTime(pitch + Math.random() * 150, ctx.currentTime);
      
      const vol = 0.2 - (clickCount / maxClicks) * 0.12;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.025);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.025);
      
      if (clickCount >= maxClicks) clearInterval(spinInterval);
    }, 40); // Much faster interval

    setTimeout(() => clearInterval(spinInterval), 1200);
  }, [getAudioContext]);

  const playWinSound = useCallback((isStreak = false) => {
    const ctx = getAudioContext();
    
    const notes = isStreak ? [523, 659, 784, 1047, 1319, 1568] : [523, 659, 784, 1047];
    const duration = isStreak ? 0.2 : 0.15;
    
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      
      const startTime = ctx.currentTime + i * duration;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(isStreak ? 0.55 : 0.4, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.02, startTime + duration * 1.8);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration * 1.8);
    });

    if (isStreak) {
      for (let i = 0; i < 12; i++) {
        const shimmer = ctx.createOscillator();
        const shimmerGain = ctx.createGain();
        shimmer.connect(shimmerGain);
        shimmerGain.connect(ctx.destination);
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(2500 + Math.random() * 2500, ctx.currentTime);
        const startTime = ctx.currentTime + 0.6 + i * 0.08;
        shimmerGain.gain.setValueAtTime(0.1, startTime);
        shimmerGain.gain.exponentialRampToValueAtTime(0.002, startTime + 0.25);
        shimmer.start(startTime);
        shimmer.stop(startTime + 0.25);
      }
    }
  }, [getAudioContext]);

  const playLoseSound = useCallback(() => {
    const ctx = getAudioContext();
    
    const notes = [523, 415, 330, 262, 196];
    
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      
      const startTime = ctx.currentTime + i * 0.1;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.02, startTime + 0.25);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  }, [getAudioContext]);

  const playLockInSound = useCallback(() => {
    const ctx = getAudioContext();
    
    const notes = [659, 784, 1047];
    
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      
      const startTime = ctx.currentTime + i * 0.08;
      gainNode.gain.setValueAtTime(0.4, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.02, startTime + 0.4);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.45);
    });
  }, [getAudioContext]);

  return { playFlipSound, playWinSound, playLoseSound, playLockInSound };
}

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

/* ── Gold Rate Decay with 5-day grace period ── */
function getBaseGoldMultiplier(day: number): number {
  const gracePeriod = 5;
  
  if (day <= gracePeriod) {
    return 1.0;
  }
  
  const floor = 0.20;
  const daysAfterGrace = day - gracePeriod;
  const k = 0.12;
  
  return floor + (1 - floor) * Math.exp(-k * daysAfterGrace);
}

/* ── Streak Multiplier: 2x, 4x, 8x, 16x... ── */
function getStreakMultiplier(streak: number): number {
  return Math.pow(2, streak);
}

function getGoldRateNum(streak: number, dayMultiplier: number): number {
  const baseRate = 1.5;
  return baseRate * getStreakMultiplier(streak) * dayMultiplier;
}

function getGoldRate(streak: number, dayMultiplier: number): string {
  return getGoldRateNum(streak, dayMultiplier).toFixed(2) + "x";
}

type GamePhase = "deposit" | "receiving" | "ready" | "flipping" | "result" | "locked";
type FlipResult = "heads" | "tails";
type PlayerChoice = "heads" | "tails";

type LogEntry = {
  choice: PlayerChoice;
  result: FlipResult;
  outcome: "win" | "lose";
  streak: number;
  goldRate: string;
  goldEarned: number;
  deposit: number;
};

/* ── Day Decay Curve Visualization with Grace Period ── */
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

  useEffect(() => {
    if (svgRef.current) {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const pixelX = (currentX / 100) * rect.width;
      const pixelY = ((currentY + 5) / 110) * rect.height;
      setCirclePos({ x: pixelX, y: pixelY });
    }
  }, [currentDay, currentX, currentY]);

  // Grace period ends at day 5, which is ~14.8% of the way across
  const graceEndX = ((5 - 1) / 27) * 100;

  return (
    <div className="relative h-12 w-full">
      <svg ref={svgRef} viewBox="-2 -5 104 110" className="h-full w-full" preserveAspectRatio="none">
        <line x1="0" y1="0" x2="0" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        <line x1="100" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        {/* Grace period zone */}
        <rect x="0" y="0" width={graceEndX} height="100" fill="rgba(34,197,94,0.08)" />
        <line x1={graceEndX} y1="0" x2={graceEndX} y2="100" stroke="rgba(34,197,94,0.3)" strokeWidth="1" strokeDasharray="4,4" vectorEffect="non-scaling-stroke" />
        <polyline points={points} fill="none" stroke="url(#goldGradCF)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <polyline points={`0,0 ${points} 100,${(1 - getBaseGoldMultiplier(28)) * 100} 100,100 0,100`} fill="url(#goldFillCF)" />
        <defs>
          <linearGradient id="goldGradCF" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset={`${graceEndX}%`} stopColor="#22c55e" />
            <stop offset={`${graceEndX + 5}%`} stopColor="#d12429" />
            <stop offset="100%" stopColor="#ecd9ba" />
          </linearGradient>
          <linearGradient id="goldFillCF" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(209,36,41,0.12)" />
            <stop offset="100%" stopColor="rgba(209,36,41,0)" />
          </linearGradient>
        </defs>
      </svg>
      <div 
        className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d12429] shadow-[0_0_8px_rgba(209,36,41,0.6)]"
        style={{ left: circlePos.x, top: circlePos.y }}
      >
        <div className="absolute inset-[-4px] rounded-full border border-[#d12429]/40" />
      </div>
    </div>
  );
}

/* ── Share Modal Component ── */
function ShareModal({ 
  isOpen, 
  onClose, 
  birbDeposit, 
  goldEarned, 
  streak,
  goldRate
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  birbDeposit: number; 
  goldEarned: number;
  streak: number;
  goldRate: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);

  const shareToTwitter = () => {
    const streakText = streak > 0 ? ` on a ${streak}-flip streak at ${goldRate}` : "";
    const text = `Birbish AF! I just locked in ${goldEarned.toLocaleString()} Gold${streakText} with ${birbDeposit.toLocaleString()} BIRB on Birb Coinflip!`;
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
      link.download = 'birbish-coinflip.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setCopying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div
          ref={cardRef}
          className="overflow-hidden rounded-2xl border border-[#ffd700]/30 bg-gradient-to-b from-[#1a1510] to-[#0a0604] p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <img src="/logo.png" alt="birb" className="h-10 w-auto" />
            <div>
              <div className="font-heading text-lg font-black text-[#ffd700]">BIRBISH AF!</div>
              <div className="text-xs text-[#ecd9ba]/50">Birb Coinflip Win</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#ffd700]/10 p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#ffd700]/60">Deposited</div>
              <div className="font-heading text-xl font-black text-white">{birbDeposit.toLocaleString()} BIRB</div>
            </div>
            <div className="rounded-xl bg-[#ffd700]/10 p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#ffd700]/60">Locked Gold</div>
              <div className="font-heading text-xl font-black text-[#ffd700]">{goldEarned.toLocaleString()}</div>
            </div>
          </div>
          {streak > 0 && (
            <div className="mt-3 rounded-xl bg-[#ffd700]/5 p-3 text-center">
              <div className="text-xs text-[#ffd700]/60">Streak Bonus</div>
              <div className="font-heading text-lg font-black text-[#ffd700]">{streak} Flips at {goldRate}</div>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={shareToTwitter}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1DA1F2] py-3 font-semibold text-white transition hover:bg-[#1a8cd8]"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </button>
          <button
            onClick={downloadImage}
            disabled={copying}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            {copying ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
              />
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Token Rain Animation ── */
function TokenRain({ active }: { active: boolean }) {
  const tokens = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 1,
      size: 20 + Math.random() * 20,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 720,
    }));
  }, []);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {tokens.map((token) => (
        <motion.div
          key={token.id}
          initial={{ 
            x: `${token.x}vw`,
            y: '-10vh',
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
            src="/birb_heads.png" 
            alt="" 
            className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(255,200,100,0.5)]"
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ── 3D Coin Component with Framer Motion ── */
function Coin({
  isFlipping,
  result,
  gamePhase,
  playerChoice,
}: {
  isFlipping: boolean;
  result: FlipResult | null;
  gamePhase: GamePhase;
  playerChoice: PlayerChoice;
}) {
  const showResult = gamePhase === "result" || gamePhase === "locked";
  const isWin = showResult && result === playerChoice;
  const isLoss = showResult && result !== playerChoice;
  const isIdle = !isFlipping && !showResult;
  
  // Calculate rotation for result - heads is 0deg, tails is 180deg
  const resultRotation = result === "tails" ? 180 : 0;

  return (
    <div className="relative flex h-[28rem] w-full items-center justify-center" style={{ perspective: "1500px" }}>
      {/* Luxury ambient glow - always present, pulses on idle */}
      <motion.div
        className={cn(
          "absolute rounded-full blur-[100px]",
          isWin
            ? "h-[28rem] w-[28rem] bg-[#ffd700]/50"
            : isLoss
              ? "h-[24rem] w-[24rem] bg-[#dc2626]/30"
              : "h-[26rem] w-[26rem] bg-[#c9a227]/25"
        )}
        animate={
          isIdle
            ? { 
                scale: [1, 1.08, 1.02, 1.06, 1],
                opacity: [0.4, 0.55, 0.45, 0.5, 0.4],
              }
            : isFlipping 
              ? { scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] } 
              : showResult
                ? { scale: [1, 1.3, 1.1], opacity: [0.5, 1, 0.7] }
                : { scale: 1, opacity: 0.4 }
        }
        transition={
          isIdle 
            ? { duration: 4, ease: "easeInOut", repeat: Infinity }
            : { duration: 0.8, ease: [0.12, 0.82, 0.18, 1] }
        }
      />
      
      {/* Inner golden rim glow */}
      <motion.div
        className={cn(
          "absolute rounded-full blur-[60px]",
          isWin
            ? "h-[20rem] w-[20rem] bg-[#ffec8b]/40"
            : isLoss
              ? "h-[18rem] w-[18rem] bg-[#ff6b6b]/20"
              : "h-[18rem] w-[18rem] bg-[#d4af37]/20"
        )}
        animate={
          isIdle
            ? { 
                scale: [1, 1.12, 1.05, 1.1, 1],
                opacity: [0.3, 0.45, 0.35, 0.42, 0.3],
              }
            : isFlipping 
              ? { scale: [1, 1.3, 1.1], opacity: [0.3, 0.6, 0.4] } 
              : showResult
                ? { scale: [1, 1.4, 1.15], opacity: [0.4, 0.8, 0.5] }
                : { scale: 1, opacity: 0.3 }
        }
        transition={
          isIdle 
            ? { duration: 3.5, ease: "easeInOut", repeat: Infinity, delay: 0.5 }
            : { duration: 0.8, ease: [0.12, 0.82, 0.18, 1] }
        }
      />

      {/* Reflection shimmer on idle */}
      {isIdle && (
        <motion.div
          className="absolute h-[22rem] w-[8rem] rotate-[25deg] rounded-full bg-gradient-to-b from-transparent via-white/10 to-transparent blur-2xl"
          animate={{
            x: [-150, 150],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 2,
          }}
        />
      )}

      {/* Win/Lose particles */}
      <AnimatePresence>
        {showResult && (
          <>
            {[...Array(isWin ? 24 : 12)].map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "absolute rounded-full",
                  isWin ? "h-2 w-2 bg-[#ffd700]" : "h-1.5 w-1.5 bg-[#dc2626]"
                )}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ 
                  x: Math.cos((i / (isWin ? 24 : 12)) * Math.PI * 2) * (isWin ? 300 : 180),
                  y: Math.sin((i / (isWin ? 24 : 12)) * Math.PI * 2) * (isWin ? 300 : 180),
                  opacity: 0,
                  scale: 0
                }}
                transition={{ duration: isWin ? 1.2 : 0.7, ease: "easeOut", delay: i * 0.02 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* 3D Coin container - BIGGER SIZE */}
      <div className="relative z-10 h-72 w-72" style={{ transformStyle: "preserve-3d" }}>
        {/* Idle floating wrapper */}
        <motion.div
          className="h-full w-full"
          animate={
            isIdle
              ? { y: [0, -12, 0, -8, 0] }
              : { y: 0 }
          }
          transition={
            isIdle
              ? { duration: 4, ease: "easeInOut", repeat: Infinity }
              : { duration: 0.3 }
          }
        >
          {/* Flip rotation wrapper */}
          <motion.div
            className="relative h-full w-full"
            style={{ transformStyle: "preserve-3d" }}
            animate={
              isFlipping
                ? { rotateX: [0, 1440 + resultRotation] } // 4 fast rotations + land on result
                : showResult
                  ? { rotateX: resultRotation }
                  : { rotateX: 0 }
            }
            transition={
              isFlipping
                ? { duration: 1.1, ease: [0.2, 0.8, 0.3, 1] } // Fast spin, smooth deceleration
                : { duration: 0.4, ease: [0.12, 0.82, 0.18, 1] }
            }
          >
            {/* Heads side (front) */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <motion.img 
                src="/birb_heads.png"
                alt="heads"
                className="h-72 w-72 object-contain"
                animate={
                  isIdle
                    ? { 
                        filter: [
                          "drop-shadow(0 0 40px rgba(255,215,0,0.4))",
                          "drop-shadow(0 0 60px rgba(255,215,0,0.6))",
                          "drop-shadow(0 0 45px rgba(255,215,0,0.45))",
                          "drop-shadow(0 0 55px rgba(255,215,0,0.55))",
                          "drop-shadow(0 0 40px rgba(255,215,0,0.4))",
                        ]
                      }
                    : showResult && result === "heads"
                      ? { filter: "drop-shadow(0 0 80px rgba(255,215,0,0.8))" }
                      : { filter: "drop-shadow(0 0 30px rgba(255,215,0,0.3))" }
                }
                transition={
                  isIdle
                    ? { duration: 3, ease: "easeInOut", repeat: Infinity }
                    : { duration: 0.5 }
                }
              />
            </div>

            {/* Tails side (back) */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
            >
              <img 
                src="/birb_tails.png"
                alt="tails"
                className={cn(
                  "h-72 w-72 object-contain",
                  showResult && result === "tails" 
                    ? "drop-shadow-[0_0_80px_rgba(255,180,100,0.8)]"
                    : "drop-shadow-[0_0_30px_rgba(255,180,100,0.3)]"
                )}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Result indicator badge */}
        <AnimatePresence>
          {showResult && result && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.12, 0.82, 0.18, 1] }}
              className={cn(
                "absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full px-6 py-2.5 font-heading text-base font-black uppercase tracking-wider shadow-lg",
                isWin
                  ? "bg-[#ffd700] text-[#1a1510] shadow-[0_0_30px_rgba(255,215,0,0.7)]"
                  : "bg-[#dc2626] text-white shadow-[0_0_30px_rgba(220,38,38,0.6)]"
              )}
            >
              {result}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shadow - responds to coin height */}
      <motion.div
        className="pointer-events-none absolute bottom-4 h-6 w-[16rem] rounded-full bg-black/70 blur-2xl"
        animate={
          isIdle
            ? { 
                scaleX: [1, 0.92, 1, 0.95, 1],
                opacity: [0.5, 0.4, 0.5, 0.42, 0.5],
              }
            : isFlipping 
              ? { scaleX: [1, 0.6, 0.8, 0.7, 1], opacity: [0.5, 0.25, 0.35, 0.3, 0.5] } 
              : { scaleX: 1, opacity: 0.5 }
        }
        transition={
          isIdle
            ? { duration: 4, ease: "easeInOut", repeat: Infinity }
            : { duration: 1.1, ease: [0.12, 0.82, 0.18, 1] }
        }
      />
    </div>
  );
}

export default function CoinflipPage() {
  const [deposit, setDeposit] = useState("1000");
  const [managedBalance, setManagedBalance] = useState(0);
  const [betAmount, setBetAmount] = useState("100"); // Bet amount per flip
  const [playerChoice, setPlayerChoice] = useState<PlayerChoice>("heads");
  const [flipResult, setFlipResult] = useState<FlipResult | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>("deposit");
  const [currentStreak, setCurrentStreak] = useState(0);
  const [accumulatedGold, setAccumulatedGold] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTokenRain, setShowTokenRain] = useState(false);

  // Lifetime stats
  const [totalBirbPlayed, setTotalBirbPlayed] = useState(8240);
  const [allTimeGold, setAllTimeGold] = useState(15678);
  const [totalFlips, setTotalFlips] = useState(24);
  const [totalWins, setTotalWins] = useState(15);
  const [bestStreak, setBestStreak] = useState(4);
  const [lockedGold, setLockedGold] = useState(12450);

  // Team state
  const [userTeam, setUserTeam] = useState<{ name: string; code: string; totalVolume: number; rank?: number; members: string[] } | null>(null);

  useEffect(() => {
    const savedTeam = localStorage.getItem("birb-team");
    if (savedTeam) {
      try {
        setUserTeam(JSON.parse(savedTeam));
      } catch (e) {
        console.error("Failed to parse saved team", e);
      }
    }
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "birb-team") {
        if (e.newValue) {
          try {
            setUserTeam(JSON.parse(e.newValue));
          } catch (err) {
            console.error("Failed to parse team from storage event", err);
          }
        } else {
          setUserTeam(null);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const { playFlipSound, playWinSound, playLoseSound, playLockInSound } = useSoundEffects();
  const { isMuted, toggleMute, volume, handleVolumeChange } = useLofiMusic();

  const depositNum = Math.max(0, Number(deposit) || 0);
  const betAmountNum = Math.min(Math.max(0, Number(betAmount) || 0), managedBalance);
  const dayMultiplier = getBaseGoldMultiplier(currentDay);
  const currentGoldRate = getGoldRate(currentStreak, dayMultiplier);
  const currentGoldRateNum = getGoldRateNum(currentStreak, dayMultiplier);
  const nextGoldRate = getGoldRate(currentStreak + 1, dayMultiplier);
  const potentialGold = Math.round(betAmountNum * currentGoldRateNum);

  const isFlipping = gamePhase === "flipping";

  // Handle deposit
  function handleDeposit() {
    if (depositNum <= 0) return;
    setGamePhase("receiving");
    setTimeout(() => {
      setManagedBalance(depositNum);
      setBetAmount(String(Math.min(100, depositNum))); // Default bet to 100 or deposit amount
      setGamePhase("ready");
    }, 1500);
  }

  // Handle flip
  function handleFlip() {
    if (gamePhase !== "ready" || betAmountNum <= 0) return;
    
    playFlipSound();
    setGamePhase("flipping");
    setFlipResult(null);

    // Quick dramatic flip - 1.2 seconds
    setTimeout(() => {
      const result: FlipResult = Math.random() < 0.5 ? "heads" : "tails";
      setFlipResult(result);
      
      const won = result === playerChoice;
      
      if (won) {
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        const goldEarned = Math.round(betAmountNum * getGoldRateNum(currentStreak, dayMultiplier));
        setAccumulatedGold(prev => prev + goldEarned);
        
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
        }
        
        playWinSound(newStreak > 1);
        
        if (newStreak >= 3) {
          setShowTokenRain(true);
          setTimeout(() => setShowTokenRain(false), 4000);
        }

        setTotalWins(prev => prev + 1);
        
        setLog(prev => [{
          choice: playerChoice,
          result,
          outcome: "win",
          streak: newStreak,
          goldRate: getGoldRate(currentStreak, dayMultiplier),
          goldEarned: goldEarned,
          deposit: betAmountNum,
        }, ...prev].slice(0, 50));
      } else {
        playLoseSound();
        // Lose the bet amount on miss
        setManagedBalance(prev => prev - betAmountNum);
        setAccumulatedGold(0);
        setCurrentStreak(0);
        
        setLog(prev => [{
          choice: playerChoice,
          result,
          outcome: "lose",
          streak: 0,
          goldRate: getGoldRate(currentStreak, dayMultiplier),
          goldEarned: 0,
          deposit: betAmountNum,
        }, ...prev].slice(0, 50));
      }

      setTotalFlips(prev => prev + 1);
      setTotalBirbPlayed(prev => prev + betAmountNum);

      // Update team volume
      if (userTeam) {
        const updatedTeam = {
          ...userTeam,
          totalVolume: userTeam.totalVolume + betAmountNum,
        };
        setUserTeam(updatedTeam);
        localStorage.setItem("birb-team", JSON.stringify(updatedTeam));
      }

      setGamePhase("result");
    }, 1200);
  }

  // Handle double down - keep betting with streak
  function handleDoubleDown() {
    // Double the bet amount for the next flip (capped at balance)
    const newBet = Math.min(betAmountNum * 2, managedBalance);
    setBetAmount(String(newBet));
    setGamePhase("ready");
    setFlipResult(null);
  }

  // Handle lock in
  function handleLockIn() {
    playLockInSound();
    setLockedGold(prev => prev + accumulatedGold);
    setAllTimeGold(prev => prev + accumulatedGold);
    setTotalBirbPlayed(prev => prev + managedBalance);
    setGamePhase("locked");
  }

  // Handle new round - deposit more or continue with balance
  function handleNewRound() {
    if (managedBalance > 0) {
      // Still have balance, just reset streak and continue
      setBetAmount(String(Math.min(100, managedBalance)));
      setCurrentStreak(0);
      setAccumulatedGold(0);
      setFlipResult(null);
      setGamePhase("ready");
    } else {
      // No balance left, go back to deposit
      setDeposit("1000");
      setBetAmount("100");
      setCurrentStreak(0);
      setAccumulatedGold(0);
      setFlipResult(null);
      setGamePhase("deposit");
    }
  }

  // Handle try again after loss
  function handleTryAgain() {
    handleNewRound();
  }

  function resetLog() {
    setLog([]);
  }

  // Determine outcome for display
  const lastOutcome = log.length > 0 ? log[0] : null;
  const showOutcome = gamePhase === "result" || gamePhase === "locked";
  const isWin = lastOutcome?.outcome === "win";
  const isLoss = lastOutcome?.outcome === "lose";

  const buttonLabel = (() => {
    switch (gamePhase) {
      case "deposit": return "Deposit BIRB";
      case "receiving": return "Processing...";
      case "ready": return "FLIP";
      case "flipping": return "Flipping...";
      case "result": return isWin ? "Choose Action" : "Try Again";
      case "locked": return "Start New Round";
      default: return "Deposit BIRB";
    }
  })();

  const buttonDisabled = gamePhase === "receiving" || gamePhase === "flipping" || (gamePhase === "deposit" && depositNum <= 0) || (gamePhase === "ready" && betAmountNum <= 0);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#0a0604_0%,#140e0c_50%,#0a0604_100%)] text-white font-sans">
      <TokenRain active={showTokenRain} />
      
      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-8">
        {/* ── Header ── */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="birb" className="h-8 w-auto object-contain md:h-10" />
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">
              Coinflip
            </div>
            {/* Navigation Links */}
            <nav className="ml-4 flex items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-[#ecd9ba]/20 bg-[#ecd9ba]/5 px-3 py-1.5 text-xs font-medium text-[#ecd9ba]/80 transition hover:border-[#ecd9ba]/40 hover:bg-[#ecd9ba]/10 hover:text-[#ecd9ba]"
              >
                Prism
              </Link>
              <Link
                href="/teams"
                className="rounded-full border border-[#ecd9ba]/20 bg-[#ecd9ba]/5 px-3 py-1.5 text-xs font-medium text-[#ecd9ba]/80 transition hover:border-[#ecd9ba]/40 hover:bg-[#ecd9ba]/10 hover:text-[#ecd9ba]"
              >
                Teams
              </Link>
            </nav>
          </div>
          <div className="hidden items-center gap-3 md:flex">
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

        {/* ── Main Game Section - 2 Column Layout ── */}
        <section className="grid flex-1 gap-10 py-8 lg:grid-cols-2 lg:py-12">
          {/* Left Column - Coin Game Area */}
          <div className="order-2 flex flex-col lg:order-1">
            <div className="mb-6 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d12429]/30 bg-[#d12429]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ecd9ba]/80">
                Birb Coinflip
              </div>
              <h1 className="font-heading text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
                Call it.
                <span className="block bg-gradient-to-r from-white via-[#ecd9ba] to-[#d12429] bg-clip-text text-transparent">
                  Stack your streak.
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/70 md:text-lg">
                Pick heads or tails, flip the coin. Win to build your streak and multiply your gold rate. Miss and lose it all.
              </p>
            </div>

            {/* ── Coin Container ── */}
            <div className="relative flex min-h-[28rem] flex-1 items-center justify-center rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl">
              {/* Flash effect */}
              <AnimatePresence>
                {isFlipping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.55, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, times: [0, 0.3, 1] }}
                    className="pointer-events-none absolute inset-0 rounded-[2.25rem] bg-[radial-gradient(circle_at_center,rgba(255,244,230,0.35),transparent_40%)]"
                  />
                )}
              </AnimatePresence>

              {/* Result glow */}
              <AnimatePresence>
                {showOutcome && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-[2.25rem]",
                      isWin
                        ? "bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.4),rgba(255,236,139,0.18)_40%,transparent_70%)] shadow-[inset_0_0_100px_rgba(255,215,0,0.25)]"
                        : "bg-[radial-gradient(circle_at_center,rgba(209,36,41,0.25),rgba(125,5,13,0.1)_40%,transparent_70%)] shadow-[inset_0_0_80px_rgba(209,36,41,0.15)]"
                    )}
                  />
                )}
              </AnimatePresence>

              <Coin
                isFlipping={isFlipping}
                result={flipResult}
                gamePhase={gamePhase}
                playerChoice={playerChoice}
              />
            </div>
          </div>

          {/* Right Column - Controls */}
          <div className="order-1 flex flex-col lg:order-2">
            <div className="flex flex-1 flex-col rounded-[2.2rem] border border-[#ecd9ba]/10 bg-[linear-gradient(180deg,rgba(236,217,186,0.06),rgba(236,217,186,0.02))] p-6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:p-7">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[#ecd9ba]/50">Birb Coinflip</div>
                  <div className="mt-1 font-heading text-2xl font-black tracking-tight">Call. Flip. Stack.</div>
                </div>
                {/* Current streak badge */}
                {currentStreak > 0 && (
                  <div className="rounded-full border border-[#ffd700]/30 bg-[#ffd700]/10 px-3 py-1.5">
                    <span className="text-xs font-bold text-[#ffd700]">{currentStreak} Streak</span>
                  </div>
                )}
              </div>

              {/* ── Team Status Bar ── */}
              {userTeam ? (
                <div className="mb-5 flex items-center justify-between rounded-xl border border-[#d12429]/20 bg-[#d12429]/5 px-4 py-3">
                  <Link href="/teams" className="flex flex-1 items-center gap-3 transition-opacity hover:opacity-80">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d12429]/20">
                      <svg className="h-4 w-4 text-[#d12429]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#ecd9ba]">{userTeam.name}</div>
                      <div className="text-xs text-[#ecd9ba]/50">
                        {userTeam.totalVolume.toLocaleString()} BIRB Volume
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      setUserTeam(null);
                      localStorage.removeItem("birb-team");
                    }}
                    className="rounded-lg border border-[#ecd9ba]/20 bg-[#ecd9ba]/5 px-2 py-1 text-xs text-[#ecd9ba]/60 transition-colors hover:bg-[#ecd9ba]/10 hover:text-[#ecd9ba]"
                  >
                    Leave
                  </button>
                </div>
              ) : (
                <Link
                  href="/teams"
                  className="mb-5 flex items-center justify-between rounded-xl border border-[#ecd9ba]/10 bg-[#ecd9ba]/5 px-4 py-3 transition-all hover:bg-[#ecd9ba]/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ecd9ba]/10">
                      <svg className="h-4 w-4 text-[#ecd9ba]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#ecd9ba]">Join a Team</div>
                      <div className="text-xs text-[#ecd9ba]/50">Compete for Top 10 rewards</div>
                    </div>
                  </div>
                  <svg className="h-4 w-4 text-[#ecd9ba]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}

              {/* ── Deposit / Managed Balance ── */}
              {gamePhase === "deposit" || gamePhase === "receiving" ? (
                <div className={cn(
                  "rounded-[1.6rem] border p-4 shadow-[inset_0_1px_0_rgba(255,245,234,0.04)] transition-colors duration-500",
                  "border-[#ecd9ba]/10 bg-[linear-gradient(180deg,rgba(236,217,186,0.04),rgba(14,8,6,0.42))]"
                )}>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs uppercase tracking-[0.18em] text-white/45">Deposit Amount</label>
                    {gamePhase === "receiving" && (
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
                  </div>
                  <div className="relative">
                    <input
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value.replace(/[^\d]/g, ""))}
                      disabled={gamePhase === "receiving"}
                      className="h-14 w-full rounded-2xl border border-[#f0dcc6]/10 bg-white/5 px-4 pr-20 text-xl font-bold text-white outline-none disabled:opacity-50"
                      placeholder="1000"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/60">BIRB</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Balance Display */}
                  <div className="rounded-[1.2rem] border border-[#ecd9ba]/10 bg-[linear-gradient(180deg,rgba(236,217,186,0.04),rgba(14,8,6,0.42))] p-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-[0.15em] text-white/40">Balance</label>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-heading text-xl font-black text-white">{managedBalance.toLocaleString()}</span>
                        <span className="text-xs font-bold text-white/50">BIRB</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bet Amount Input */}
                  <div className="rounded-[1.6rem] border border-[#d12429]/20 bg-[linear-gradient(180deg,rgba(209,36,41,0.06),rgba(14,8,6,0.42))] p-4 shadow-[inset_0_1px_0_rgba(255,245,234,0.04)]">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs uppercase tracking-[0.18em] text-white/45">Bet Amount</label>
                      <div className="flex items-center gap-2">
                        {[25, 50, 100].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => setBetAmount(String(Math.floor(managedBalance * (pct / 100))))}
                            disabled={isFlipping}
                            className="rounded-lg border border-[#ecd9ba]/15 bg-[#ecd9ba]/5 px-2 py-0.5 text-[10px] font-bold text-[#ecd9ba]/60 transition hover:bg-[#ecd9ba]/10 hover:text-[#ecd9ba] disabled:opacity-50"
                          >
                            {pct}%
                          </button>
                        ))}
                        <button
                          onClick={() => setBetAmount(String(managedBalance))}
                          disabled={isFlipping}
                          className="rounded-lg border border-[#d12429]/25 bg-[#d12429]/10 px-2 py-0.5 text-[10px] font-bold text-[#d12429] transition hover:bg-[#d12429]/20 disabled:opacity-50"
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        value={betAmount}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d]/g, "");
                          const num = Math.min(Number(val) || 0, managedBalance);
                          setBetAmount(String(num));
                        }}
                        disabled={isFlipping}
                        className="h-12 w-full rounded-xl border border-[#f0dcc6]/10 bg-white/5 px-4 pr-20 text-lg font-bold text-white outline-none disabled:opacity-50"
                        placeholder="100"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/50">BIRB</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Heads / Tails Selection ── */}
              {(gamePhase === "ready" || gamePhase === "flipping") && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {(["heads", "tails"] as const).map((choice) => {
                    const active = playerChoice === choice;
                    return (
                      <button
                        key={choice}
                        onClick={() => setPlayerChoice(choice)}
                        disabled={isFlipping}
                        className={cn(
                          "group relative overflow-hidden rounded-[1.6rem] border p-4 text-center transition-all duration-300 shadow-[0_14px_40px_rgba(0,0,0,0.22)] disabled:opacity-50",
                          active 
                            ? "border-[#ffd700]/35 bg-[linear-gradient(180deg,rgba(255,215,0,0.1),rgba(255,215,0,0.05))] ring-1 ring-[#ffd700]/15 shadow-[0_0_20px_rgba(255,215,0,0.1)]" 
                            : "border-[#f0dcc6]/8 bg-[linear-gradient(180deg,rgba(40,30,25,0.5),rgba(18,10,8,0.6))] hover:border-[#f0dcc6]/15 hover:bg-[rgba(40,30,25,0.7)]"
                        )}
                      >
                        <div className={cn(
                          "absolute inset-0 transition-opacity duration-300",
                          active 
                            ? "bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.12),transparent_40%)] opacity-100" 
                            : "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_28%)] opacity-50"
                        )} />
                        <div className="relative">
                          <div className="mb-2 flex justify-center">
                            <img 
                              src={choice === "heads" ? "/birb_heads.png" : "/birb_tails.png"}
                              alt={choice}
                              className={cn(
                                "h-16 w-16 object-contain transition-all duration-300",
                                active ? "opacity-100 drop-shadow-[0_0_12px_rgba(255,215,0,0.4)]" : "opacity-50 grayscale"
                              )}
                            />
                          </div>
                          <div className={cn(
                            "font-heading text-lg font-bold uppercase tracking-wide transition-colors duration-300",
                            active ? "text-[#ffd700]" : "text-white/50"
                          )}>
                            {choice}
                          </div>
                        </div>
                        {active && (
                          <div className="absolute right-3 top-3">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ffd700] text-[#1a1510]">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

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
                    {currentDay <= 5 ? "Grace period - full rate" : currentDay <= 10 ? "Decay starting" : currentDay <= 20 ? "Moderate decay" : "Floor rate"}
                  </div>
                </div>
              </div>

              {/* ── Stats Grid ── */}
              <div className="mt-5 grid grid-cols-4 gap-2">
                <div className={cn(
                  "rounded-xl border px-2 py-3 text-center shadow-[0_8px_20px_rgba(0,0,0,0.15)]",
                  currentStreak > 0
                    ? "border-[#ffd700]/20 bg-[linear-gradient(180deg,rgba(255,215,0,0.08),rgba(255,215,0,0.02))]"
                    : "border-[#f0dcc6]/10 bg-[linear-gradient(180deg,rgba(255,248,240,0.05),rgba(255,244,235,0.02))]"
                )}>
                  <div className="text-[9px] uppercase tracking-[0.15em] text-white/45">Streak</div>
                  <div className={cn("mt-1 font-heading text-base font-bold leading-tight", currentStreak > 0 && "text-[#ffd700]")}>
                    {currentStreak}x
                  </div>
                </div>
                <div className="rounded-xl border border-[#d12429]/15 bg-[linear-gradient(180deg,rgba(209,36,41,0.06),rgba(236,217,186,0.02))] px-2 py-3 text-center shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
                  <div className="text-[9px] uppercase tracking-[0.15em] text-white/45">Rate</div>
                  <div className="mt-1 font-heading text-base font-bold leading-tight text-[#d12429]">{currentGoldRate}</div>
                </div>
                <div className="rounded-xl border border-[#22c55e]/15 bg-[linear-gradient(180deg,rgba(34,197,94,0.06),rgba(34,197,94,0.02))] px-2 py-3 text-center shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
                  <div className="text-[9px] uppercase tracking-[0.15em] text-white/45">Pot</div>
                  <div className="mt-1 font-heading text-base font-bold leading-tight text-[#22c55e]">{potentialGold.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-[#ecd9ba]/15 bg-[linear-gradient(180deg,rgba(236,217,186,0.06),rgba(236,217,186,0.02))] px-2 py-3 text-center shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
                  <div className="text-[9px] uppercase tracking-[0.15em] text-white/45">Bet</div>
                  <div className="mt-1 font-heading text-base font-bold leading-tight text-[#ecd9ba]">{betAmountNum.toLocaleString()}</div>
                </div>
              </div>

              {/* ── Info callout ── */}
              <div className="mt-5 rounded-[1.5rem] border border-[#d4a06c]/20 bg-[#d4a06c]/10 p-4 text-sm text-[#f0dcc6]">
                {gamePhase === "ready" 
                  ? `Betting ${betAmountNum.toLocaleString()} BIRB. Win for ${potentialGold.toLocaleString()} Gold at ${currentGoldRate}. Next streak: ${nextGoldRate}.`
                  : gamePhase === "result" && isWin
                    ? `Streak ${currentStreak}! Lock in ${accumulatedGold.toLocaleString()} Gold or double down (2x bet) for ${nextGoldRate} rate.`
                    : gamePhase === "result" && isLoss
                      ? `Lost ${log[0]?.deposit?.toLocaleString() || 0} BIRB. ${managedBalance > 0 ? `${managedBalance.toLocaleString()} BIRB remaining.` : "Balance depleted."}`
                      : "Deposit BIRB to start. Set your bet, build streaks to multiply your gold rate."}
              </div>

              {/* Spacer */}
              <div className="flex-1 min-h-4" />

              {/* ── Main Action Button ── */}
              {gamePhase === "deposit" || gamePhase === "receiving" ? (
                <button
                  onClick={handleDeposit}
                  disabled={buttonDisabled}
                  className={cn(
                    "mt-5 h-14 w-full rounded-2xl font-heading text-base font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50",
                    "bg-[#d12429] hover:bg-[#7d050d]"
                  )}
                >
                  {gamePhase === "receiving" ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                      />
                      Receiving deposit...
                    </span>
                  ) : (
                    "Deposit BIRB"
                  )}
                </button>
              ) : gamePhase === "ready" || gamePhase === "flipping" ? (
                <button
                  onClick={handleFlip}
                  disabled={isFlipping}
                  className={cn(
                    "mt-5 h-14 w-full rounded-2xl font-heading text-base font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50",
                    "bg-[linear-gradient(135deg,#7d050d,#d12429)] hover:brightness-110 shadow-[0_0_24px_rgba(209,36,41,0.3)]"
                  )}
                >
                  {isFlipping ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                        className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                      />
                      Flipping...
                    </span>
                  ) : (
                    "FLIP"
                  )}
                </button>
              ) : gamePhase === "locked" ? (
                <button
                  onClick={handleNewRound}
                  className="mt-5 h-14 w-full rounded-2xl bg-[#22c55e] font-heading text-base font-bold text-white transition hover:bg-[#16a34a] shadow-[0_0_24px_rgba(34,197,94,0.3)]"
                >
                  Start New Round
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {/* ── Outcome and History Section ── */}
        <section className="relative mx-auto w-full max-w-7xl px-0 pb-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* ── Outcome Panel ── */}
            <AnimatePresence mode="wait">
              {showOutcome && lastOutcome ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={cn(
                    "relative overflow-hidden rounded-[2rem] border p-6",
                    isWin
                      ? "border-[#ffd700]/25 bg-[linear-gradient(180deg,rgba(255,215,0,0.08),rgba(20,14,12,0.95))]"
                      : "border-[#dc2626]/20 bg-[linear-gradient(180deg,rgba(220,38,38,0.08),rgba(20,14,12,0.95))]"
                  )}
                >
                  {/* Radial glow */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.5, 0.25] }}
                    transition={{ duration: 1.5, times: [0, 0.3, 1] }}
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-[2rem]",
                      isWin
                        ? "bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,0,0.25),transparent_60%)]"
                        : "bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.18),transparent_60%)]"
                    )}
                  />
                  
                  {/* Watermark */}
                  <img 
                    src="/images/birblogo-transparent.png" 
                    alt="" 
                    className="pointer-events-none absolute right-4 top-1/2 h-28 w-auto -translate-y-1/2 object-contain opacity-50 md:h-36"
                  />

                  <div className="relative z-10">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Outcome</div>
                    <div className={cn(
                      "mt-2 font-heading text-3xl font-black md:text-4xl",
                      isWin
                        ? "bg-gradient-to-r from-[#ffd700] via-[#ffec8b] to-[#ffd700] bg-clip-text text-transparent"
                        : "text-red-400"
                    )}>
                      {isWin ? `${currentStreak} Streak! Gold earned.` : `Lost ${lastOutcome.deposit.toLocaleString()} BIRB`}
                    </div>
                    <div className="mt-3 text-sm leading-6 text-white/65">
                      You called {lastOutcome.choice}. Coin landed {flipResult}.
                      {isWin && (
                        <span className="ml-1 font-bold text-[#ffd700]">
                          +{lastOutcome.goldEarned.toLocaleString()} Gold at {lastOutcome.goldRate}
                        </span>
                      )}
                      {isLoss && managedBalance > 0 && (
                        <span className="ml-1 text-white/50">
                          {managedBalance.toLocaleString()} BIRB remaining.
                        </span>
                      )}
                    </div>

                    {/* Action buttons for win state */}
                    {isWin && gamePhase === "result" && (
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={handleLockIn}
                          className="flex-1 rounded-xl bg-[#ffd700] py-3 font-heading text-sm font-bold text-[#1a1510] transition hover:bg-[#ffec8b] shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                        >
                          Lock In {accumulatedGold.toLocaleString()} Gold
                        </button>
                        <button
                          onClick={handleDoubleDown}
                          className="flex-1 rounded-xl border border-[#d12429]/50 bg-[#d12429]/20 py-3 font-heading text-sm font-bold text-[#d12429] transition hover:bg-[#d12429]/30"
                        >
                          2x Bet ({nextGoldRate})
                        </button>
                      </div>
                    )}

                    {/* Try again button for loss state */}
                    {isLoss && gamePhase === "result" && (
                      <div className="mt-4">
                        <button
                          onClick={handleTryAgain}
                          className="w-full rounded-xl bg-[#d12429] py-3 font-heading text-sm font-bold text-white transition hover:bg-[#7d050d]"
                        >
                          {managedBalance > 0 ? "Continue Playing" : "Deposit More"}
                        </button>
                      </div>
                    )}

                    {/* Locked state confirmation */}
                    {gamePhase === "locked" && (
                      <div className="mt-4 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 p-4">
                        <div className="text-center">
                          <div className="text-xs uppercase tracking-wider text-[#22c55e]/60">Locked In</div>
                          <div className="font-heading text-2xl font-black text-[#22c55e]">{accumulatedGold.toLocaleString()} Gold</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Share button */}
                  {isWin && (
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="absolute bottom-5 right-5 flex items-center gap-2 rounded-xl border border-[#ffd700]/30 bg-[#ffd700]/10 px-3 py-1.5 text-xs font-medium text-[#ffd700] transition-colors hover:bg-[#ffd700]/20"
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
                    <div className="mt-2 text-sm text-white/20">Flip to see results</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Right Column: Stats + History ── */}
            <div className="flex flex-col gap-4">
              {/* ── Player Stats Grid ── */}
              <div className="grid grid-cols-5 gap-2 rounded-[1.5rem] border border-[#f0dcc6]/10 bg-[linear-gradient(180deg,rgba(20,14,12,0.95),rgba(14,8,6,0.98))] p-3">
                {/* Best Streak */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-[#ffd700]/15 bg-[#ffd700]/5 p-2.5">
                  <svg className="mb-1 h-4 w-4 text-[#ffd700]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <span className="text-sm font-bold text-[#ffd700]">{bestStreak}</span>
                  <span className="text-[8px] uppercase tracking-wider text-[#ffd700]/50">Streak</span>
                </div>

                {/* BIRB Played */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-[#ecd9ba]/15 bg-[#ecd9ba]/5 p-2.5">
                  <img src="/birb_heads.png" alt="" className="mb-1 h-4 w-4" />
                  <span className="text-sm font-bold text-[#ecd9ba]">{(totalBirbPlayed / 1000).toFixed(1)}k</span>
                  <span className="text-[8px] uppercase tracking-wider text-[#ecd9ba]/50">Played</span>
                </div>

                {/* All Time Gold */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-[#22c55e]/15 bg-[#22c55e]/5 p-2.5">
                  <svg className="mb-1 h-4 w-4 text-[#ffd700]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <span className="text-sm font-bold text-[#22c55e]">{(allTimeGold / 1000).toFixed(1)}k</span>
                  <span className="text-[8px] uppercase tracking-wider text-[#22c55e]/50">Gold</span>
                </div>

                {/* Win Rate */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-[#8b5cf6]/15 bg-[#8b5cf6]/5 p-2.5">
                  <svg className="mb-1 h-4 w-4 text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                  <span className="text-sm font-bold text-[#8b5cf6]">{totalFlips > 0 ? Math.round((totalWins / totalFlips) * 100) : 0}%</span>
                  <span className="text-[8px] uppercase tracking-wider text-[#8b5cf6]/50">WR</span>
                </div>

                {/* Locked Gold */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-[#ffd700]/15 bg-[#ffd700]/5 p-2.5">
                  <svg className="mb-1 h-4 w-4 text-[#ffd700]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="text-sm font-bold text-[#ffd700]">{(lockedGold / 1000).toFixed(1)}k</span>
                  <span className="text-[8px] uppercase tracking-wider text-[#ffd700]/50">Locked</span>
                </div>
              </div>

              {/* ── History Panel ── */}
              <div className="relative flex-1 overflow-hidden rounded-[2rem] border border-[#f0dcc6]/10 bg-[linear-gradient(180deg,rgba(20,14,12,0.95),rgba(14,8,6,0.98))] p-5">
                <img 
                  src="/images/birblogo-transparent.png" 
                  alt="" 
                  className="pointer-events-none absolute -right-4 bottom-0 h-32 w-auto object-contain opacity-25"
                />
                <div className="relative z-10 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">Flip History</div>
                    {log.length > 0 && (
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <span className="text-[#ffd700]">{log.filter((l) => l.outcome === "win").length}W</span>
                        <span className="text-white/25">·</span>
                        <span className="text-white/45">{log.filter((l) => l.outcome === "lose").length}L</span>
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
                    No flips yet
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                      {log.map((entry, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex-shrink-0 min-w-[100px] rounded-xl border px-4 py-3",
                            entry.outcome === "win"
                              ? "border-[#ffd700]/25 bg-[#ffd700]/[0.08]"
                              : "border-red-500/20 bg-red-500/[0.05]"
                          )}
                        >
                          <div className="flex items-center gap-2 text-[10px] text-white/45 mb-1.5">
                            <span className="font-medium">#{log.length - i}</span>
                            <span className="text-white/30 uppercase">{entry.choice}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white/60 uppercase">{entry.result}</span>
                            {entry.outcome === "win" ? (
                              <span className="text-sm font-bold text-[#ffd700]">
                                +{entry.goldEarned}
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold uppercase tracking-wider text-red-400/70">
                                BUST
                              </span>
                            )}
                          </div>
                          {entry.streak > 1 && entry.outcome === "win" && (
                            <div className="mt-1 text-[10px] text-[#ffd700]/60">
                              {entry.streak}x streak
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
        {showShareModal && isWin && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            birbDeposit={lastOutcome?.deposit || betAmountNum}
            goldEarned={accumulatedGold}
            streak={currentStreak}
            goldRate={currentGoldRate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
