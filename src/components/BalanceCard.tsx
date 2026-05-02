import { cn } from '@/lib/utils';
import { formatBloom } from '@/lib/bloom-utils';
import bloomLogo from '@/assets/bloom-logo.png';

interface BalanceCardProps {
  balance: number;
  unclaimedBloom: number;
  miningRate: number;
  boostMultiplier: number;
  onClaim: () => void;
  hasPendingClaim: boolean;
  wouldBeBurned?: number;
  isClaimPending?: boolean;
}

export function BalanceCard({
  balance,
  unclaimedBloom,
  miningRate,
  boostMultiplier,
  onClaim,
  hasPendingClaim,
  wouldBeBurned = 0,
  isClaimPending = false,
}: BalanceCardProps) {
  return (
    <div className="bloom-card rounded-2xl p-5 border border-bloom-pink-light/20">
      <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
      
      <div className="flex items-center gap-3 mb-4">
        <img 
          src={bloomLogo} 
          alt="BLOOM" 
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="text-2xl font-display font-bold text-foreground">
            {formatBloom(balance)} <span className="text-lg text-muted-foreground">BLOOM</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-secondary/50">
        <div className="w-6 h-6 rounded-full bg-bloom-green/20 flex items-center justify-center">
          <span className="text-xs">▶</span>
        </div>
        <div className="flex-1">
          <span className="text-sm text-foreground">
            Mining Rate: <strong>{formatBloom(miningRate)}</strong> BLOOM / hr
          </span>
        </div>
      </div>

      {boostMultiplier > 1 && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-bloom-gold/10 border border-bloom-gold/20">
          <p className="text-sm text-bloom-gold font-medium">
            🚀 Boost Active: {boostMultiplier}x <span className="text-xs opacity-70">(from Bloom Boost)</span>
          </p>
        </div>
      )}

      {wouldBeBurned > 0 && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive font-medium">
            ⚠️ {formatBloom(Math.floor(wouldBeBurned))} BLOOM will be burned (48h rule)
          </p>
        </div>
      )}

      <button
        onClick={onClaim}
        disabled={!hasPendingClaim || isClaimPending}
        className={cn(
          'w-full py-4 rounded-xl font-display font-bold text-lg transition-all',
          hasPendingClaim && !isClaimPending
            ? 'bloom-gradient-button text-white bloom-button-shadow hover:opacity-90 active:scale-[0.98]'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        )}
      >
        {isClaimPending ? (
          'Claiming...'
        ) : hasPendingClaim ? (
          <>Claim BLOOM ({formatBloom(Math.floor(unclaimedBloom))})</>
        ) : (
          'No BLOOM to Claim'
        )}
      </button>
    </div>
  );
}
