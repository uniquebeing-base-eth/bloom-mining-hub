import { useState, useEffect } from 'react';
import { BloomFlower, FLOWER_LEVELS } from '@/types/bloom';
import { formatBloom, getFlowerEmoji } from '@/lib/bloom-utils';
import { X, TrendingUp, Flame, Ticket, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  flower: BloomFlower | null;
  balance: number;
  onUpgrade: (flowerId: number) => { success: boolean; burned: number; toJackpot: number };
  onUpgradeOnchain?: (flowerIndex: number, currentLevel: number) => Promise<any>;
  isOnchainPending?: boolean;
  isConnected?: boolean;
}

type UpgradeState = 'confirm' | 'rolling' | 'success' | 'failed';

export function UpgradeModal({ isOpen, onClose, flower, balance, onUpgrade, onUpgradeOnchain, isOnchainPending, isConnected }: UpgradeModalProps) {
  const [upgradeState, setUpgradeState] = useState<UpgradeState>('confirm');
  const [result, setResult] = useState<{ success: boolean; burned: number; toJackpot: number } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setUpgradeState('confirm');
      setResult(null);
    }
  }, [isOpen]);

  if (!isOpen || !flower) return null;

  const currentLevel = flower.level;
  const nextLevel = currentLevel + 1;
  const currentLevelInfo = FLOWER_LEVELS[currentLevel - 1];
  const nextLevelInfo = FLOWER_LEVELS[nextLevel - 1];
  const canAfford = balance >= nextLevelInfo.upgradeCost;

  const handleUpgradeOnchain = async () => {
    if (!onUpgradeOnchain) return;
    setUpgradeState('rolling');
    try {
      await onUpgradeOnchain(flower.id - 1, currentLevel); // Contract uses 0-indexed
      // On-chain success - we won't know success/fail until tx confirms
      // For now show success UI (the contract handles the randomness)
      setUpgradeState('success');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B9D', '#C084FC', '#FFD700', '#22C55E'],
      });
    } catch {
      setUpgradeState('failed');
      setResult({ success: false, burned: nextLevelInfo.upgradeCost * 0.85, toJackpot: nextLevelInfo.upgradeCost * 0.15 });
    }
  };

  const handleUpgradeOffchain = () => {
    setUpgradeState('rolling');
    setTimeout(() => {
      const upgradeResult = onUpgrade(flower.id);
      setResult(upgradeResult);
      if (upgradeResult.success) {
        setUpgradeState('success');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF6B9D', '#C084FC', '#FFD700', '#22C55E'],
        });
      } else {
        setUpgradeState('failed');
      }
    }, 1500);
  };

  const handleUpgrade = () => {
    if (isConnected && onUpgradeOnchain) {
      handleUpgradeOnchain();
    } else {
      handleUpgradeOffchain();
    }
  };

  const renderContent = () => {
    switch (upgradeState) {
      case 'rolling':
        return (
          <div className="text-center py-8">
            <div className="text-6xl mb-4 animate-bounce">🎲</div>
            <p className="text-lg font-display font-bold text-foreground animate-pulse">
              {isConnected ? 'Confirm in wallet...' : `Rolling for Level ${nextLevel}...`}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full bg-bloom-pink animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-6">
            <div className="relative mb-4">
              <div className="text-7xl animate-float">
                {getFlowerEmoji(nextLevel, true)}
              </div>
              <div className="absolute -top-2 -right-2 text-3xl animate-pulse">✨</div>
            </div>
            <h3 className="text-2xl font-display font-bold text-bloom-green mb-2">
              {isConnected ? 'Transaction Sent!' : 'Upgrade Successful!'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isConnected ? 'Check your wallet for the result' : `Your flower is now Level ${nextLevel}!`}
            </p>
            <div className="p-4 rounded-xl bg-bloom-green/10 border border-bloom-green/30 mb-4">
              <div className="flex items-center justify-center gap-2 text-bloom-gold">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold">{formatBloom(nextLevelInfo.dailyYield)}/day</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Ticket className="w-4 h-4" />
              <span>+{nextLevel === 2 ? 20 : nextLevel === 3 ? 30 : nextLevel === 4 ? 40 : 50} jackpot tickets earned!</span>
            </div>
            <button onClick={onClose} className="mt-6 w-full py-3 rounded-xl bloom-gradient-button text-white font-medium">
              Continue Blooming
            </button>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center py-6">
            <div className="relative mb-4">
              <div className="text-7xl opacity-50 grayscale">{getFlowerEmoji(currentLevel, true)}</div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Flame className="w-12 h-12 text-red-500 animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-display font-bold text-red-500 mb-2">
              {isConnected ? 'Transaction Failed' : 'Upgrade Failed'}
            </h3>
            <p className="text-muted-foreground mb-4">Your flower remains at Level {currentLevel}</p>
            {result && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">BLOOM Burned:</span>
                  <span className="font-bold text-red-500">{formatBloom(result.burned)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">To Jackpot:</span>
                  <span className="font-bold text-bloom-gold">{formatBloom(result.toJackpot)}</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Ticket className="w-4 h-4" />
              <span>+{nextLevel === 2 ? 20 : nextLevel === 3 ? 30 : nextLevel === 4 ? 40 : 50} jackpot tickets for trying!</span>
            </div>
            <button onClick={onClose} className="mt-6 w-full py-3 rounded-xl bg-secondary text-foreground font-medium">
              Try Again Later
            </button>
          </div>
        );

      default:
        return (
          <>
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-5xl mb-2">{getFlowerEmoji(currentLevel, true)}</div>
                <p className="text-sm text-muted-foreground">Level {currentLevel}</p>
                <p className="text-xs text-bloom-gold">{formatBloom(currentLevelInfo.dailyYield)}/day</p>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-6 h-6 text-bloom-pink" />
              </div>
              <div className="text-center">
                <div className="text-5xl mb-2">{getFlowerEmoji(nextLevel, true)}</div>
                <p className="text-sm text-muted-foreground">Level {nextLevel}</p>
                <p className="text-xs text-bloom-gold">{formatBloom(nextLevelInfo.dailyYield)}/day</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Upgrade Cost</span>
                <span className="font-bold text-foreground">{formatBloom(nextLevelInfo.upgradeCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className={cn(
                  'font-bold',
                  nextLevelInfo.successRate >= 60 ? 'text-bloom-green' : 
                  nextLevelInfo.successRate >= 30 ? 'text-bloom-gold' : 'text-red-500'
                )}>
                  {nextLevelInfo.successRate}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Your Balance</span>
                <span className={cn('font-bold', canAfford ? 'text-foreground' : 'text-red-500')}>
                  {formatBloom(balance)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-bloom-gold/10 border border-bloom-gold/20 mb-4">
              <p className="text-xs text-muted-foreground">
                ⚠️ If upgrade fails: 85% burned, 15% to jackpot pool
              </p>
            </div>

            {isConnected && (
              <div className="p-3 rounded-xl bg-bloom-green/10 border border-bloom-green/20 mb-4">
                <p className="text-xs text-bloom-green font-medium">
                  🔗 On-chain upgrade via Farcaster Wallet
                </p>
              </div>
            )}

            <button
              onClick={handleUpgrade}
              disabled={!canAfford || isOnchainPending}
              className={cn(
                'w-full py-4 rounded-xl font-display font-bold text-lg transition-all',
                canAfford
                  ? 'bloom-gradient-button text-white bloom-button-shadow hover:opacity-90 active:scale-[0.98]'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {isOnchainPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : canAfford ? (
                `Upgrade to Level ${nextLevel}`
              ) : (
                'Insufficient BLOOM'
              )}
            </button>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={upgradeState === 'rolling' ? undefined : onClose} />
      <div className="relative w-full max-w-sm bg-card rounded-2xl p-6 animate-scale-in">
        {upgradeState === 'confirm' && (
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
        {upgradeState === 'confirm' && (
          <h2 className="text-lg font-display font-bold text-foreground mb-4 text-center">Upgrade Flower</h2>
        )}
        {renderContent()}
      </div>
    </div>
  );
}
