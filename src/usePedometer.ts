import { useCallback, useEffect, useRef, useState } from 'react';

export type PedometerState = 'idle' | 'requesting' | 'active' | 'denied' | 'unsupported';

const MAGNITUDE_THRESHOLD = 1.2;
const STEP_COOLDOWN_MS = 300;
const STRIDE_LENGTH_M = 0.75;
const STEPS_KEY = 'pilgrim-pedometer-steps';

function loadSteps(): number {
  try {
    const v = localStorage.getItem(STEPS_KEY);
    const n = v !== null ? parseInt(v, 10) : NaN;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

type DeviceMotionEventConstructor = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

export function usePedometer() {
  const [steps, setSteps] = useState(loadSteps);
  const [state, setState] = useState<PedometerState>('idle');
  const lastStepTime = useRef(0);
  const listenerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);

  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc || acc.x == null || acc.y == null || acc.z == null) return;

    const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    const now = Date.now();

    if (magnitude > MAGNITUDE_THRESHOLD && now - lastStepTime.current > STEP_COOLDOWN_MS) {
      lastStepTime.current = now;
      setSteps((s) => s + 1);
    }
  }, []);

  const start = useCallback(async () => {
    const DME = window.DeviceMotionEvent as DeviceMotionEventConstructor | undefined;
    if (!DME) {
      setState('unsupported');
      return;
    }

    if (typeof DME.requestPermission === 'function') {
      setState('requesting');
      try {
        const result = await DME.requestPermission();
        if (result !== 'granted') {
          setState('denied');
          return;
        }
      } catch {
        setState('denied');
        return;
      }
    }

    listenerRef.current = handleMotion;
    window.addEventListener('devicemotion', handleMotion);
    setState('active');
  }, [handleMotion]);

  const stop = useCallback(() => {
    if (listenerRef.current) {
      window.removeEventListener('devicemotion', listenerRef.current);
      listenerRef.current = null;
    }
    setState('idle');
  }, []);

  const addSteps = useCallback((n: number) => {
    setSteps((s) => Math.max(0, s + n));
  }, []);

  const addDistance = useCallback((km: number) => {
    setSteps((s) => Math.max(0, s + Math.round((km * 1000) / STRIDE_LENGTH_M)));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STEPS_KEY, String(steps));
    } catch {
      /* ignore */
    }
  }, [steps]);

  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        window.removeEventListener('devicemotion', listenerRef.current);
      }
    };
  }, []);

  const distanceKm = (steps * STRIDE_LENGTH_M) / 1000;

  return { steps, state, distanceKm, start, stop, addSteps, addDistance };
}
