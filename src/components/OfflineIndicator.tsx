import React from "react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { WifiOff } from "lucide-react";

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[3500] flex items-center gap-2 rounded-2xl bg-slate-900/90 dark:bg-slate-950/95 text-amber-400 border border-amber-500/40 px-3.5 py-2 text-xs font-bold shadow-2xl backdrop-blur-md animate-bounce">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>Mode Offline — Menggunakan data lokal ter-cache.</span>
    </div>
  );
};
