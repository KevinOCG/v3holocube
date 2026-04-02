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
  joinTeam: (team: Team) => void;
  leaveTeam: () => void;
  addVolume: (amount: number) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [team, setTeam] = useState<Team | null>(null);

  const joinTeam = useCallback((newTeam: Team) => {
    setTeam(newTeam);
  }, []);

  const leaveTeam = useCallback(() => {
    setTeam(null);
  }, []);

  const addVolume = useCallback((amount: number) => {
    setTeam((prev) => prev ? { ...prev, volume: prev.volume + amount } : null);
  }, []);

  return (
    <TeamContext.Provider value={{ team, joinTeam, leaveTeam, addVolume }}>
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
