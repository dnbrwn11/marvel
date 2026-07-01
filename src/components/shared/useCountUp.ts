// useCountUp — smoothly tweens a displayed number toward a target, rAF-driven and
// eased (easeOutCubic). On first mount it counts up from `startFrom` (default 0)
// over `mountDuration`; on every later target change it tweens from the current
// value over `duration`. So the hero/stat band counts up on load AND never snaps
// when an input changes. Lightweight — no dependencies.

import { useEffect, useRef, useState } from "react";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface CountUpOptions {
  duration?: number;      // ms for on-change tweens
  mountDuration?: number; // ms for the initial mount count-up
  startFrom?: number;     // value the mount count-up starts from
}

export function useCountUp(
  target: number,
  options: number | CountUpOptions = {},
): number {
  const opts = typeof options === "number" ? { duration: options } : options;
  const duration = opts.duration ?? 400;
  const mountDuration = opts.mountDuration ?? duration;
  const startFrom = opts.startFrom ?? 0;

  const [display, setDisplay] = useState(startFrom);
  const fromRef = useRef(startFrom);
  const mountedRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const isMount = !mountedRef.current;
    mountedRef.current = true;

    const from = isMount ? startFrom : fromRef.current;
    const dur = isMount ? mountDuration : duration;
    const delta = target - from;
    if (delta === 0) {
      fromRef.current = target;
      setDisplay(target);
      return;
    }

    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / dur, 1);
      const value = from + delta * easeOutCubic(progress);
      setDisplay(value);
      fromRef.current = value;
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
        setDisplay(target);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
    // Intentionally keyed on target only — duration/startFrom are read fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}
