import { useState } from 'react';
import { useBloomStore } from '@/store/bloomStore';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { BottomNav } from '@/components/BottomNav';
import { BloomMining } from '@/pages/BloomMining';
import { BloomBoost } from '@/pages/BloomBoost';
import { BloomSee } from '@/pages/BloomSee';

type Tab = 'mining' | 'boost' | 'see';

const Index = () => {
  const { hasOnboarded, setOnboarded } = useBloomStore();
  const [activeTab, setActiveTab] = useState<Tab>('mining');

  // Show onboarding if user hasn't entered invite code
  if (!hasOnboarded) {
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
