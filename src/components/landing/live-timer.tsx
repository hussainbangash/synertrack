"use client";

import { useEffect, useState } from "react";

/** A clock that ticks up from a base value, so the mockups feel alive. */
export function LiveTimer({
  baseSeconds = 8027,
  className = "",
}: {
  baseSeconds?: number;
  className?: string;
}) {
  const [seconds, setSeconds] = useState(baseSeconds);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span className={`tabular-nums ${className}`}>
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
