"use client";
// Providers wrapper - v2

import { TeamProvider } from "../contexts/team-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <TeamProvider>{children}</TeamProvider>;
}
