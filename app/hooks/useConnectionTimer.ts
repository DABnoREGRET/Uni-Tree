import { useEffect, useState } from 'react';
import { useUserData } from '../contexts/UserDataContext';

/**
 * Custom hook to manage connection timer display
 * Centralizes timer logic to prevent multiple intervals running
 */
export const useConnectionTimer = () => {
  const { 
    dailyConnectionTimeLog, 
    sessionStartTime, 
    lastLogUpdateTime 
  } = useUserData();
  
  const [timeConnectedTodayDisplay, setTimeConnectedTodayDisplay] = useState("0h 0m 0s");
  const [pointsToday, setPointsToday] = useState(0);

  useEffect(() => {
    const formatTime = (ms: number): string => {
      if (ms < 0) ms = 0;
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours}h ${minutes}m ${seconds}s`;
    };

    const updateTimer = () => {
      let totalMs = dailyConnectionTimeLog?.totalTimeMs || 0;
      
      if (sessionStartTime) {
        const liveMs = Date.now() - (lastLogUpdateTime || sessionStartTime);
        totalMs += liveMs;
      }
      
      setTimeConnectedTodayDisplay(formatTime(totalMs));
      setPointsToday(Math.floor(totalMs / 60000));
    };

    // Initial update
    updateTimer();

    // Use requestAnimationFrame for smoother updates
    let animationFrameId: number;
    let lastUpdate = Date.now();
    
    const animate = () => {
      const now = Date.now();
      // Only update every second
      if (now - lastUpdate >= 1000) {
        updateTimer();
        lastUpdate = now;
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [sessionStartTime, lastLogUpdateTime, dailyConnectionTimeLog]);

  return { timeConnectedTodayDisplay, pointsToday };
}; 