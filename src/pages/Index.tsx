import { useState, useEffect } from 'react';
import { useBloomStore } from '@/store/bloomStore';
import { useFarcaster } from '@/contexts/FarcasterContext';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { BottomNav } from '@/components/BottomNav';
import { BloomMining } from '@/pages/BloomMining';
import { BloomBoost } from '@/pages/BloomBoost';
import { BloomSee } from '@/pages/BloomSee';
import bloomLogo from '@/assets/bloom-logo.png';

type Tab = 'mining' | 'boost' | 'see';

const Index = () => {
  const { hasOnboarded, setOnboarded, setFarcasterUser } = useBloomStore();
  const { user, isLoading, isSDKLoaded, promptAddMiniApp } = useFarcaster();
  const [activeTab, setActiveTab] = useState<Tab>('mining');
  const [hasPromptedAdd, setHasPromptedAdd] = useState(false);

  // Auto-sign in Farcaster user
  useEffect(() => {
    if (isSDKLoaded && user && !hasOnboarded) {
      setFarcasterUser(user.fid, user.username);
    }
  }, [isSDKLoaded, user, hasOnboarded, setFarcasterUser]);

  // Prompt user to add mini app for notifications (once per session)
  useEffect(() => {
    if (isSDKLoaded && user && !hasPromptedAdd) {
      setHasPromptedAdd(true);
      // Small delay so the app renders first
      const timer = setTimeout(() => {
        promptAddMiniApp();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSDKLoaded, user, hasPromptedAdd, promptAddMiniApp]);

  // Show loading while SDK initializes
  if (isLoading) {
    return (
      <div className="min-h-screen bloom-gradient-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src={bloomLogo}
            alt="Bloom Protocol"
            className="w-20 h-20 rounded-3xl bloom-shadow animate-pulse"
          />
          <p className="text-muted-foreground">Loading Bloom...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if user hasn't entered invite code and no Farcaster user
  if (!hasOnboarded && !user) {
    return <OnboardingScreen onComplete={setOnboarded} />;
  }

  // Render active tab
  const renderTab = () => {
    switch (activeTab) {
      case 'mining':
        return <BloomMining />;
      case 'boost':
        return <BloomBoost />;
      case 'see':
        return <BloomSee />;
      default:
        return <BloomMining />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderTab()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
