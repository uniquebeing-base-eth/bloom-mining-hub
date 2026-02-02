import { useState } from 'react';
import { useBloomStore } from '@/store/bloomStore';
import { BalanceCard } from '@/components/BalanceCard';
import { FlowerCard } from '@/components/FlowerCard';
import { JackpotSection } from '@/components/JackpotSection';
import { JackpotModal } from '@/components/JackpotModal';
import { InviteModal } from '@/components/InviteModal';
import { FLOWER_LEVELS, UNLOCK_COST } from '@/types/bloom';
import { calculateMiningRate } from '@/lib/bloom-utils';
import { useMiningAccumulation } from '@/hooks/useMiningAccumulation';
import { toast } from 'sonner';
import bloomLogo from '@/assets/bloom-logo.png';

export function BloomMining() {
  const {
    balance,
    unclaimedBloom,
    flowers,
    boostMultiplier,
    jackpotTickets,
    invitesUsed,
    invitesAvailable,
    claimBloom,
    unlockFlower,
    upgradeFlower,
    calculateTotalDailyYield,
  } = useBloomStore();

  const [showJackpotModal, setShowJackpotModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Enable real-time mining accumulation
  useMiningAccumulation();

  const dailyYield = calculateTotalDailyYield();
  const miningRate = calculateMiningRate(dailyYield);
  const jackpotPool = 51_200; // Demo value

  const handleClaim = () => {
    claimBloom();
    toast.success('BLOOM claimed successfully!', {
      description: `+${Math.floor(unclaimedBloom).toLocaleString()} BLOOM added to your balance`,
    });
  };

  const handleUnlock = (flowerId: number) => {
    const success = unlockFlower(flowerId);
    if (success) {
      toast.success('Flower unlocked! 🌸', {
        description: 'Your new flower is now blooming and mining.',
      });
    } else {
      toast.error('Insufficient BLOOM', {
        description: `You need ${UNLOCK_COST.toLocaleString()} BLOOM to unlock this flower.`,
      });
    }
  };

  const handleUpgrade = (flowerId: number) => {
    const flower = flowers.find((f) => f.id === flowerId);
    if (!flower) return;

    const nextLevel = flower.level + 1;
    const levelInfo = FLOWER_LEVELS[nextLevel - 1];

    const result = upgradeFlower(flowerId);

    if (result.success) {
      toast.success(`Upgrade successful! 🎉`, {
        description: `Flower upgraded to Level ${nextLevel}! Daily yield: ${levelInfo.dailyYield.toLocaleString()} BLOOM`,
      });
    } else if (result.burned > 0) {
      toast.error('Upgrade failed 💔', {
        description: `${result.burned.toLocaleString()} BLOOM burned. Better luck next time!`,
      });
    }
  };

  return (
    <div className="min-h-screen bloom-gradient-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-center gap-2 py-4 px-4">
          <img src={bloomLogo} alt="Bloom" className="w-6 h-6 rounded-lg" />
          <h1 className="text-lg font-display font-bold text-foreground">Bloom Mining</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Balance Card */}
        <BalanceCard
          balance={balance}
          unclaimedBloom={unclaimedBloom}
          miningRate={miningRate}
          boostMultiplier={boostMultiplier}
          onClaim={handleClaim}
          hasPendingClaim={unclaimedBloom > 0}
        />

        {/* Flower Grid */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🌺</span>
            <h2 className="font-display font-semibold text-foreground">Bloom Flowers</h2>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {flowers.map((flower) => {
              const nextLevel = flower.level + 1;
              const nextLevelInfo = nextLevel <= 5 ? FLOWER_LEVELS[nextLevel - 1] : null;
              const canUnlock = !flower.isUnlocked && balance >= UNLOCK_COST;
              const canUpgrade =
                flower.isUnlocked &&
                flower.isBlooming &&
                flower.level < 5 &&
                nextLevelInfo &&
                balance >= nextLevelInfo.upgradeCost;

              return (
                <FlowerCard
                  key={flower.id}
                  flower={flower}
                  onUnlock={handleUnlock}
                  onUpgrade={handleUpgrade}
                  canUnlock={canUnlock}
                  canUpgrade={canUpgrade}
                />
              );
            })}
          </div>
        </section>

        {/* Jackpot & Invites */}
        <JackpotSection
          jackpotPool={jackpotPool}
          userTickets={jackpotTickets}
          invitesUsed={invitesUsed}
          invitesAvailable={invitesAvailable}
          onJackpotClick={() => setShowJackpotModal(true)}
          onInviteClick={() => setShowInviteModal(true)}
        />
      </main>

      {/* Modals */}
      <JackpotModal
        isOpen={showJackpotModal}
        onClose={() => setShowJackpotModal(false)}
        jackpotPool={jackpotPool}
      />
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
}
