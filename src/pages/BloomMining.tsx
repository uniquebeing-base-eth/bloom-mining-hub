import { useState } from 'react';
import { useBloomStore } from '@/store/bloomStore';
import { useOnchainFlowers, useOnchainJackpot, useOnchainMining } from '@/hooks/useOnchain';
import { useAccount, useConnect } from 'wagmi';
import { BalanceCard } from '@/components/BalanceCard';
import { FlowerCard } from '@/components/FlowerCard';
import { JackpotSection } from '@/components/JackpotSection';
import { JackpotModal } from '@/components/JackpotModal';
import { InviteModal } from '@/components/InviteModal';
import { UpgradeModal } from '@/components/UpgradeModal';
import { FLOWER_LEVELS, UNLOCK_COST, BloomFlower } from '@/types/bloom';
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

  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { upgradeFlowerOnchain, unlockFlowerOnchain, isPending, tokenBalance } = useOnchainFlowers();
  const { jackpotBalance, userTickets: onchainTickets } = useOnchainJackpot();

  const [showJackpotModal, setShowJackpotModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState<BloomFlower | null>(null);

  // Enable real-time mining accumulation
  useMiningAccumulation();

  const dailyYield = calculateTotalDailyYield();
  const miningRate = calculateMiningRate(dailyYield);
  
  // Use on-chain jackpot balance if available
  const displayJackpotPool = jackpotBalance > 0 ? jackpotBalance : 0;
  const displayTickets = isConnected ? onchainTickets : jackpotTickets;

  const handleClaim = () => {
    claimBloom();
    toast.success('BLOOM claimed successfully!', {
      description: `+${Math.floor(unclaimedBloom).toLocaleString()} BLOOM added to your balance`,
    });
  };

  const handleUnlock = async (flowerId: number) => {
    if (isConnected) {
      try {
        await unlockFlowerOnchain(flowerId - 1); // Contract is 0-indexed
      } catch {
        // Error toast already shown in hook
      }
    } else {
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
    }
  };

  const handleUpgradeClick = (flowerId: number) => {
    const flower = flowers.find((f) => f.id === flowerId);
    if (flower) {
      setSelectedFlower(flower);
      setShowUpgradeModal(true);
    }
  };

  const handleUpgrade = (flowerId: number) => {
    return upgradeFlower(flowerId);
  };

  const handleConnectWallet = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  };

  return (
    <div className="min-h-screen bloom-gradient-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2">
            <img src={bloomLogo} alt="Bloom" className="w-6 h-6 rounded-lg" />
            <h1 className="text-lg font-display font-bold text-foreground">Bloom Mining</h1>
          </div>
          {!isConnected && (
            <button
              onClick={handleConnectWallet}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-bloom-purple text-white"
            >
              Connect Wallet
            </button>
          )}
          {isConnected && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-bloom-green/20 text-bloom-green">
              🔗 Connected
            </span>
          )}
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
                  onUpgrade={handleUpgradeClick}
                  canUnlock={canUnlock}
                  canUpgrade={canUpgrade}
                />
              );
            })}
          </div>
        </section>

        {/* Jackpot & Invites */}
        <JackpotSection
          jackpotPool={displayJackpotPool}
          userTickets={displayTickets}
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
        jackpotPool={displayJackpotPool}
      />
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        flower={selectedFlower}
        balance={balance}
        onUpgrade={handleUpgrade}
        onUpgradeOnchain={upgradeFlowerOnchain}
        isOnchainPending={isPending}
        isConnected={isConnected}
      />
    </div>
  );
}
