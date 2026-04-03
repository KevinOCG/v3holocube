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
    
    // Initial flip whoosh
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 0.2);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);

    // Continuous coin spinning clicks
    let clickCount = 0;
    const maxClicks = 35;
    const spinInterval = setInterval(() => {
      clickCount++;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      
      // Slow down the clicking sound over time
      const pitch = 800 - (clickCount / maxClicks) * 400;
      osc.frequency.setValueAtTime(pitch + Math.random() * 100, ctx.currentTime);
      
      const vol = 0.15 - (clickCount / maxClicks) * 0.1;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
      
      if (clickCount >= maxClicks) clearInterval(spinInterval);
    }, 70);

    setTimeout(() => clearInterval(spinInterval), 2800);
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

    // Extra shimmer for streaks
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
    
    // Dramatic descending notes for loss
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
    
    // Satisfying lock-in chime
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
  const totalDays = 28;
  
  if (day <= gracePeriod) {
    // Flat 100% during grace period
    return 1.0;
  }
  
  // Steeper exponential decay after grace period
  const floor = 0.20; // Lower floor than prism
  const daysAfterGrace = day - gracePeriod;
  const decayDays = totalDays - gracePeriod;
  const k = 0.12; // Steeper decay constant
  
  return floor + (1 - floor) * Math.exp(-k * daysAfterGrace);
}

/* ── Streak Multiplier: 2x, 4x, 8x, 16x... ── */
function getStreakMultiplier(streak: number): number {
  return Math.pow(2, streak);
}

function getGoldRateNum(streak: number, dayMultiplier: number): number {
  const baseRate = 1.5; // Base rate for winning a flip
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
      console.error('Failed to generate image:', err);
    }
    setCopying(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative z-10 w-full max-w-md"
      >
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1210] text-white/60 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div
          ref={cardRef}
          className="overflow-hidden rounded-3xl border border-[#ffd700]/20 bg-black"
        >
          <div className="relative px-8 pt-8 pb-6">
            <img 
              src="/images/birb-gold.jpg" 
              alt="" 
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
            />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ffd700] to-[#ff8c00] px-3 py-1 text-xs font-bold uppercase tracking-wider text-black">
                {streak > 0 && <span>{streak}x STREAK</span>}
                <span>LOCKED IN</span>
              </div>
              <h2 className="mt-4 font-heading text-5xl font-black tracking-tight text-white">
                Birbish AF
              </h2>
              <p className="mt-1 text-lg text-white/60">I locked in GOLD on coinflip</p>
            </div>
          </div>

          <div className="border-t border-[#ffd700]/10 bg-black px-8 py-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/40">Deposited</div>
                <div className="mt-1 font-heading text-2xl font-bold text-white">
                  {birbDeposit.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-white/40">Rate</div>
                <div className="mt-1 font-heading text-2xl font-bold text-[#ffd700]">
                  {goldRate}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-white/40">Gold</div>
                <div className="mt-1 font-heading text-2xl font-bold bg-gradient-to-r from-[#ffd700] via-[#ffec8b] to-[#ffd700] bg-clip-text text-transparent">
                  +{goldEarned.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

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

/* ── Token Rain Animation ── */
function TokenRain({ isActive }: { isActive: boolean }) {
  const tokens = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2.5 + Math.random() * 2,
      size: 20 + Math.random() * 28,
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

  return (
    <div className="relative h-12 w-full">
      <svg ref={svgRef} viewBox="-2 -5 104 110" className="h-full w-full" preserveAspectRatio="none">
        {/* Grace period indicator */}
        <rect x="0" y="-5" width={((5 - 1) / 27) * 100} height="110" fill="rgba(34,197,94,0.08)" />
        <line x1="0" y1="0" x2="0" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        <line x1="100" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        {/* Grace period end line */}
        <line 
          x1={((5 - 1) / 27) * 100} 
          y1="0" 
          x2={((5 - 1) / 27) * 100} 
          y2="100" 
          stroke="rgba(34,197,94,0.3)" 
          strokeWidth="1" 
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke" 
        />
        <polyline points={points} fill="none" stroke="url(#goldGradCoin)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <polyline points={`0,0 ${points} 100,${(1 - getBaseGoldMultiplier(28)) * 100} 100,100 0,100`} fill="url(#goldFillCoin)" />
        <defs>
          <linearGradient id="goldGradCoin" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="18%" stopColor="#22c55e" />
            <stop offset="20%" stopColor="#ffd700" />
            <stop offset="100%" stopColor="#d12429" />
          </linearGradient>
          <linearGradient id="goldFillCoin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,215,0,0.12)" />
            <stop offset="100%" stopColor="rgba(255,215,0,0)" />
          </linearGradient>
        </defs>
      </svg>
      <div 
        className={cn(
          "absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_8px_rgba(255,215,0,0.6)]",
          currentDay <= 5 ? "bg-[#22c55e]" : "bg-[#ffd700]"
        )}
        style={{ left: circlePos.x, top: circlePos.y }}
      >
        <div className={cn(
          "absolute inset-[-4px] rounded-full border",
          currentDay <= 5 ? "border-[#22c55e]/40" : "border-[#ffd700]/40"
        )} />
      </div>
    </div>
  );
}

/* ── Spinning Coin Component ── */
function SpinningCoin({
  isFlipping,
  flipPhase,
  result,
  playerChoice,
}: {
  isFlipping: boolean;
  flipPhase: "idle" | "spinning" | "slowing" | "done";
  result: FlipResult | null;
  playerChoice: PlayerChoice | null;
}) {
  const [rotations, setRotations] = useState(0);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (flipPhase === "spinning" || flipPhase === "slowing") {
      startTimeRef.current = performance.now();
      
      const animate = (now: number) => {
        const elapsed = now - startTimeRef.current;
        
        if (flipPhase === "spinning") {
          // Fast spinning - 10 rotations per second
          setRotations(elapsed * 0.01 * 360);
        } else if (flipPhase === "slowing") {
          // Slowing down - ease out over 1.5 seconds
          const slowDuration = 1500;
          const progress = Math.min(elapsed / slowDuration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          
          // Determine final rotation based on result
          const finalRotation = result === "heads" ? 0 : 180;
          const startRotation = rotations % 360;
          const targetRotation = startRotation + (3 * 360) + finalRotation; // 3 more full rotations then land
          
          setRotations(startRotation + (targetRotation - startRotation) * eased);
          
          if (progress >= 1) {
            return;
          }
        }
        
        animRef.current = requestAnimationFrame(animate);
      };
      
      animRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animRef.current) cancelAnimationFrame(animRef.current);
      };
    } else if (flipPhase === "idle") {
      setRotations(0);
    }
  }, [flipPhase, result]);

  const showHeads = result === "heads" || (!result && Math.floor(rotations / 180) % 2 === 0);
  const isWin = result && playerChoice && result === playerChoice;
  const isLoss = result && playerChoice && result !== playerChoice;

  return (
    <div className="relative flex h-[28rem] w-full items-center justify-center">
      {/* Background glow */}
      <motion.div
        className={cn(
          "absolute h-[24rem] w-[24rem] rounded-full blur-3xl",
          isWin 
            ? "bg-[#ffd700]/40" 
            : isLoss 
              ? "bg-[#dc2626]/25" 
              : "bg-[#7c5237]/25"
        )}
        animate={
          isFlipping 
            ? { scale: [1, 1.2, 1.05], opacity: [0.5, 0.8, 0.6] }
            : isWin
              ? { scale: [1, 1.3, 1.15], opacity: [0.6, 1, 0.7] }
              : { scale: 1, opacity: 0.5 }
        }
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Win particles */}
      <AnimatePresence>
        {isWin && flipPhase === "done" && (
          <>
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-3 w-3 rounded-full bg-[#ffd700]"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 1, 
                  scale: 1 
                }}
                animate={{ 
                  x: Math.cos((i / 16) * Math.PI * 2) * 250,
                  y: Math.sin((i / 16) * Math.PI * 2) * 250,
                  opacity: 0,
                  scale: 0
                }}
                transition={{ duration: 1.5, ease: "easeOut", delay: i * 0.03 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* The Coin */}
      <div 
        className="relative"
        style={{ 
          perspective: "1000px",
        }}
      >
        <motion.div
          className="relative h-56 w-56"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${rotations}deg)`,
          }}
          animate={
            flipPhase === "done" && isWin
              ? { scale: [1, 1.1, 1.05] }
              : flipPhase === "done" && isLoss
                ? { scale: [1, 0.95, 1] }
                : { scale: 1 }
          }
          transition={{ duration: 0.5 }}
        >
          {/* Heads side */}
          <div 
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-full border-4 shadow-[0_0_60px_rgba(255,200,100,0.3)]",
              "bg-gradient-to-br from-[#ffd700] via-[#ffec8b] to-[#daa520]",
              "border-[#b8860b]"
            )}
            style={{
              backfaceVisibility: "hidden",
            }}
          >
            {/* Placeholder for user's coin asset - Heads */}
            <div className="flex flex-col items-center justify-center">
              <img 
                src="/images/birb-token.png" 
                alt="Heads" 
                className="h-36 w-36 object-contain drop-shadow-lg"
              />
              <div className="absolute bottom-4 font-heading text-lg font-black text-[#8b4513] uppercase tracking-wider">
                Heads
              </div>
            </div>
          </div>

          {/* Tails side */}
          <div 
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-full border-4 shadow-[0_0_60px_rgba(255,200,100,0.3)]",
              "bg-gradient-to-br from-[#c0c0c0] via-[#e8e8e8] to-[#a0a0a0]",
              "border-[#808080]"
            )}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Placeholder for user's coin asset - Tails */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-[#4a4a4a] to-[#2a2a2a]">
                <span className="font-heading text-6xl font-black text-[#c0c0c0]">B</span>
              </div>
              <div className="absolute bottom-4 font-heading text-lg font-black text-[#4a4a4a] uppercase tracking-wider">
                Tails
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Shadow */}
      <motion.div
        className="pointer-events-none absolute bottom-8 h-8 w-48 rounded-full bg-black/40 blur-2xl"
        animate={isFlipping ? { scaleX: [1, 0.6, 1], opacity: [0.4, 0.2, 0.4] } : { scaleX: 1, opacity: 0.4 }}
        transition={{ duration: 0.5, repeat: isFlipping ? Infinity : 0 }}
      />
    </div>
  );
}

/* ── Streak Display ── */
function StreakDisplay({ streak, maxStreak }: { streak: number; maxStreak: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(Math.min(maxStreak, 8))].map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "h-3 w-3 rounded-full transition-all",
            i < streak
              ? "bg-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.6)]"
              : "bg-[#ecd9ba]/20"
          )}
          animate={i < streak ? { scale: [1, 1.2, 1] } : {}}
          transition={{ delay: i * 0.1, duration: 0.3 }}
        />
      ))}
      {maxStreak > 8 && streak > 8 && (
        <span className="ml-1 text-sm font-bold text-[#ffd700]">+{streak - 8}</span>
      )}
    </div>
  );
}

export default function CoinflipPage() {
  // Core game state
  const [deposit, setDeposit] = useState("1000");
  const [managedBalance, setManagedBalance] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>("deposit");
  const [playerChoice, setPlayerChoice] = useState<PlayerChoice | null>(null);
  const [flipResult, setFlipResult] = useState<FlipResult | null>(null);
  const [flipPhase, setFlipPhase] = useState<"idle" | "spinning" | "slowing" | "done">("idle");
  const [currentStreak, setCurrentStreak] = useState(0);
  const [pendingGold, setPendingGold] = useState(0);
  const [lockedGold, setLockedGold] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Lifetime stats
  const [totalBirbPlayed, setTotalBirbPlayed] = useState(8250);
  const [allTimeGold, setAllTimeGold] = useState(15420);
  const [totalFlips, setTotalFlips] = useState(12);
  const [totalWins, setTotalWins] = useState(8);
  const [bestStreak, setBestStreak] = useState(4);

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
  const dayMultiplier = getBaseGoldMultiplier(currentDay);
  const currentGoldRate = getGoldRateNum(currentStreak, dayMultiplier);
  const nextGoldRate = getGoldRateNum(currentStreak + 1, dayMultiplier);

  /* ── Handle Deposit ── */
  function handleDeposit() {
    if (depositNum <= 0) return;
    setGamePhase("receiving");
    
    setTimeout(() => {
      setManagedBalance(depositNum);
      setGamePhase("ready");
      setCurrentStreak(0);
      setPendingGold(0);
    }, 1500);
  }

  /* ── Handle Flip ── */
  function handleFlip(choice: PlayerChoice) {
    if (gamePhase !== "ready") return;
    
    setPlayerChoice(choice);
    setGamePhase("flipping");
    setFlipPhase("spinning");
    playFlipSound();
    
    // Determine result
    const result: FlipResult = Math.random() < 0.5 ? "heads" : "tails";
    
    // Spin for 2 seconds then slow down
    setTimeout(() => {
      setFlipResult(result);
      setFlipPhase("slowing");
    }, 2000);
    
    // Complete after slowing
    setTimeout(() => {
      setFlipPhase("done");
      setGamePhase("result");
      
      const isWin = result === choice;
      setTotalFlips(prev => prev + 1);
      
      if (isWin) {
        playWinSound(currentStreak > 0);
        setTotalWins(prev => prev + 1);
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        if (newStreak > bestStreak) setBestStreak(newStreak);
        
        const goldEarned = Math.round(managedBalance * currentGoldRate);
        setPendingGold(goldEarned);
        
        // Log the win
        setLog(prev => [...prev, {
          choice,
          result,
          outcome: "win",
          streak: newStreak,
          goldRate: getGoldRate(currentStreak, dayMultiplier),
          goldEarned,
          deposit: managedBalance,
        }]);
      } else {
        playLoseSound();
        
        // Log the loss
        setLog(prev => [...prev, {
          choice,
          result,
          outcome: "lose",
          streak: currentStreak,
          goldRate: getGoldRate(currentStreak, dayMultiplier),
          goldEarned: 0,
          deposit: managedBalance,
        }]);
        
        // Update team volume before losing balance
        if (userTeam) {
          const updatedTeam = {
            ...userTeam,
            totalVolume: userTeam.totalVolume + managedBalance,
          };
          setUserTeam(updatedTeam);
          localStorage.setItem("birb-team", JSON.stringify(updatedTeam));
        }
        
        // Update stats
        setTotalBirbPlayed(prev => prev + managedBalance);
        
        // Lose entire balance
        setManagedBalance(0);
        setCurrentStreak(0);
        setPendingGold(0);
      }
    }, 3500);
  }

  /* ── Handle Double Down (Continue Streak) ── */
  function handleDoubleDown() {
    setGamePhase("ready");
    setFlipPhase("idle");
    setFlipResult(null);
    setPlayerChoice(null);
  }

  /* ── Handle Lock In ── */
  function handleLockIn() {
    playLockInSound();
    
    setLockedGold(prev => prev + pendingGold);
    setAllTimeGold(prev => prev + pendingGold);
    setTotalBirbPlayed(prev => prev + managedBalance);
    
    // Update team volume
    if (userTeam) {
      const updatedTeam = {
        ...userTeam,
        totalVolume: userTeam.totalVolume + managedBalance,
      };
      setUserTeam(updatedTeam);
      localStorage.setItem("birb-team", JSON.stringify(updatedTeam));
    }
    
    setGamePhase("locked");
    setShowShareModal(true);
  }

  /* ── Reset for New Round ── */
  function handleNewRound() {
    setGamePhase("deposit");
    setManagedBalance(0);
    setCurrentStreak(0);
    setPendingGold(0);
    setFlipPhase("idle");
    setFlipResult(null);
    setPlayerChoice(null);
  }

  const isFlipping = gamePhase === "flipping";
  const isWin = flipResult && playerChoice && flipResult === playerChoice;
  const isLoss = flipResult && playerChoice && flipResult !== playerChoice;
  const showTokenRain = isWin && currentStreak >= 2 && flipPhase === "done";

  return (
    <div className="min-h-screen overflow-hidden bg-[#090605] text-white">
      {/* Background */}
      <div className="fixed inset-0">
        <img src="/bg-red.png" alt="" className="h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,6,5,0.65),rgba(9,6,5,0.3)_40%,rgba(9,6,5,0.9)_100%)]" />
      </div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,215,0,0.08),transparent_30%)]" />

      {/* Token Rain */}
      <TokenRain isActive={showTokenRain} />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 md:px-10">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <img src="/logo.png" alt="birb" className="h-8 w-auto object-contain md:h-10" />
            </Link>
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">
              Coinflip Concept
            </div>
          </div>
          <div className="flex items-center gap-3">
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
                min={0}
                max={0.3}
                step={0.01}
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/10 accent-[#ecd9ba] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ecd9ba]"
              />
            </div>
            
            {/* Teams Link */}
            <Link
              href="/teams"
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors backdrop-blur-md",
                userTeam
                  ? "border-[#ffd700]/30 bg-[#ffd700]/10 text-[#ffd700] hover:bg-[#ffd700]/20"
                  : "border-[#ecd9ba]/15 bg-black/20 text-[#ecd9ba] hover:bg-black/30"
              )}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              {userTeam ? userTeam.name : "Teams"}
            </Link>

            {/* Back to Prism */}
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full border border-[#d12429]/30 bg-[#d12429]/10 px-4 py-2 text-sm text-[#d12429] transition-colors hover:bg-[#d12429]/20 backdrop-blur-md"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
              </svg>
              Prism Game
            </Link>
          </div>
        </header>

        {/* Main Game Area */}
        <section className="relative mt-8 flex flex-1 flex-col items-center justify-center gap-8 lg:flex-row lg:items-start lg:gap-12">
          {/* Coin Area */}
          <div className="flex flex-col items-center">
            <SpinningCoin
              isFlipping={isFlipping}
              flipPhase={flipPhase}
              result={flipResult}
              playerChoice={playerChoice}
            />
            
            {/* Choice Buttons - Only show when ready */}
            {gamePhase === "ready" && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex gap-4"
              >
                <button
                  onClick={() => handleFlip("heads")}
                  className="group relative overflow-hidden rounded-2xl border-2 border-[#ffd700]/40 bg-gradient-to-br from-[#ffd700]/20 to-[#daa520]/10 px-10 py-4 font-heading text-xl font-bold text-[#ffd700] transition-all hover:border-[#ffd700]/60 hover:shadow-[0_0_30px_rgba(255,215,0,0.3)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ffd700]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="relative">HEADS</span>
                </button>
                <button
                  onClick={() => handleFlip("tails")}
                  className="group relative overflow-hidden rounded-2xl border-2 border-[#c0c0c0]/40 bg-gradient-to-br from-[#c0c0c0]/20 to-[#808080]/10 px-10 py-4 font-heading text-xl font-bold text-[#c0c0c0] transition-all hover:border-[#c0c0c0]/60 hover:shadow-[0_0_30px_rgba(192,192,192,0.3)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c0c0c0]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="relative">TAILS</span>
                </button>
              </motion.div>
            )}

            {/* Result Actions */}
            {gamePhase === "result" && isWin && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex flex-col items-center gap-4"
              >
                <div className="text-center">
                  <div className="font-heading text-3xl font-black text-[#ffd700]">
                    +{pendingGold.toLocaleString()} GOLD
                  </div>
                  <div className="mt-1 text-sm text-white/60">
                    at {getGoldRate(currentStreak - 1, dayMultiplier)} rate
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={handleLockIn}
                    className="group relative overflow-hidden rounded-2xl border-2 border-[#22c55e]/40 bg-gradient-to-br from-[#22c55e]/20 to-[#16a34a]/10 px-8 py-4 font-heading text-lg font-bold text-[#22c55e] transition-all hover:border-[#22c55e]/60 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="relative flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      LOCK IN
                    </span>
                  </button>
                  
                  <button
                    onClick={handleDoubleDown}
                    className="group relative overflow-hidden rounded-2xl border-2 border-[#ffd700]/40 bg-gradient-to-br from-[#ffd700]/20 to-[#ff8c00]/10 px-8 py-4 font-heading text-lg font-bold text-[#ffd700] transition-all hover:border-[#ffd700]/60 hover:shadow-[0_0_30px_rgba(255,215,0,0.3)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ffd700]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="relative flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                      </svg>
                      DOUBLE DOWN ({getGoldRate(currentStreak, dayMultiplier)})
                    </span>
                  </button>
                </div>
                
                <div className="mt-2 text-xs text-white/40">
                  Double down to risk it all for {getGoldRate(currentStreak, dayMultiplier)} gold rate
                </div>
              </motion.div>
            )}

            {/* Loss Message */}
            {gamePhase === "result" && isLoss && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex flex-col items-center gap-4"
              >
                <div className="text-center">
                  <div className="font-heading text-3xl font-black text-[#dc2626]">
                    BUSTED
                  </div>
                  <div className="mt-1 text-sm text-white/60">
                    Balance lost. Your BIRB principal is still safe.
                  </div>
                </div>
                
                <button
                  onClick={handleNewRound}
                  className="rounded-2xl border border-[#ecd9ba]/30 bg-[#ecd9ba]/10 px-8 py-3 font-heading text-lg font-bold text-[#ecd9ba] transition-all hover:bg-[#ecd9ba]/20"
                >
                  TRY AGAIN
                </button>
              </motion.div>
            )}

            {/* Locked State */}
            {gamePhase === "locked" && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex flex-col items-center gap-4"
              >
                <div className="text-center">
                  <div className="font-heading text-3xl font-black text-[#22c55e]">
                    LOCKED IN
                  </div>
                  <div className="mt-1 text-sm text-white/60">
                    {pendingGold.toLocaleString()} Gold secured
                  </div>
                </div>
                
                <button
                  onClick={handleNewRound}
                  className="rounded-2xl border border-[#ecd9ba]/30 bg-[#ecd9ba]/10 px-8 py-3 font-heading text-lg font-bold text-[#ecd9ba] transition-all hover:bg-[#ecd9ba]/20"
                >
                  NEW ROUND
                </button>
              </motion.div>
            )}
          </div>

          {/* Control Panel */}
          <div className="w-full max-w-md rounded-[2rem] border border-[#f0dcc6]/10 bg-[linear-gradient(180deg,rgba(20,14,12,0.95),rgba(14,8,6,0.98))] p-6 shadow-[0_0_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            {/* Balance Display */}
            <div className="mb-5 flex items-center justify-between rounded-xl border border-[#ffd700]/20 bg-[#ffd700]/5 p-4">
              <div>
                <div className="text-xs uppercase tracking-[0.15em] text-white/45">Active Balance</div>
                <div className="mt-1 font-heading text-3xl font-black text-[#ffd700]">
                  {managedBalance.toLocaleString()} <span className="text-lg text-[#ffd700]/70">BIRB</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.15em] text-white/45">Pending Gold</div>
                <div className="mt-1 font-heading text-2xl font-bold text-[#22c55e]">
                  +{pendingGold.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Streak Display */}
            <div className="mb-5 rounded-xl border border-[#ffd700]/15 bg-[#ffd700]/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.15em] text-white/45">Current Streak</div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="font-heading text-4xl font-black text-[#ffd700]">{currentStreak}</span>
                    <StreakDisplay streak={currentStreak} maxStreak={8} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-[0.15em] text-white/45">Gold Rate</div>
                  <div className="mt-1 font-heading text-2xl font-bold text-[#ffd700]">
                    {getGoldRate(currentStreak, dayMultiplier)}
                  </div>
                  {currentStreak > 0 && (
                    <div className="text-xs text-white/40">
                      Next: {getGoldRate(currentStreak, dayMultiplier)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Deposit Section - Only show when in deposit phase */}
            {(gamePhase === "deposit" || gamePhase === "receiving") && (
              <>
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs uppercase tracking-[0.18em] text-white/45">Deposit Amount</label>
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

                <button
                  onClick={handleDeposit}
                  disabled={gamePhase === "receiving" || depositNum <= 0}
                  className="h-14 w-full rounded-2xl bg-[#d12429] font-heading text-base font-bold text-white transition hover:bg-[#7d050d] disabled:cursor-not-allowed disabled:opacity-50"
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
                    `Deposit ${depositNum > 0 ? depositNum.toLocaleString() : ""} BIRB`
                  )}
                </button>
              </>
            )}

            {/* Game Info when playing */}
            {(gamePhase === "ready" || gamePhase === "flipping" || gamePhase === "result") && (
              <div className="rounded-xl border border-[#d4a06c]/20 bg-[#d4a06c]/10 p-4 text-sm text-[#f0dcc6]">
                <div className="font-bold mb-1">How to Play:</div>
                <ul className="list-disc list-inside space-y-1 text-white/70">
                  <li>Pick Heads or Tails</li>
                  <li>Win to build your streak (2x, 4x, 8x...)</li>
                  <li>Lock In to secure your gold, or Double Down to risk it all</li>
                  <li className="text-red-400">Lose = entire balance gone</li>
                </ul>
              </div>
            )}

            {/* Day Decay Slider */}
            <div className="mt-5 rounded-[1.6rem] border border-[#22c55e]/15 bg-[linear-gradient(180deg,rgba(34,197,94,0.04),rgba(14,8,6,0.42))] p-4 shadow-[inset_0_1px_0_rgba(34,197,94,0.06)]">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs uppercase tracking-[0.18em] text-white/45">Gold Rate Decay</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/35">Day</span>
                  <span className={cn(
                    "font-heading text-lg font-black",
                    currentDay <= 5 ? "text-[#22c55e]" : "text-[#ffd700]"
                  )}>{currentDay}</span>
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
                  className={cn(
                    "h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10",
                    currentDay <= 5 
                      ? "accent-[#22c55e] [&::-webkit-slider-thumb]:bg-[#22c55e]" 
                      : "accent-[#ffd700] [&::-webkit-slider-thumb]:bg-[#ffd700]",
                    "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(255,215,0,0.4)]"
                  )}
                />
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/30">28</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <div className="text-white/40">
                  Boost: <span className={cn(
                    "font-bold",
                    currentDay <= 5 ? "text-[#22c55e]" : "text-[#ffd700]"
                  )}>{(dayMultiplier * 100).toFixed(0)}%</span>
                </div>
                <div className="text-white/30">
                  {currentDay <= 5 
                    ? "Grace period - max rate!" 
                    : currentDay <= 10 
                      ? "Bonus decaying" 
                      : currentDay <= 20 
                        ? "Moderate decay" 
                        : "Near floor rate"}
                </div>
              </div>
            </div>

            {/* Info callout */}
            <div className="mt-5 rounded-[1.5rem] border border-[#d4a06c]/20 bg-[#d4a06c]/10 p-4 text-sm text-[#f0dcc6]">
              Your BIRB principal is returned at month end. You are risking gold conversion rate, not your deposited BIRB.
            </div>
          </div>
        </section>

        {/* Bottom Stats */}
        <section className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-[#ffd700]/20 bg-[#ffd700]/5 px-3 py-2">
            <svg className="h-4 w-4 text-[#ffd700]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <span className="text-[10px] uppercase tracking-wider text-[#ffd700]/50">Best Streak</span>
            <span className="text-sm font-bold text-[#ffd700]">{bestStreak}x</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-[#ecd9ba]/20 bg-[#ecd9ba]/5 px-3 py-2">
            <img src="/images/birb-token.png" alt="" className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-wider text-[#ecd9ba]/50">BIRB Played</span>
            <span className="text-sm font-bold text-[#ecd9ba]">{totalBirbPlayed.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/5 px-3 py-2">
            <svg className="h-4 w-4 text-[#22c55e]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <span className="text-[10px] uppercase tracking-wider text-[#22c55e]/50">All Time Gold</span>
            <span className="text-sm font-bold text-[#22c55e]">{allTimeGold.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-[#8b5cf6]/20 bg-[#8b5cf6]/5 px-3 py-2">
            <svg className="h-4 w-4 text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            <span className="text-[10px] uppercase tracking-wider text-[#8b5cf6]/50">Win Rate</span>
            <span className="text-sm font-bold text-[#8b5cf6]">{totalFlips > 0 ? Math.round((totalWins / totalFlips) * 100) : 0}%</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-[#ec4899]/20 bg-[#ec4899]/5 px-3 py-2">
            <span className="text-[10px] uppercase tracking-wider text-[#ec4899]/50">Locked Gold</span>
            <span className="text-sm font-bold text-[#ec4899]">{lockedGold.toLocaleString()}</span>
          </div>
        </section>

        {/* History */}
        {log.length > 0 && (
          <section className="mt-6">
            <div className="rounded-[1.5rem] border border-[#f0dcc6]/10 bg-[linear-gradient(180deg,rgba(20,14,12,0.95),rgba(14,8,6,0.98))] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-white/45">Flip History</span>
                <button
                  onClick={() => setLog([])}
                  className="text-xs text-white/30 hover:text-white/50"
                >
                  Clear
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {log.slice().reverse().map((entry, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-shrink-0 rounded-xl border px-3 py-2 text-center",
                      entry.outcome === "win"
                        ? "border-[#22c55e]/20 bg-[#22c55e]/5"
                        : "border-[#dc2626]/20 bg-[#dc2626]/5"
                    )}
                  >
                    <div className={cn(
                      "text-xs font-bold uppercase",
                      entry.outcome === "win" ? "text-[#22c55e]" : "text-[#dc2626]"
                    )}>
                      {entry.outcome === "win" ? "WIN" : "LOSS"}
                    </div>
                    <div className="mt-1 text-[10px] text-white/40">
                      {entry.choice} / {entry.result}
                    </div>
                    {entry.outcome === "win" && (
                      <div className="mt-1 text-xs font-bold text-[#ffd700]">
                        +{entry.goldEarned.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            birbDeposit={managedBalance}
            goldEarned={pendingGold}
            streak={currentStreak}
            goldRate={getGoldRate(currentStreak - 1, dayMultiplier)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
