import { useEffect, useState } from 'react';

function diff(target: number) {
  return Math.max(0, target - Date.now());
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function Countdown({
  expiresAt,
  onExpire,
}: {
  expiresAt: string;
  onExpire?: () => void;
}) {
  const target = new Date(expiresAt).getTime();
  const [remaining, setRemaining] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => {
      const next = diff(target);
      setRemaining(next);
      if (next === 0) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [target, onExpire]);

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="flex items-center justify-center gap-2 font-mono text-2xl font-bold text-slate-900">
      <span className="bg-slate-900 text-white rounded-lg px-3 py-2">{pad(hours)}</span>
      <span>:</span>
      <span className="bg-slate-900 text-white rounded-lg px-3 py-2">{pad(minutes)}</span>
      <span>:</span>
      <span className="bg-slate-900 text-white rounded-lg px-3 py-2">{pad(seconds)}</span>
    </div>
  );
}
