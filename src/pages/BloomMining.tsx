import { useState, useCallback, useMemo } from 'react';
import { useBloomStore } from '@/store/bloomStore';
import { useOnchainFlowers, useOnchainJackpot, useOnchainMining } from '@/hooks/useOnchain';
import { useStreamingBalance } from '@/hooks/useStreamingBalance';
import { useAccount, useConnect } from 'wagmi';
import { BalanceCard } from '@/components/BalanceCard';
import { FlowerCard } from '@/components/FlowerCard';
import { JackpotSection } from '@/components/JackpotSection';
import { JackpotModal } from '@/components/JackpotModal';
import { InviteModal } from '@/components/InviteModal';
import { UpgradeModal } from '@/components/UpgradeModal';
import { FLOWER_LEVELS, UNLOCK_COST, BloomFlower } from '@/types/bloom';
import { toast } from 'sonner';
import bloomLogo from '@/assets/bloom-logo.png';

export function BloomMining() {
  const {
    flowers: localFlowers,
    boostMultiplier,
    invitesUsed,
    invitesAvailable,
    claimBloom,
    unlockFlower,
    upgradeFlower,
  } = useBloomStore();

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const {
    upgradeFlowerOnchain,
    unlockFlowerOnchain,
    isPending,
    tokenBalance,
    hasOnboarded: hasOnboardedOnchain,
    onboardOnchain,
    userInviteCode: onchainInviteCode,
    onchainFlowers,
    refetchFlowers,
  } = useOnchainFlowers();
  const { jackpotBalance, userTickets: onchainTickets } = useOnchainJackpot();
  const {
    claimable: onchainClaimable,
    wouldBeBurned,
    dailyYield: onchainDailyYield,
    lastClaimTime,
    claimMiningOnchain,
    isPending: isMiningPending,
    refetchPending,
  } = useOnchainMining();

  const [showJackpotModal, setShowJackpotModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState<BloomFlower | null>(null);
  const [showOnboardPrompt, setShowOnboardPrompt] = useState(false);
  const [onboardCode, setOnboardCode] = useState('');

  // Derive wallet balance from on-chain
  const walletBalance = isConnected && tokenBalance
    ? Number(tokenBalance / BigInt(1e18))
    : 0;

  // Streaming balance system
  const {
    displayBalance,
    streamingClaimable,
    earningRate,
    isStreaming,
    isReconnecting,
  } = useStreamingBalance({
    walletBalance,
    claimable: onchainClaimable,
    lastClaimTime,
    dailyYield: onchainDailyYield,
    isConnected,
  });

  // Derive flowers from on-chain data when connected
  const flowers: BloomFlower[] = useMemo(() => {
    if (isConnected && onchainFlowers) {
      return (onchainFlowers as any[]).map((f: any, i: number) => ({
        id: i + 1,
        level: Math.max(1, Number(f.level)) as 1 | 2 | 3 | 4 | 5,
        isUnlocked: Boolean(f.unlocked),
        isBlooming: Boolean(f.unlocked),
      }));
    }
    return localFlowers;
  }, [isConnected, onchainFlowers, localFlowers]);

  // Derive tickets from on-chain data + holdings
  const holdingTickets = Math.floor(walletBalance / 1_000_000);
  const displayTickets = isConnected ? (onchainTickets + holdingTickets) : 0;
  const displayJackpotPool = jackpotBalance > 0 ? jackpotBalance : 0;

  const handleClaim = useCallback(async () => {
    if (isConnected) {
      try {
        await claimMiningOnchain();
        await refetchPending();
      } catch {
        // Error toast shown in hook
      }
    } else {
      claimBloom();
      toast.success('BLOOM claimed!');
    }
  }, [isConnected, claimMiningOnchain, refetchPending, claimBloom]);

  const requiresOnchainOnboarding = isConnected && !hasOnboardedOnchain;

  const handleOnboardOnchain = useCallback(async () => {
    if (!onboardCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }
    try {
      await onboardOnchain(onboardCode.trim());
      setShowOnboardPrompt(false);
      setOnboardCode('');
    } catch {
      // Error toast in hook
    }
  }, [onboardCode, onboardOnchain]);

  const handleUnlock = useCallback(async (flowerId: number) => {
    if (isConnected) {
      if (requiresOnchainOnboarding) {
        setShowOnboardPrompt(true);
        return;
      }
      try {
        await unlockFlowerOnchain(flowerId - 1);
        await refetchFlowers();
      } catch {
        // Error toast in hook
      }
    } else {
      const success = unlockFlower(flowerId);
      if (success) toast.success('Flower unlocked! 🌸');
      else toast.error('Insufficient BLOOM');
    }
  }, [isConnected, requiresOnchainOnboarding, unlockFlowerOnchain, refetchFlowers, unlockFlower]);

  const handleUpgradeClick = useCallback((flowerId: number) => {
    if (isConnected && requiresOnchainOnboarding) {
      setShowOnboardPrompt(true);
      return;
    }
    const flower = flowers.find((f) => f.id === flowerId);
    if (flower) {
      setSelectedFlower(flower);
      setShowUpgradeModal(true);
    }
  }, [isConnected, requiresOnchainOnboarding, flowers]);

  const handleUpgrade = useCallback((flowerId: number) => {
    return upgradeFlower(flowerId);
  }, [upgradeFlower]);

  const handleUpgradeOnchain = useCallback(async (flowerIndex: number, currentLevel: number) => {
    const result = await upgradeFlowerOnchain(flowerIndex, currentLevel);
    // After tx, refetch on-chain state
    await refetchFlowers();
    await refetchPending();
    return result;
  }, [upgradeFlowerOnchain, refetchFlowers, refetchPending]);

  const handleConnectWallet = useCallback(() => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [connectors, connect]);

  return (
    <div className="min-h-screen bloom-gradient-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2">
            <img src={bloomLogo} alt="Bloom" className="w-6 h-6 rounded-lg" />
            <h1 className="text-lg font-display font-bold text-foreground">Bloom Mining</h1>
          </div>
          {!isConnected ? (
            <button
              onClick={handleConnectWallet}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-bloom-purple text-white"
            >
              Connect Wallet
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-bloom-green/20 text-bloom-green">
              🔗 Connected
            </span>
          )}
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* On-chain Onboarding Prompt */}
        {requiresOnchainOnboarding && (
          <div className="bloom-card rounded-2xl p-5 border border-bloom-gold/30 bg-bloom-gold/5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚠️</span>
              <h3 className="font-display font-semibold text-foreground">On-Chain Onboarding Required</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your invite code to start mining on-chain.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={onboardCode}
                onChange={(e) => setOnboardCode(e.target.value.toUpperCase())}
                placeholder="Enter invite code"
                className="flex-1 px-4 py-3 rounded-xl bg-secondary text-sm font-mono uppercase tracking-wider border-2 border-transparent focus:border-bloom-pink focus:outline-none"
                maxLength={20}
              />
              <button
                onClick={handleOnboardOnchain}
                disabled={isPending || !onboardCode.trim()}
                className="px-4 py-3 rounded-xl bloom-gradient-button text-white font-medium text-sm disabled:opacity-50"
              >
                {isPending ? '...' : 'Onboard'}
              </button>
            </div>
          </div>
        )}

        {/* Balance Card - streaming */}
        <BalanceCard
          balance={displayBalance}
          streamingClaimable={streamingClaimable}
          earningRate={earningRate}
          boostMultiplier={boostMultiplier}
          onClaim={handleClaim}
          hasPendingClaim={streamingClaimable > 0}
          wouldBeBurned={isConnected ? wouldBeBurned : 0}
          isClaimPending={isMiningPending}
          isStreaming={isStreaming}
          isReconnecting={isReconnecting}
          walletAddress={address}
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
              const checkBalance = isConnected ? walletBalance : 0;
              const canUnlock = !flower.isUnlocked && checkBalance >= UNLOCK_COST;
              const canUpgrade =
                flower.isUnlocked &&
                flower.isBlooming &&
                flower.level < 5 &&
                nextLevelInfo != null &&
                checkBalance >= nextLevelInfo.upgradeCost;

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
        userTickets={displayTickets}
        walletBalance={walletBalance}
      />
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onchainInviteCode={onchainInviteCode}
      />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          // Refetch after closing upgrade modal to reflect new level
          if (isConnected) {
            refetchFlowers();
            refetchPending();
          }
        }}
        flower={selectedFlower}
        balance={walletBalance}
        onUpgrade={handleUpgrade}
        onUpgradeOnchain={handleUpgradeOnchain}
        isOnchainPending={isPending}
        isConnected={isConnected}
      />
    </div>
  );
}
