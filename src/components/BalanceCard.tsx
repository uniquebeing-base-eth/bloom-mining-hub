import { memo, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import bloomLogo from '@/assets/bloom-logo.png';

interface BalanceCardProps {
  balance: number;
  streamingClaimable: number;
  earningRate: number;
  boostMultiplier: number;
  onClaim: () => void;
  hasPendingClaim: boolean;
  wouldBeBurned?: number;
  isClaimPending?: boolean;
  isStreaming?: boolean;
  isReconnecting?: boolean;
  walletAddress?: string;
}

/** Format large numbers with commas, no abbreviation */
function formatFullNumber(n: number): string {
  return Math.floor(n).toLocaleString('en-US');
}

/** Format with decimals for streaming effect */
function formatStreamingNumber(n: number): { whole: string; decimal: string } {
  const whole = Math.floor(n).toLocaleString('en-US');
  const dec = (n % 1).toFixed(4).slice(2); // 4 decimal digits
  return { whole, decimal: dec };
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export const BalanceCard = memo(function BalanceCard({
  balance,
  streamingClaimable,
  earningRate,
  boostMultiplier,
  onClaim,
  hasPendingClaim,
  wouldBeBurned = 0,
  isClaimPending = false,
  isStreaming = false,
  isReconnecting = false,
  walletAddress,
}: BalanceCardProps) {
  const [flashGreen, setFlashGreen] = useState(false);
  const prevClaimable = useRef(streamingClaimable);

  // Flash green on increment
  useEffect(() => {
    if (streamingClaimable > prevClaimable.current + 0.01) {
      setFlashGreen(true);
      const t = setTimeout(() => setFlashGreen(false), 300);
      prevClaimable.current = streamingClaimable;
      return () => clearTimeout(t);
    }
    prevClaimable.current = streamingClaimable;
  }, [streamingClaimable]);

  const claimParts = formatStreamingNumber(streamingClaimable);
  const balanceDisplay = formatFullNumber(balance);

  return (
    <div className="bloom-card rounded-2xl p-5 border border-bloom-pink-light/20 relative overflow-hidden">
      {/* Reconnecting overlay */}
      {isReconnecting && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-bloom-gold animate-pulse" />
            <span className="text-sm font-medium">Reconnecting…</span>
          </div>
        </div>
      )}

      {/* Wallet address */}
      {walletAddress && (
        <div className="flex items-center justify-end mb-2">
          <span className="text-xs text-muted-foreground font-mono bg-secondary/60 px-2 py-0.5 rounded-md">
            {truncateAddress(walletAddress)}
          </span>
        </div>
      )}

      <p className="text-sm text-muted-foreground mb-1">Total Balance</p>

      {/* Main balance */}
      <div className="flex items-center gap-3 mb-4">
        <img src={bloomLogo} alt="BLOOM" className="w-10 h-10 rounded-full" />
        <div>
          <p className="text-[32px] leading-tight font-display font-bold text-foreground">
            {balanceDisplay}
          </p>
          <span className="text-sm text-muted-foreground">BLOOM</span>
        </div>
      </div>

      {/* Earning rate */}
      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-secondary/50">
        <div className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center transition-colors',
          isStreaming ? 'bg-bloom-green/20' : 'bg-muted'
        )}>
          <span className="text-xs">{isStreaming ? '⚡' : '▶'}</span>
        </div>
        <div className="flex-1">
          <span className="text-sm text-foreground">
            Earning Rate: <strong>{formatFullNumber(earningRate)}</strong> BLOOM/hr
          </span>
        </div>
        {isStreaming && (
          <div className="w-1.5 h-1.5 rounded-full bg-bloom-green animate-pulse" />
        )}
      </div>

      {/* Boost indicator */}
      {boostMultiplier > 1 && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-bloom-gold/10 border border-bloom-gold/20">
          <p className="text-sm text-bloom-gold font-medium">
            🚀 Boost Active: {boostMultiplier}x
          </p>
        </div>
      )}

      {/* Burn warning */}
      {wouldBeBurned > 0 && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive font-medium">
            ⚠️ {formatFullNumber(wouldBeBurned)} BLOOM will be burned (48h rule)
          </p>
        </div>
      )}

      {/* Claim button */}
      <button
        onClick={onClaim}
        disabled={!hasPendingClaim || isClaimPending || isReconnecting}
        className={cn(
          'w-full py-4 rounded-xl font-display font-bold text-lg transition-all relative overflow-hidden',
          hasPendingClaim && !isClaimPending && !isReconnecting
            ? 'bloom-gradient-button text-white bloom-button-shadow hover:opacity-90 active:scale-[0.98]'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        )}
      >
        {isClaimPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Claiming...
          </span>
        ) : hasPendingClaim ? (
          <span className={cn('transition-colors', flashGreen && 'text-bloom-green')}>
            Claim BLOOM ({claimParts.whole}
            <span className="text-base opacity-70">.{claimParts.decimal}</span>)
          </span>
        ) : (
          'Mining in progress…'
        )}
      </button>

      {/* Zero claim explanation */}
      {!hasPendingClaim && !isClaimPending && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Rewards accumulate as your flowers mine BLOOM
        </p>
      )}
    </div>
  );
});
