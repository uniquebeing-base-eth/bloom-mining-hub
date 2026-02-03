import { useState, useEffect, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface UseFarcasterUserReturn {
  user: FarcasterUser | null;
  isLoading: boolean;
  isSDKLoaded: boolean;
  error: string | null;
}

export function useFarcasterUser(): UseFarcasterUserReturn {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeSDK = useCallback(async () => {
    try {
      // Get context from SDK which includes user info
      const context = await sdk.context;
      
      if (context?.user) {
        setUser({
          fid: context.user.fid,
          username: context.user.username,
          displayName: context.user.displayName,
          pfpUrl: context.user.pfpUrl,
        });
      }
      
      // Call ready to signal the app is ready
      await sdk.actions.ready();
      setIsSDKLoaded(true);
    } catch (err) {
      console.error('Failed to initialize Farcaster SDK:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize');
      // Still mark as loaded even on error so app can fallback
      setIsSDKLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeSDK();
  }, [initializeSDK]);

  return { user, isLoading, isSDKLoaded, error };
}
