import { useState, useEffect } from 'react';

export type NightState = 'ACTIVE' | 'CLOSED';

// Global test toggle for development - SET TO TRUE TO SHOW ACTIVE STATE AT ANY TIME
let testModeActive = false;
export const toggleTestMode = () => {
  testModeActive = !testModeActive;
  console.log(`[After Midnight] Test Mode: ${testModeActive ? 'ON' : 'OFF'}`);
  return testModeActive;
};

export const useNightCycle = () => {
  const [state, setState] = useState<NightState>('CLOSED');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [coolingFactor, setCoolingFactor] = useState<number>(0); // 0 at midnight, 1 at 4:00 AM

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      // Real Logic: active between 12:00 AM and 4:00 AM
      // Override with testModeActive for development
      const isActive = testModeActive || (hours >= 0 && hours < 4);

      if (isActive) {
        setState('ACTIVE');

        // Calculate cooling factor (how close we are to 4 AM)
        const totalSecondsInWindow = 4 * 3600;
        // Logic change: In test mode, pretend it's 1:MM:SS AM so the clock actually ticks
        const currentSeconds = testModeActive
          ? (1 * 3600) + (minutes * 60) + seconds
          : ((hours * 3600) + (minutes * 60) + seconds);
        setCoolingFactor(currentSeconds / totalSecondsInWindow);

        // Time remaining until 4 AM
        const remainingSeconds = totalSecondsInWindow - currentSeconds;
        const h = Math.floor(remainingSeconds / 3600);
        const m = Math.floor((remainingSeconds % 3600) / 60);
        const s = remainingSeconds % 60;
        setTimeRemaining(`${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      } else {
        setState('CLOSED');
        setCoolingFactor(0);
        setTimeRemaining('');
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return { state, timeRemaining, coolingFactor, toggleTestMode };
};
