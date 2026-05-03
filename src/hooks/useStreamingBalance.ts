import { useCallback, useEffect, useRef, useState } from 'react';

interface StreamingBalanceConfig {
  /** The user's wallet token balance (from on-chain balanceOf) */
  walletBalance: number;
  /** Pending claimable rewards from mining contract */
  claimable: number;
  /** Last claim timestamp (unix seconds) from contract */
  lastClaimTime: number;
  /** Daily yield in BLOOM (from contract getDailyYield) */
  dailyYield: number;
  /** Whether the wallet is connected */
  isConnected: boolean;
}

interface StreamingBalanceResult {
  /** The live-updating display balance (wallet balance) */
  displayBalance: number;
  /** The live-updating claimable amount */
  streamingClaimable: number;
  /** Earning rate in BLOOM/hr */
  earningRate: number;
  /** Whether currently streaming */
  isStreaming: boolean;
  /** Whether the app is reconnecting */
  isReconnecting: boolean;
}

/**
 * Hook that produces a "streaming balance" effect using requestAnimationFrame.
 * Derives claimable from: lastClaimTime + dailyYield, updated at ~60fps.
 * Pauses when app is backgrounded and resumes correctly.
 */
export function useStreamingBalance(config: StreamingBalanceConfig): StreamingBalanceResult {
  const { walletBalance, claimable, lastClaimTime, dailyYield, isConnected } = config;
  
  const [streamingClaimable, setStreamingClaimable] = useState(claimable);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const rafRef = useRef<number>(0);
  const lastUpdateRef = useRef(0);
  const isVisibleRef = useRef(true);

  const yieldPerSecond = dailyYield / 86400;
  const earningRate = dailyYield / 24; // BLOOM/hr

  // Calculate claimable deterministically from lastClaimTime
  const calculateClaimable = useCallback(() => {
    if (!isConnected || lastClaimTime === 0 || dailyYield === 0) {
      return claimable; // fallback to contract read
    }
    const now = Date.now() / 1000;
    const elapsed = Math.max(0, now - lastClaimTime);
    return yieldPerSecond * elapsed;
  }, [isConnected, lastClaimTime, dailyYield, yieldPerSecond, claimable]);

  // Animation loop
  useEffect(() => {
    if (!isConnected || dailyYield === 0) {
      setStreamingClaimable(claimable);
      return;
    }

    let running = true;

    const tick = () => {
      if (!running) return;
      if (isVisibleRef.current) {
        const newClaimable = calculateClaimable();
        setStreamingClaimable(newClaimable);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    // Start with a small delay to let initial render settle
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isConnected, dailyYield, lastClaimTime, calculateClaimable, claimable]);

  // Visibility change handler (pause/resume)
  useEffect(() => {
    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
      if (isVisibleRef.current) {
        // Recalculate immediately on resume
        setStreamingClaimable(calculateClaimable());
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [calculateClaimable]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsReconnecting(false);
    const handleOffline = () => setIsReconnecting(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    displayBalance: walletBalance,
    streamingClaimable: isConnected ? streamingClaimable : claimable,
    earningRate,
    isStreaming: isConnected && dailyYield > 0,
    isReconnecting,
  };
}
