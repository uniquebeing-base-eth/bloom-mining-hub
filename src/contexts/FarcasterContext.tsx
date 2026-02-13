import { createContext, useContext, ReactNode } from 'react';
import { useFarcasterUser, FarcasterUser } from '@/hooks/useFarcasterUser';

interface FarcasterContextValue {
  user: FarcasterUser | null;
  isLoading: boolean;
  isSDKLoaded: boolean;
  error: string | null;
  promptAddMiniApp: () => Promise<void>;
}

const FarcasterContext = createContext<FarcasterContextValue | undefined>(undefined);

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, isSDKLoaded, error, promptAddMiniApp } = useFarcasterUser();

  return (
    <FarcasterContext.Provider value={{ user, isLoading, isSDKLoaded, error, promptAddMiniApp }}>
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (context === undefined) {
    throw new Error('useFarcaster must be used within a FarcasterProvider');
  }
  return context;
}
