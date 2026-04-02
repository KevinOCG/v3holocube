"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface Team {
  name: string;
  code: string;
  volume: number;
  rank: number;
  memberCount: number;
}

interface TeamContextType {
  team: Team | null;
  isInTeam: boolean;
  joinTeam: (team: Team) => void;
  leaveTeam: () => void;
  addVolume: (amount: number) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [team, setTeam] = useState<Team | null>(null);

  const joinTeam = useCallback((newTeam: Team) => {
    console.log("[v0] joinTeam called with:", newTeam);
    setTeam(newTeam);
  }, []);

  const leaveTeam = useCallback(() => {
    setTeam(null);
  }, []);

  const addVolume = useCallback((amount: number) => {
    setTeam((prev) => {
      if (!prev) return null;
      return { ...prev, volume: prev.volume + amount };
    });
  }, []);

  return (
    <TeamContext.Provider
      value={{
        team,
        isInTeam: team !== null,
        joinTeam,
        leaveTeam,
        addVolume,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}
