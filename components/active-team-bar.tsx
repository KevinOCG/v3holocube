"use client";
// Active Team Bar - v2

import Link from "next/link";
import { motion } from "framer-motion";
import { useTeam } from "../contexts/team-context";

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(1) + "M";
  if (vol >= 1_000) return (vol / 1_000).toFixed(1) + "K";
  return vol.toLocaleString();
}

export function ActiveTeamBar() {
  const { team } = useTeam();

  // Not in a team - show join prompt
  if (!team) {
    return (
      <Link href="/teams" className="block">
        <motion.div
          className="flex items-center gap-3 rounded-xl border border-[#ecd9ba]/10 bg-[#1a1210]/60 px-4 py-2.5 backdrop-blur-sm transition-all hover:border-[#d12429]/30 hover:bg-[#1a1210]/80"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d12429]/10">
            <svg className="h-4 w-4 text-[#d12429]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#ecd9ba]">Join a Team</span>
            <span className="text-[10px] text-[#ecd9ba]/50">Compete for Top 10 rewards</span>
          </div>
          <svg className="ml-1 h-4 w-4 text-[#ecd9ba]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </motion.div>
      </Link>
    );
  }

  // In a team - show team status
  return (
    <Link href="/teams" className="block">
      <motion.div
        className="flex items-center gap-3 rounded-xl border border-[#d12429]/20 bg-gradient-to-r from-[#d12429]/10 to-[#1a1210]/60 px-4 py-2.5 backdrop-blur-sm transition-all hover:border-[#d12429]/40"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Team Icon */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d12429]/20">
          <svg className="h-4 w-4 text-[#d12429]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </div>

        {/* Team Info */}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[#ecd9ba]">{team.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#ecd9ba]/60">{formatVolume(team.volume)} BIRB</span>
            <span className="text-[10px] text-[#ecd9ba]/30">|</span>
            <span className={`text-[10px] font-medium ${
              team.rank <= 3 ? "text-amber-400" : team.rank <= 10 ? "text-[#d12429]" : "text-[#ecd9ba]/60"
            }`}>
              #{team.rank}
            </span>
          </div>
        </div>

        {/* Rank Badge */}
        {team.rank <= 3 && (
          <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[10px] font-bold text-black">
            {team.rank}
          </div>
        )}
      </motion.div>
    </Link>
  );
}
