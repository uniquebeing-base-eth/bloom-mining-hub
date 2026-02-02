import { useEffect, useRef } from 'react';
import { useBloomStore } from '@/store/bloomStore';

export function useMiningAccumulation() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { flowers, boostMultiplier, addUnclaimedBloom, calculateTotalDailyYield } = useBloomStore();

  useEffect(() => {
    // Calculate yield per second
    const dailyYield = calculateTotalDailyYield();
    const yieldPerSecond = dailyYield / 24 / 60 / 60;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Only accumulate if there are blooming flowers
    const hasBloomingFlowers = flowers.some(f => f.isUnlocked && f.isBlooming);
    
    if (hasBloomingFlowers && yieldPerSecond > 0) {
      // Update every second
      intervalRef.current = setInterval(() => {
        addUnclaimedBloom(yieldPerSecond);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [flowers, boostMultiplier, addUnclaimedBloom, calculateTotalDailyYield]);
}
