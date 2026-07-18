"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const SESSION_KEY = "rioanime:adult-content-confirmed";

type AgeGateValue = { ready: boolean; confirmed: boolean; confirmAdult: () => void };
const AgeGateContext = createContext<AgeGateValue | null>(null);

export function AgeGateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setConfirmed(sessionStorage.getItem(SESSION_KEY) === "1");
    setReady(true);
  }, []);

  function confirmAdult() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setConfirmed(true);
  }

  return <AgeGateContext.Provider value={{ ready, confirmed, confirmAdult }}>{children}</AgeGateContext.Provider>;
}

export function useAgeGate() {
  const value = useContext(AgeGateContext);
  if (!value) throw new Error("useAgeGate must be used inside AgeGateProvider");
  return value;
}
