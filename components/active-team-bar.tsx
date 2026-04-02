"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";


interface ActiveTeamBarProps {
  teamName?: string;
  teamVolume?: number;
  teamRank?: number;
  isInTeam?: boolean;
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }
  return volume.toLocaleString();
}

export function ActiveTeamBar({
  teamName = "Crimson Birb Syndicate",
  teamVolume = 2_450_000,
  teamRank = 3,
  isInTeam = true,
}: ActiveTeamBarProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!isInTeam) {
    // User NOT in a team - show "Join a Team" variant
    return (
      <Link
        href="/teams"
        className="group relative flex items-center gap-3 overflow-hidden rounded-full border border-[#ecd9ba]/15 bg-black/30 px-4 py-2 backdrop-blur-md transition-all duration-300 hover:border-[#d12429]/40 hover:bg-[#d12429]/10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Subtle glow on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(209,36,41,0.15),transparent_70%)]"
            />
          )}
        </AnimatePresence>

        {/* Team icon */}
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#ecd9ba]/20 bg-[#ecd9ba]/5">
          <svg
            className="h-3.5 w-3.5 text-[#ecd9ba]/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-semibold text-[#ecd9ba]">Join a Team</span>
          <span className="text-[10px] text-[#ecd9ba]/50">Compete for Top 10 rewards</span>
        </div>

        <svg
          className="ml-1 h-3.5 w-3.5 text-[#ecd9ba]/40 transition-transform group-hover:translate-x-0.5 group-hover:text-[#d12429]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>
    );
  }

  // User IS in a team - show full team status
  return (
    <Link
      href="/teams"
      className="group relative flex items-center gap-3 overflow-hidden rounded-full border border-[#d12429]/25 bg-gradient-to-r from-[#d12429]/10 via-black/30 to-black/30 px-4 py-2 backdrop-blur-md transition-all duration-300 hover:border-[#d12429]/50 hover:shadow-[0_0_20px_rgba(209,36,41,0.15)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated glow on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_50%,rgba(209,36,41,0.2),transparent_60%)]"
          />
        )}
      </AnimatePresence>

      {/* Team badge/icon with rank */}
      <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#d12429]/40 bg-gradient-to-br from-[#d12429]/20 to-[#d12429]/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        {teamRank && teamRank <= 10 ? (
          <span className="text-xs font-bold text-[#d12429]">#{teamRank}</span>
        ) : (
          <svg
            className="h-4 w-4 text-[#d12429]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
        )}
        {/* Subtle pulse for top 3 teams */}
        {teamRank && teamRank <= 3 && (
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full border border-[#d12429]/50"
          />
        )}
      </div>

      {/* Team info */}
      <div className="flex flex-col">
        <span
          className="max-w-[140px] truncate text-xs font-semibold text-[#ecd9ba]"
          title={teamName}
        >
          {teamName}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#ecd9ba]/50">
            Vol: <span className="font-medium text-[#ecd9ba]/80">{formatVolume(teamVolume)} BIRB</span>
          </span>
          {teamRank && (
            <>
              <span className="text-[#ecd9ba]/20">|</span>
              <span
                className={`text-[10px] font-medium ${
                  teamRank <= 3
                    ? "text-amber-400"
                    : teamRank <= 10
                      ? "text-[#d12429]"
                      : "text-[#ecd9ba]/60"
                }`}
              >
                Rank #{teamRank}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Arrow indicator */}
      <svg
        className="ml-1 h-3.5 w-3.5 text-[#ecd9ba]/30 transition-transform group-hover:translate-x-0.5 group-hover:text-[#d12429]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>

      {/* Tooltip on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute -bottom-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2.5 py-1 text-[10px] text-[#ecd9ba]/80 shadow-lg"
          >
            {teamRank && teamRank <= 10
              ? "Your team is competing for Top 10 rewards"
              : "View leaderboard and team stats"}
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}
