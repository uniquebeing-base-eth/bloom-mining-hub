import { useState, useEffect } from 'react';
import { BloomFlower, FLOWER_LEVELS, RARITY_COLORS } from '@/types/bloom';
import { formatBloom, getFlowerImage, playUpgradeSuccess, playUpgradeFail, playClick } from '@/lib/bloom-utils';
import { X, TrendingUp, Flame, Ticket, Sparkles, Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import type { UpgradeOnchainResult } from '@/hooks/useOnchain';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  flower: BloomFlower | null;
  balance: number;
  onUpgrade: (flowerId: number) => { success: boolean; burned: number; toJackpot: number };
  onUpgradeOnchain?: (flowerIndex: number, currentLevel: number) => Promise<UpgradeOnchainResult | undefined>;
  isOnchainPending?: boolean;
  isConnected?: boolean;
}

type UpgradeState = 'confirm' | 'rolling' | 'success' | 'failed';

export function UpgradeModal({ isOpen, onClose, flower, balance, onUpgrade, onUpgradeOnchain, isOnchainPending, isConnected }: UpgradeModalProps) {
  const [upgradeState, setUpgradeState] = useState<UpgradeState>('confirm');
  const [result, setResult] = useState<{ success: boolean; burned: number; toJackpot: number } | null>(null);
  const [onchainResult, setOnchainResult] = useState<UpgradeOnchainResult | null>(null);
  const [rollNumber, setRollNumber] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setUpgradeState('confirm');
      setResult(null);
      setOnchainResult(null);
      setRollNumber(0);
    }
  }, [isOpen]);

  // Rolling animation
  useEffect(() => {
    if (upgradeState !== 'rolling') return;
    const interval = setInterval(() => {
      setRollNumber(Math.floor(Math.random() * 100));
    }, 80);
    return () => clearInterval(interval);
  }, [upgradeState]);

  if (!isOpen || !flower) return null;

  const currentLevel = flower.level;
  const nextLevel = currentLevel + 1;
  const currentLevelInfo = FLOWER_LEVELS[currentLevel - 1];
  const nextLevelInfo = FLOWER_LEVELS[nextLevel - 1];
  const canAfford = balance >= nextLevelInfo.upgradeCost;
  const ticketsEarned = { 2: 20, 3: 30, 4: 40, 5: 50 }[nextLevel] || 0;

  const handleUpgradeOnchain = async () => {
    if (!onUpgradeOnchain) return;
    playClick();
    setUpgradeState('rolling');
    try {
      const txResult = await onUpgradeOnchain(flower.id - 1, currentLevel);
      if (!txResult) return;
      setOnchainResult(txResult);
      setResult({ success: txResult.success, burned: txResult.burned, toJackpot: txResult.toJackpot });
      setUpgradeState(txResult.success ? 'success' : 'failed');
      if (txResult.success) {
        playUpgradeSuccess();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FF6B9D', '#C084FC', '#FFD700', '#22C55E', '#60A5FA'],
        });
      } else {
        playUpgradeFail();
      }
    } catch {
      setUpgradeState('failed');
      playUpgradeFail();
      setResult({ success: false, burned: nextLevelInfo.upgradeCost * 0.85, toJackpot: nextLevelInfo.upgradeCost * 0.15 });
    }
  };

  const handleUpgradeOffchain = () => {
    playClick();
    setUpgradeState('rolling');
    setTimeout(() => {
      const upgradeResult = onUpgrade(flower.id);
      setResult(upgradeResult);
      if (upgradeResult.success) {
        setUpgradeState('success');
        playUpgradeSuccess();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FF6B9D', '#C084FC', '#FFD700', '#22C55E'],
        });
      } else {
        setUpgradeState('failed');
        playUpgradeFail();
      }
    }, 1800);
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
            {/* Rolling dice animation */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-bloom-pink to-bloom-purple animate-spin" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-1 rounded-xl bg-card flex items-center justify-center">
                <span className="text-3xl font-display font-black text-foreground tabular-nums">
                  {rollNumber}%
                </span>
              </div>
            </div>
            <p className="text-lg font-display font-bold text-foreground">
              {isConnected ? '⏳ Confirming on-chain...' : '🎲 Rolling the dice...'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Need ≤ {nextLevelInfo.successRate}% to succeed
            </p>
            <div className="mt-4 flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-bloom-pink"
                  style={{ 
                    animation: 'pulse 1s ease-in-out infinite',
                    animationDelay: `${i * 0.15}s` 
                  }}
                />
              ))}
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-6">
            {/* Success celebration */}
            <div className="relative mb-4">
              <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden bg-gradient-to-b from-bloom-green/10 to-transparent p-1">
                <img src={getFlowerImage(nextLevel)} alt="Upgraded" className="w-full h-full object-contain animate-float" />
              </div>
              <div className="absolute -top-3 -right-3">
                <CheckCircle2 className="w-10 h-10 text-bloom-green drop-shadow-lg" />
              </div>
              {/* Floating sparkles */}
              <div className="absolute top-0 left-4 text-xl animate-ping" style={{ animationDuration: '2s' }}>✨</div>
              <div className="absolute bottom-2 right-4 text-lg animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }}>⭐</div>
            </div>

            <h3 className="text-2xl font-display font-black bg-gradient-to-r from-bloom-green to-emerald-400 bg-clip-text text-transparent mb-1">
              EVOLUTION SUCCESS!
            </h3>
            <p className="text-foreground font-semibold mb-1">
              {currentLevelInfo.name} → {nextLevelInfo.name}
            </p>
            <p className={cn('text-sm font-medium mb-4', RARITY_COLORS[nextLevelInfo.rarity])}>
              {nextLevelInfo.rarity} • Level {onchainResult?.newLevel ?? nextLevel}
            </p>

            {onchainResult && (
              <div className="p-3 rounded-xl bg-secondary/50 border border-border mb-4 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Tx status</span><span className="font-bold text-bloom-green">Confirmed success</span></div>
                <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">New flower level</span><span className="font-bold text-foreground">Level {onchainResult.newLevel}</span></div>
                <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Ticket delta</span><span className={cn('font-bold', onchainResult.ticketDelta > 0 ? 'text-bloom-purple' : 'text-bloom-gold')}>+{onchainResult.ticketDelta}</span></div>
                <a href={`https://basescan.org/tx/${onchainResult.hash}`} target="_blank" rel="noreferrer" className="block truncate text-[11px] text-bloom-purple">{onchainResult.hash}</a>
              </div>
            )}

            {/* New stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-bloom-green/10 border border-bloom-green/20">
                <p className="text-xs text-muted-foreground">New Earning Rate</p>
                <p className="text-lg font-bold text-bloom-gold flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  {formatBloom(nextLevelInfo.dailyYield)}/day
                </p>
              </div>
              <div className="p-3 rounded-xl bg-bloom-purple/10 border border-bloom-purple-light/20">
                <p className="text-xs text-muted-foreground">Tickets Earned</p>
                <p className="text-lg font-bold text-bloom-purple flex items-center justify-center gap-1">
                  <Ticket className="w-4 h-4" />
                  +{onchainResult?.ticketDelta ?? ticketsEarned}
                </p>
              </div>
            </div>

            {onchainResult?.ticketWarning && (
              <div className="p-3 rounded-xl bg-bloom-gold/10 border border-bloom-gold/20 mb-4 text-left">
                <p className="text-xs text-bloom-gold font-medium">Tickets not emitted by contract</p>
                <p className="text-[11px] text-muted-foreground mt-1">{onchainResult.ticketWarning}</p>
              </div>
            )}

            <div className="p-3 rounded-xl bg-secondary/50 mb-4">
              <p className="text-xs text-muted-foreground">
                🎉 Your bloom evolved! Daily earnings increased by <strong className="text-bloom-green">{formatBloom(nextLevelInfo.dailyYield - currentLevelInfo.dailyYield)}</strong> BLOOM
              </p>
            </div>

            <button onClick={onClose} className="w-full py-3.5 rounded-xl bloom-gradient-button text-white font-bold text-lg bloom-button-shadow active:scale-[0.98] transition-transform">
              🌸 Continue Blooming
            </button>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center py-6">
            {/* Failure display */}
            <div className="relative mb-4">
              <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden bg-gradient-to-b from-red-500/10 to-transparent p-1 opacity-60 grayscale">
                <img src={getFlowerImage(currentLevel)} alt="Current" className="w-full h-full object-contain" />
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <XCircle className="w-14 h-14 text-red-500/80 drop-shadow-lg" />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                <Flame className="w-8 h-8 text-red-500 animate-pulse" />
              </div>
            </div>

            <h3 className="text-2xl font-display font-black text-red-500 mb-1">
              EVOLUTION FAILED
            </h3>
            <p className="text-foreground font-medium mb-1">
              {currentLevelInfo.name} stays at Level {currentLevel}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              The upgrade didn't succeed this time — your bloom remains unchanged.
            </p>

            {onchainResult && (
              <div className="p-3 rounded-xl bg-secondary/50 border border-border mb-4 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Tx status</span><span className="font-bold text-bloom-gold">Confirmed failed roll</span></div>
                <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Flower level</span><span className="font-bold text-foreground">Level {onchainResult.newLevel}</span></div>
                <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Ticket delta</span><span className={cn('font-bold', onchainResult.ticketDelta > 0 ? 'text-bloom-purple' : 'text-bloom-gold')}>+{onchainResult.ticketDelta}</span></div>
                <a href={`https://basescan.org/tx/${onchainResult.hash}`} target="_blank" rel="noreferrer" className="block truncate text-[11px] text-bloom-purple">{onchainResult.hash}</a>
              </div>
            )}

            {result && (
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-red-500" />
                    BLOOM Burned
                  </span>
                  <span className="font-bold text-red-500">{formatBloom(result.burned)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-bloom-gold" />
                    To Jackpot Pool
                  </span>
                  <span className="font-bold text-bloom-gold">{formatBloom(result.toJackpot)}</span>
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-bloom-purple/5 border border-bloom-purple-light/20 mb-4">
              <p className="text-xs text-muted-foreground">
                🎫 Ticket delta from confirmed events: <strong className="text-bloom-purple">+{onchainResult?.ticketDelta ?? ticketsEarned}</strong>
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-medium active:scale-[0.98] transition-transform">
                Close
              </button>
              <button
                onClick={() => {
                  setUpgradeState('confirm');
                  setResult(null);
                }}
                className="flex-1 py-3 rounded-xl bloom-gradient-button text-white font-medium active:scale-[0.98] transition-transform"
              >
                Try Again
              </button>
            </div>
          </div>
        );

      default:
        return (
          <>
            {/* Evolution preview */}
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="text-center flex-1">
                <div className="w-20 h-20 mx-auto rounded-xl overflow-hidden bg-gradient-to-b from-transparent to-bloom-pink/5 p-1 mb-1.5">
                  <img src={getFlowerImage(currentLevel)} alt={currentLevelInfo.name} className="w-full h-full object-contain" />
                </div>
                <p className="text-xs font-bold text-foreground">{currentLevelInfo.name}</p>
                <p className={cn('text-[10px] font-medium', RARITY_COLORS[currentLevelInfo.rarity])}>{currentLevelInfo.rarity}</p>
                <p className="text-[10px] text-bloom-gold mt-0.5">{formatBloom(currentLevelInfo.dailyYield)}/day</p>
              </div>
              
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-bloom-pink/10 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-bloom-pink" />
              </div>
              
              <div className="text-center flex-1">
                <div className="w-20 h-20 mx-auto rounded-xl overflow-hidden bg-gradient-to-b from-transparent to-bloom-purple/5 p-1 mb-1.5 bloom-glow-pink">
                  <img src={getFlowerImage(nextLevel)} alt={nextLevelInfo.name} className="w-full h-full object-contain" />
                </div>
                <p className="text-xs font-bold text-foreground">{nextLevelInfo.name}</p>
                <p className={cn('text-[10px] font-medium', RARITY_COLORS[nextLevelInfo.rarity])}>{nextLevelInfo.rarity}</p>
                <p className="text-[10px] text-bloom-gold mt-0.5">{formatBloom(nextLevelInfo.dailyYield)}/day</p>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 rounded-xl bg-secondary/50 mb-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Upgrade Cost</span>
                <span className="font-bold text-foreground">{formatBloom(nextLevelInfo.upgradeCost)} BLOOM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div 
                      className={cn(
                        'h-full rounded-full transition-all',
                        nextLevelInfo.successRate >= 60 ? 'bg-bloom-green' : 
                        nextLevelInfo.successRate >= 30 ? 'bg-bloom-gold' : 'bg-red-500'
                      )}
                      style={{ width: `${nextLevelInfo.successRate}%` }}
                    />
                  </div>
                  <span className={cn(
                    'font-bold text-sm',
                    nextLevelInfo.successRate >= 60 ? 'text-bloom-green' : 
                    nextLevelInfo.successRate >= 30 ? 'text-bloom-gold' : 'text-red-500'
                  )}>
                    {nextLevelInfo.successRate}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Your Balance</span>
                <span className={cn('font-bold text-sm', canAfford ? 'text-foreground' : 'text-red-500')}>
                  {formatBloom(balance)} BLOOM
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tickets Earned</span>
                <span className="font-bold text-sm text-bloom-purple">+{ticketsEarned} 🎫</span>
              </div>
            </div>

            {/* Warning */}
            <div className="p-3 rounded-xl bg-bloom-gold/10 border border-bloom-gold/20 mb-4">
              <p className="text-xs text-muted-foreground">
                ⚠️ If evolution fails: <strong className="text-red-500">85% burned</strong>, <strong className="text-bloom-gold">15% to jackpot</strong>
              </p>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={!canAfford || isOnchainPending}
              className={cn(
                'w-full py-4 rounded-xl font-display font-bold text-lg transition-all',
                canAfford
                  ? 'bloom-gradient-button text-white bloom-button-shadow hover:opacity-90 active:scale-[0.98] bloom-glow-pink'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {isOnchainPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : canAfford ? (
                `Evolve to ${nextLevelInfo.name}`
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={upgradeState === 'rolling' ? undefined : onClose} />
      <div className="relative w-full max-w-sm bg-card rounded-2xl p-6 animate-scale-in border border-bloom-pink-light/10">
        {upgradeState === 'confirm' && (
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
        {upgradeState === 'confirm' && (
          <h2 className="text-lg font-display font-bold text-foreground mb-4 text-center">
            🌸 Evolve Your Bloom
          </h2>
        )}
        {renderContent()}
      </div>
    </div>
  );
}
