'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';

/**
 * A delete button that requires two clicks: the first arms it ("Confirm?", turns red, auto-disarms after
 * 4s), the second actually fires `onConfirm`. Used instead of `window.confirm()` — a native dialog is
 * inconsistent with the rest of this app's UI and, in practice, unreliable in automated browser testing.
 */
export function ConfirmDeleteButton({
  darkMode,
  label,
  busy,
  onConfirm
}: {
  darkMode: boolean;
  label: string;
  busy: boolean;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setConfirming(false), 4000);
      return;
    }
    if (timeout.current) clearTimeout(timeout.current);
    setConfirming(false);
    onConfirm();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      title={confirming ? 'Click again to confirm' : label}
      aria-label={confirming ? `Click again to confirm: ${label}` : label}
      className={`inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition disabled:opacity-50 ${
        confirming
          ? 'bg-rose-500 text-white hover:bg-rose-600'
          : darkMode
            ? 'text-slate-400 hover:bg-rose-400/10 hover:text-rose-300'
            : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
      }`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      {confirming && 'Confirm?'}
    </button>
  );
}
