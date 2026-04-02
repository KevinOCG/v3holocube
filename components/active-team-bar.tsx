"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTeam } from "../contexts/team-context";

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }
  return volume.toLocaleString();
}

export function ActiveTeamBar() {
  const { team, isInTeam } = useTeam();

  if (!isInTeam || !team) {
    // User NOT in a team - show compact "Join a Team" row
    return (
      <Link
        href="/teams"
        className="group flex items-center justify-between rounded-[1rem] border border-[#ecd9ba]/10 bg-[linear-gradient(180deg,rgba(236,217,186,0.03),rgba(14,8,6,0.3))] px-4 py-3 transition-all duration-300 hover:border-[#d12429]/30 hover:bg-[linear-gradient(180deg,rgba(209,36,41,0.05),rgba(14,8,6,0.35))]"
      >
        <div className="flex items-center gap-3">
          {/* Team icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ecd9ba]/15 bg-[#ecd9ba]/5">
            <svg
              className="h-4 w-4 text-[#ecd9ba]/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-[#ecd9ba]/80">No Team</span>
            <span className="text-[10px] text-[#ecd9ba]/40">Join to compete for rewards</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 rounded-full border border-[#d12429]/30 bg-[#d12429]/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-[#d12429] transition-colors group-hover:bg-[#d12429]/20">
          Join Team
          <svg
            className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </Link>
    );
  }

  // User IS in a team - show team status row
  const { name: teamName, volume: teamVolume, rank: teamRank } = team;

  return (
    <Link
      href="/teams"
      className="group flex items-center justify-between rounded-[1rem] border border-[#d12429]/15 bg-[linear-gradient(180deg,rgba(209,36,41,0.04),rgba(14,8,6,0.3))] px-4 py-3 transition-all duration-300 hover:border-[#d12429]/30 hover:shadow-[0_0_20px_rgba(209,36,41,0.08)]"
    >
      <div className="flex items-center gap-3">
        {/* Rank badge */}
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#d12429]/30 bg-gradient-to-br from-[#d12429]/15 to-[#d12429]/5">
          {teamRank && teamRank <= 10 ? (
            <span className="text-xs font-bold text-[#d12429]">#{teamRank}</span>
          ) : (
            <svg
              className="h-4 w-4 text-[#d12429]/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          )}
          {/* Pulse for top 3 */}
          {teamRank && teamRank <= 3 && (
            <motion.div
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full border border-[#d12429]/40"
            />
          )}
        </div>
        
        <div className="flex flex-col">
          <span className="max-w-[160px] truncate text-xs font-medium text-[#ecd9ba]" title={teamName}>
            {teamName}
          </span>
          <span className="text-[10px] text-[#ecd9ba]/40">
            {formatVolume(teamVolume)} BIRB
            {teamRank && teamRank <= 10 && (
              <span className="ml-1.5 text-[#d12429]">Top 10</span>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-[#ecd9ba]/40 transition-colors group-hover:text-[#ecd9ba]/60">
        <span>View Team</span>
        <svg
          className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}
