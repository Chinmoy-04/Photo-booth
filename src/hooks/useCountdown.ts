"use client";

import { useState, useCallback, useRef } from "react";

export function useCountdown(seconds: number = 3) {
  const [count, setCount] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(
    (onComplete: () => void) => {
      setIsRunning(true);
      let current = seconds;
      setCount(current);

      const tick = () => {
        current -= 1;
        if (current > 0) {
          setCount(current);
          timeoutRef.current = setTimeout(tick, 1000);
        } else {
          setCount(null);
          setIsRunning(false);
          onComplete();
        }
      };
      timeoutRef.current = setTimeout(tick, 1000);
    },
    [seconds]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCount(null);
    setIsRunning(false);
  }, []);

  return { count, isRunning, start, cancel };
}
