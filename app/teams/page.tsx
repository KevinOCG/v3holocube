"use client";

// Teams page - create, join, and manage team competitions
import React, { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  generateTeamName,
  generateTeamCode,
  shortenWallet,
  MOCK_LEADERBOARD,
  TEAM_INCENTIVES,
  type Team,
} from "./team-utils";
import { useTeam } from "../../contexts/team-context";

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

// Mock connected wallet
const MOCK_WALLET = "F8ow4k7mLpQ2bVnX9rT6yU8sD3hK5jN1oW7gR0ePepn";

// ─────────────────────────────────────────────────────────────────────────────
// Team Share Modal
// ─────────────────────────────────────────────────────────────────────────────
function TeamShareModal({
  isOpen,
  onClose,
  team,
}: {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const shareText = `Join my team in Birb. Team: ${team.name} | Code: ${team.code} | We're pushing Top 10.`;

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadImage = async () => {
    if (!cardRef.current) return;
    setCopying(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0604",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `${team.name.toLowerCase().replace(/\s+/g, "-")}-invite.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to generate image:", err);
    }
    setCopying(false);
  };

  const shareToTwitter = () => {
    const url = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
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
          className="absolute -right-2 -top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1210] text-white/60 transition-colors hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Shareable Card */}
        <div
          ref={cardRef}
          className="overflow-hidden rounded-3xl border border-[#d12429]/20 bg-black"
        >
          <div className="relative px-8 pb-6 pt-8">
            <img
              src="/images/birb-gold.jpg"
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
            />
            <div className="relative z-10">
              <div className="inline-block rounded-full bg-gradient-to-r from-[#d12429] to-[#7d050d] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Join My Team
              </div>
              <h2 className="mt-4 font-heading text-4xl font-black tracking-tight text-white">
                {team.name}
              </h2>
              <p className="mt-1 text-lg text-white/60">Team Code: {team.code}</p>
            </div>
          </div>

          <div className="border-t border-[#d12429]/10 bg-black px-8 py-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/40">
                  Members
                </div>
                <div className="mt-1 font-heading text-3xl font-bold text-white">
                  {team.members.length + 1}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-white/40">
                  Volume
                </div>
                <div className="mt-1 font-heading text-3xl font-bold text-[#d12429]">
                  {team.totalVolume.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex gap-3">
            <button
              onClick={downloadImage}
              disabled={copying}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#f0dcc6]/20 bg-[#1a1210] px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-[#2a1f1a] hover:text-white disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => copyToClipboard(team.code, "code")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#f0dcc6]/20 bg-[#1a1210] px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-[#2a1f1a] hover:text-white"
            >
              {copied === "code" ? (
                <>
                  <svg
                    className="h-4 w-4 text-[#22c55e]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>Copy Code</>
              )}
            </button>
            <button
              onClick={() => copyToClipboard(shareText, "text")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#f0dcc6]/20 bg-[#1a1210] px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-[#2a1f1a] hover:text-white"
            >
              {copied === "text" ? (
                <>
                  <svg
                    className="h-4 w-4 text-[#22c55e]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>Copy Share Text</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Permanent Confirmation Modal
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  teamName,
  teamCode,
  action,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  teamName: string;
  teamCode: string;
  action: "create" | "join";
}) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm();
      setConfirmed(false);
    }
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
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-[#d12429]/30 bg-[linear-gradient(180deg,rgba(20,14,12,0.98),rgba(10,6,4,0.99))]"
      >
        <div className="p-6">
          {/* Warning Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#d12429]/30 bg-[#d12429]/10">
            <svg
              className="h-8 w-8 text-[#d12429]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-center font-heading text-2xl font-black text-white">
            Permanent Team Assignment
          </h2>

          <p className="mt-3 text-center text-sm text-white/60">
            You are about to {action === "create" ? "create" : "join"} this team.
            This decision is <span className="font-bold text-[#d12429]">permanent</span>{" "}
            and cannot be undone.
          </p>

          {/* Team Preview */}
          <div className="mt-6 rounded-2xl border border-[#ecd9ba]/15 bg-[#ecd9ba]/5 p-4">
            <div className="text-xs uppercase tracking-[0.15em] text-white/40">
              {action === "create" ? "Creating Team" : "Joining Team"}
            </div>
            <div className="mt-2 font-heading text-xl font-bold text-white">
              {teamName}
            </div>
            <div className="mt-1 text-sm text-white/50">Code: {teamCode}</div>
          </div>

          {/* Wallet Preview */}
          <div className="mt-4 rounded-2xl border border-[#ecd9ba]/15 bg-[#ecd9ba]/5 p-4">
            <div className="text-xs uppercase tracking-[0.15em] text-white/40">
              Connected Wallet
            </div>
            <div className="mt-2 font-mono text-sm text-[#ecd9ba]">
              {shortenWallet(MOCK_WALLET)}
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label className="mt-6 flex cursor-pointer items-start gap-3">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-5 w-5 rounded border border-white/20 bg-white/5 transition-colors peer-checked:border-[#d12429] peer-checked:bg-[#d12429]" />
              <svg
                className="absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-sm text-white/70">
              I understand this team assignment is{" "}
              <span className="font-bold text-white">permanent</span> for my wallet.
            </span>
          </label>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!confirmed}
              className="flex-1 rounded-xl bg-[#d12429] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#7d050d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm Permanent Choice
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Team Modal
// ───────────────────────────────────────────────────────────────────────��─────
function CreateTeamModal({
  isOpen,
  onClose,
  onTeamCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: (team: Team) => void;
}) {
  const [teamName, setTeamName] = useState(() => generateTeamName());
  const [teamCode] = useState(() => generateTeamCode());
  const [showConfirmation, setShowConfirmation] = useState(false);

  const rerollName = () => {
    setTeamName(generateTeamName());
  };

  const handleCreate = () => {
    setShowConfirmation(true);
  };

  const confirmCreate = () => {
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: teamName,
      code: teamCode,
      founder: MOCK_WALLET,
      members: [
        {
          wallet: MOCK_WALLET,
          role: "founder",
          joinedAt: new Date(),
          volume: 0,
        },
      ],
      totalVolume: 0,
      createdAt: new Date(),
    };
    onTeamCreated(newTeam);
    setShowConfirmation(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-[#ecd9ba]/15 bg-[linear-gradient(180deg,rgba(20,14,12,0.98),rgba(10,6,4,0.99))]"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-black text-white">
                Create Your Team
              </h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Generated Team Name */}
            <div className="mt-6">
              <label className="text-xs uppercase tracking-[0.15em] text-white/40">
                Team Name
              </label>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 rounded-2xl border border-[#ecd9ba]/20 bg-[#ecd9ba]/5 px-4 py-4">
                  <div className="font-heading text-xl font-bold text-white">
                    {teamName}
                  </div>
                </div>
                <button
                  onClick={rerollName}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d12429]/30 bg-[#d12429]/10 text-[#d12429] transition-colors hover:bg-[#d12429]/20"
                  title="Reroll Name"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Team Code */}
            <div className="mt-5">
              <label className="text-xs uppercase tracking-[0.15em] text-white/40">
                Team Code
              </label>
              <div className="mt-2 rounded-2xl border border-[#ecd9ba]/20 bg-[#ecd9ba]/5 px-4 py-4">
                <div className="font-mono text-2xl font-bold tracking-[0.3em] text-[#ecd9ba]">
                  {teamCode}
                </div>
              </div>
              <p className="mt-2 text-xs text-white/40">
                Share this code with friends to let them join your team.
              </p>
            </div>

            {/* Wallet Preview */}
            <div className="mt-5">
              <label className="text-xs uppercase tracking-[0.15em] text-white/40">
                Connected Wallet
              </label>
              <div className="mt-2 rounded-2xl border border-[#ecd9ba]/15 bg-[#ecd9ba]/5 px-4 py-3">
                <div className="font-mono text-sm text-[#ecd9ba]">
                  {shortenWallet(MOCK_WALLET)}
                </div>
              </div>
            </div>

            {/* Permanent Warning */}
            <div className="mt-5 rounded-2xl border border-[#d12429]/20 bg-[#d12429]/5 p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#d12429]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-sm text-white/70">
                  This team assignment is{" "}
                  <span className="font-bold text-[#d12429]">permanent</span> for your
                  wallet. Choose wisely.
                </p>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              className="mt-6 h-14 w-full rounded-2xl bg-[linear-gradient(135deg,#7d050d,#d12429)] font-heading text-base font-bold text-white shadow-[0_0_24px_rgba(209,36,41,0.3)] transition hover:brightness-110"
            >
              Create My Team
            </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showConfirmation && (
          <ConfirmationModal
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            onConfirm={confirmCreate}
            teamName={teamName}
            teamCode={teamCode}
            action="create"
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Join Team Modal
// ─────────────────────────────────────────────────────────────────────────────
function JoinTeamModal({
  isOpen,
  onClose,
  onTeamJoined,
}: {
  isOpen: boolean;
  onClose: () => void;
  onTeamJoined: (team: Team) => void;
}) {
  const [searchMode, setSearchMode] = useState<"code" | "name">("code");
  const [searchInput, setSearchInput] = useState("");
  const [foundTeam, setFoundTeam] = useState<Team | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");

  const searchTeam = () => {
    setError("");
    const search = searchInput.trim();
    if (!search) {
      setError("Please enter a team code or name");
      return;
    }

    // Search in mock leaderboard
    const team = MOCK_LEADERBOARD.find(
      (t) =>
        t.code === search || t.name.toLowerCase().includes(search.toLowerCase())
    );

    if (team) {
      setFoundTeam(team);
    } else {
      setError("Team not found. Check the code or try a different search.");
      setFoundTeam(null);
    }
  };

  const handleJoin = () => {
    if (foundTeam) {
      setShowConfirmation(true);
    }
  };

  const confirmJoin = () => {
    if (foundTeam) {
      const joinedTeam: Team = {
        ...foundTeam,
        members: [
          ...foundTeam.members,
          {
            wallet: MOCK_WALLET,
            role: "member",
            joinedAt: new Date(),
            volume: 0,
          },
        ],
      };
      onTeamJoined(joinedTeam);
      setShowConfirmation(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-[#ecd9ba]/15 bg-[linear-gradient(180deg,rgba(20,14,12,0.98),rgba(10,6,4,0.99))]"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-black text-white">
                Join a Team
              </h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Search Mode Toggle */}
            <div className="mt-6 flex rounded-xl border border-[#ecd9ba]/15 bg-[#ecd9ba]/5 p-1">
              <button
                onClick={() => setSearchMode("code")}
                className={cn(
                  "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  searchMode === "code"
                    ? "bg-[#d12429] text-white"
                    : "text-white/60 hover:text-white"
                )}
              >
                By Code
              </button>
              <button
                onClick={() => setSearchMode("name")}
                className={cn(
                  "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  searchMode === "name"
                    ? "bg-[#d12429] text-white"
                    : "text-white/60 hover:text-white"
                )}
              >
                By Name
              </button>
            </div>

            {/* Search Input */}
            <div className="mt-5">
              <label className="text-xs uppercase tracking-[0.15em] text-white/40">
                {searchMode === "code" ? "6-Digit Team Code" : "Team Name"}
              </label>
              <div className="mt-2 flex gap-3">
                <input
                  type={searchMode === "code" ? "text" : "text"}
                  value={searchInput}
                  onChange={(e) => {
                    if (searchMode === "code") {
                      setSearchInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                    } else {
                      setSearchInput(e.target.value);
                    }
                    setFoundTeam(null);
                    setError("");
                  }}
                  placeholder={searchMode === "code" ? "847291" : "Search team name..."}
                  className="h-14 flex-1 rounded-2xl border border-[#f0dcc6]/10 bg-white/5 px-4 text-lg font-medium text-white outline-none placeholder:text-white/30 focus:border-[#d12429]/30"
                />
                <button
                  onClick={searchTeam}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d12429] text-white transition-colors hover:bg-[#7d050d]"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
              {error && <p className="mt-2 text-sm text-[#d12429]">{error}</p>}
            </div>

            {/* Found Team Preview */}
            {foundTeam && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5"
              >
                <label className="text-xs uppercase tracking-[0.15em] text-white/40">
                  Team Found
                </label>
                <div className="mt-2 rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-heading text-lg font-bold text-white">
                        {foundTeam.name}
                      </div>
                      <div className="mt-1 text-sm text-white/50">
                        Code: {foundTeam.code}
                      </div>
                    </div>
                    {foundTeam.rank && foundTeam.rank <= 10 && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ffd700]/30 bg-[#ffd700]/10">
                        <span className="font-heading text-lg font-bold text-[#ffd700]">
                          #{foundTeam.rank}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-white/40">
                        Members
                      </div>
                      <div className="mt-0.5 font-bold text-white">
                        {foundTeam.members.length + 1}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-white/40">
                        Volume
                      </div>
                      <div className="mt-0.5 font-bold text-[#ecd9ba]">
                        {foundTeam.totalVolume.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permanent Warning */}
                <div className="mt-4 rounded-2xl border border-[#d12429]/20 bg-[#d12429]/5 p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#d12429]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <p className="text-sm text-white/70">
                      Joining this team is{" "}
                      <span className="font-bold text-[#d12429]">permanent</span>. You
                      cannot leave or change teams.
                    </p>
                  </div>
                </div>

                {/* Join Button */}
                <button
                  onClick={handleJoin}
                  className="mt-4 h-14 w-full rounded-2xl bg-[linear-gradient(135deg,#7d050d,#d12429)] font-heading text-base font-bold text-white shadow-[0_0_24px_rgba(209,36,41,0.3)] transition hover:brightness-110"
                >
                  Join Team
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showConfirmation && foundTeam && (
          <ConfirmationModal
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            onConfirm={confirmJoin}
            teamName={foundTeam.name}
            teamCode={foundTeam.code}
            action="join"
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard Component
// ─────────────────────────────────────────────────────────────────────────────
function Leaderboard({ userTeam }: { userTeam: Team | null }) {
  return (
    <div className="rounded-[2rem] border border-[#ecd9ba]/10 bg-[linear-gradient(180deg,rgba(236,217,186,0.06),rgba(236,217,186,0.02))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#ecd9ba]/50">
            Leaderboard
          </div>
          <div className="mt-1 font-heading text-xl font-black tracking-tight text-white">
            Top 10 Teams
          </div>
        </div>
        <div className="rounded-full border border-[#ffd700]/20 bg-[#ffd700]/10 px-3 py-1 text-xs font-bold text-[#ffd700]">
          By Volume
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {MOCK_LEADERBOARD.map((team) => {
          const isUserTeam = userTeam?.id === team.id;
          const isTop3 = team.rank && team.rank <= 3;

          return (
            <div
              key={team.id}
              className={cn(
                "flex items-center gap-4 rounded-xl border p-3 transition-colors",
                isUserTeam
                  ? "border-[#d12429]/30 bg-[#d12429]/10"
                  : isTop3
                    ? "border-[#ffd700]/20 bg-[#ffd700]/5"
                    : "border-[#ecd9ba]/10 bg-[#ecd9ba]/5"
              )}
            >
              {/* Rank */}
              <div
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-heading font-bold",
                  team.rank === 1
                    ? "bg-gradient-to-br from-[#ffd700] to-[#ff8c00] text-black"
                    : team.rank === 2
                      ? "bg-gradient-to-br from-[#c0c0c0] to-[#9a9a9a] text-black"
                      : team.rank === 3
                        ? "bg-gradient-to-br from-[#cd7f32] to-[#a0522d] text-white"
                        : "bg-white/10 text-white/60"
                )}
              >
                {team.rank}
              </div>

              {/* Team Info */}
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "truncate font-medium",
                    isUserTeam ? "text-[#d12429]" : "text-white"
                  )}
                >
                  {team.name}
                  {isUserTeam && (
                    <span className="ml-2 text-xs text-[#d12429]/70">(You)</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span>{team.members.length + 1} members</span>
                </div>
              </div>

              {/* Volume */}
              <div className="text-right">
                <div
                  className={cn(
                    "font-heading font-bold",
                    isTop3 ? "text-[#ffd700]" : "text-[#ecd9ba]"
                  )}
                >
                  {team.totalVolume.toLocaleString()}
                </div>
                <div className="text-xs text-white/40">volume</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Incentives Panel
// ─────────────────────────────────────────────────────────────────────────────
function IncentivesPanel() {
  return (
    <div className="rounded-[2rem] border border-[#ffd700]/15 bg-[linear-gradient(180deg,rgba(255,215,0,0.06),rgba(255,215,0,0.02))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-[#ffd700]/50">
          Prizes
        </div>
        <div className="mt-1 font-heading text-xl font-black tracking-tight text-white">
          Top 10 Compete For
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TEAM_INCENTIVES.map((prize) => (
          <div
            key={prize}
            className="rounded-full border border-[#ffd700]/20 bg-[#ffd700]/10 px-3 py-1.5 text-sm font-medium text-[#ffd700]"
          >
            {prize}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Already In Team State
// ─────────────────────────────────────────────────────────────────────────────
function MyTeamPanel({
  team,
  onShare,
}: {
  team: Team;
  onShare: () => void;
}) {
  const isFounder = team.founder === MOCK_WALLET;
  const userMember = team.members.find((m) => m.wallet === MOCK_WALLET);
  const teamRank = MOCK_LEADERBOARD.find((t) => t.name === team.name)?.rank;

  return (
    <div className="rounded-[2rem] border border-[#ecd9ba]/10 bg-[linear-gradient(180deg,rgba(236,217,186,0.06),rgba(236,217,186,0.02))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
      {/* Header with locked badge */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#ecd9ba]/50">
            Your Team
          </div>
          <div className="mt-1 font-heading text-2xl font-black tracking-tight text-white">
            {team.name}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="font-mono text-lg tracking-[0.2em] text-[#ecd9ba]">
              {team.code}
            </div>
            <div className="rounded-full border border-[#d12429]/30 bg-[#d12429]/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[#d12429]">
              {isFounder ? "Founder" : "Member"}
            </div>
          </div>
        </div>

        {/* Team Locked Badge */}
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5">
          <svg
            className="h-4 w-4 text-white/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className="text-xs font-medium text-white/60">Team Locked</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#ecd9ba]/15 bg-[#ecd9ba]/5 p-3">
          <div className="text-xs uppercase tracking-wider text-white/40">
            Members
          </div>
          <div className="mt-1 font-heading text-2xl font-bold text-white">
            {team.members.length}
          </div>
        </div>
        <div className="rounded-xl border border-[#ecd9ba]/15 bg-[#ecd9ba]/5 p-3">
          <div className="text-xs uppercase tracking-wider text-white/40">
            Volume
          </div>
          <div className="mt-1 font-heading text-2xl font-bold text-[#ecd9ba]">
            {team.totalVolume.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-[#ecd9ba]/15 bg-[#ecd9ba]/5 p-3">
          <div className="text-xs uppercase tracking-wider text-white/40">
            Rank
          </div>
          <div className="mt-1 font-heading text-2xl font-bold text-[#ffd700]">
            {teamRank ? `#${teamRank}` : "--"}
          </div>
        </div>
        <div className="rounded-xl border border-[#ecd9ba]/15 bg-[#ecd9ba]/5 p-3">
          <div className="text-xs uppercase tracking-wider text-white/40">
            Your Volume
          </div>
          <div className="mt-1 font-heading text-2xl font-bold text-white">
            {userMember?.volume.toLocaleString() || "0"}
          </div>
        </div>
      </div>

      {/* Share Button */}
      <button
        onClick={onShare}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#d12429]/30 bg-[#d12429]/10 font-medium text-[#d12429] transition-colors hover:bg-[#d12429]/20"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Invite Friends
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Teams Page
// ─────────────────────────────────────────────────────────────────────────────
export default function TeamsPage() {
  const { team: userTeam, joinTeam } = useTeam();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleTeamCreated = useCallback((team: Team) => {
    console.log("[v0] handleTeamCreated called with:", team);
    const mappedTeam = {
      name: team.name,
      code: team.code,
      volume: team.totalVolume,
      rank: team.rank || 99,
      memberCount: team.members.length,
    };
    console.log("[v0] mapped team:", mappedTeam);
    joinTeam(mappedTeam);
  }, [joinTeam]);

  const handleTeamJoined = useCallback((team: Team) => {
    joinTeam({
      name: team.name,
      code: team.code,
      volume: team.totalVolume,
      rank: team.rank || 99,
      memberCount: team.members.length,
    });
  }, [joinTeam]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#090605] text-white">
      {/* Background */}
      <div className="fixed inset-0">
        <img
          src="/bg-red.png"
          alt=""
          className="h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,6,5,0.6),rgba(9,6,5,0.3)_40%,rgba(9,6,5,0.85)_100%)]" />
      </div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(130,82,52,0.22),transparent_24%),radial-gradient(circle_at_78%_50%,rgba(179,120,76,0.14),transparent_16%),radial-gradient(circle_at_50%_110%,rgba(255,244,232,0.06),transparent_20%)]" />

      {/* Toobins art */}
      <img
        src="/toobins-r.png"
        alt=""
        className="pointer-events-none fixed right-0 top-0 h-auto w-[28rem] object-contain opacity-20 mix-blend-lighten lg:opacity-30"
      />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 md:px-10">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <img
                src="/logo.png"
                alt="birb"
                className="h-8 w-auto object-contain md:h-10"
              />
            </Link>
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">
              Teams
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-[#ecd9ba]/20 bg-[#ecd9ba]/5 px-4 py-2 text-sm text-[#ecd9ba] transition-colors hover:bg-[#ecd9ba]/10"
            >
              Back to Game
            </Link>
            <div className="hidden rounded-full border border-[#ecd9ba]/30 bg-[#ecd9ba]/10 px-4 py-2 text-sm text-[#ecd9ba] backdrop-blur-md md:block">
              SOL: {shortenWallet(MOCK_WALLET)}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 py-8 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column: Team Status / Create+Join */}
            <div className="space-y-6">
              {userTeam ? (
                <>
                  <MyTeamPanel
                    team={userTeam}
                    onShare={() => setShowShareModal(true)}
                  />
                  <IncentivesPanel />
                </>
              ) : (
                <>
                  {/* No Team State - Create or Join */}
                  <div className="rounded-[2rem] border border-[#ecd9ba]/10 bg-[linear-gradient(180deg,rgba(236,217,186,0.06),rgba(236,217,186,0.02))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[#ecd9ba]/20 bg-[#ecd9ba]/10">
                        <svg
                          className="h-10 w-10 text-[#ecd9ba]"
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

                      <h2 className="font-heading text-2xl font-black text-white">
                        Join the Competition
                      </h2>
                      <p className="mx-auto mt-2 max-w-sm text-sm text-white/60">
                        Create your own team or join an existing one. Team up with
                        friends to compete for top prizes.
                      </p>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="flex-1 rounded-2xl bg-[linear-gradient(135deg,#7d050d,#d12429)] px-6 py-4 font-heading text-base font-bold text-white shadow-[0_0_24px_rgba(209,36,41,0.3)] transition hover:brightness-110"
                        >
                          Create Team
                        </button>
                        <button
                          onClick={() => setShowJoinModal(true)}
                          className="flex-1 rounded-2xl border border-[#ecd9ba]/30 bg-[#ecd9ba]/10 px-6 py-4 font-heading text-base font-bold text-[#ecd9ba] transition hover:bg-[#ecd9ba]/20"
                        >
                          Join Team
                        </button>
                      </div>

                      {/* Permanent Warning */}
                      <div className="mt-6 rounded-2xl border border-[#d12429]/20 bg-[#d12429]/5 p-4">
                        <div className="flex items-start justify-center gap-2 text-sm text-white/70">
                          <svg
                            className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#d12429]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <span>
                            Team assignment is{" "}
                            <span className="font-bold text-[#d12429]">permanent</span>.
                            Choose wisely.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <IncentivesPanel />
                </>
              )}
            </div>

            {/* Right Column: Leaderboard */}
            <Leaderboard userTeam={userTeam} />
          </div>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateTeamModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onTeamCreated={handleTeamCreated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showJoinModal && (
          <JoinTeamModal
            isOpen={showJoinModal}
            onClose={() => setShowJoinModal(false)}
            onTeamJoined={handleTeamJoined}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareModal && userTeam && (
          <TeamShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            team={userTeam}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
