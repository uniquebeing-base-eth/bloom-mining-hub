import { X, Ticket, Calendar, Trophy, Gift, Clock, Check } from 'lucide-react';
import { formatBloom } from '@/lib/bloom-utils';
import { JACKPOT_TIERS, UPGRADE_TICKETS } from '@/types/bloom';
import { useBloomStore } from '@/store/bloomStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface JackpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  jackpotPool: number;
}

export function JackpotModal({ isOpen, onClose, jackpotPool }: JackpotModalProps) {
  const { jackpotTickets, claimStreak, balance, flowers } = useBloomStore();
  const [streakClaimed, setStreakClaimed] = useState(false);
  
  if (!isOpen) return null;

  // Calculate holding tickets (1 per 1M BLOOM)
  const holdingTickets = Math.floor(balance / 1_000_000);
  
  // Check if streak claim is ready (7 days)
  const canClaimStreak = claimStreak >= 7 && !streakClaimed;
  
  // Calculate next snapshot
  const now = new Date();
  const nextThursday = getNextThursday();
  const nextFriday = getNextFriday();
  
  const handleClaimStreak = () => {
    if (canClaimStreak) {
      setStreakClaimed(true);
      // In real app, this would call store method
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto animate-bloom">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎰</span>
            <h2 className="text-xl font-display font-bold text-foreground">Weekly Jackpot</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Jackpot Pool */}
        <div className="bloom-card rounded-2xl p-4 mb-4 border border-bloom-gold/30 bg-gradient-to-br from-bloom-gold/10 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Pool</span>
            <span className="text-2xl font-bold text-bloom-gold">{formatBloom(jackpotPool)} BLOOM</span>
          </div>
        </div>

        {/* Your Tickets */}
        <div className="bloom-card rounded-2xl p-4 mb-4 border border-bloom-purple-light/20">
          <div className="flex items-center gap-2 mb-3">
            <Ticket className="w-5 h-5 text-bloom-purple" />
            <span className="font-semibold text-foreground">Your Tickets</span>
            <span className="ml-auto text-xl font-bold text-bloom-purple">{jackpotTickets}</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>From invites</span>
              <span>-</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>From holdings ({formatBloom(balance)})</span>
              <span>{holdingTickets}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>From upgrades</span>
              <span>{jackpotTickets - holdingTickets}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bloom-card rounded-2xl p-4 mb-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-bloom-pink" />
            <span className="font-semibold text-foreground">Timeline</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-bloom-purple/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-bloom-purple" />
              </div>
              <div>
                <p className="font-medium text-foreground">Snapshot</p>
                <p className="text-sm text-muted-foreground">Thursday {formatDate(nextThursday)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-bloom-gold/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-bloom-gold" />
              </div>
              <div>
                <p className="font-medium text-foreground">Drawing</p>
                <p className="text-sm text-muted-foreground">Friday {formatDate(nextFriday)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Claim Streak Ticket */}
        <div className="bloom-card rounded-2xl p-4 mb-4 border border-bloom-green/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-bloom-green" />
              <span className="font-semibold text-foreground">7-Day Streak Bonus</span>
            </div>
            <span className="text-sm text-muted-foreground">{claimStreak}/7 days</span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-secondary mb-3">
            <div 
              className="h-full rounded-full bg-bloom-green transition-all"
              style={{ width: `${Math.min((claimStreak / 7) * 100, 100)}%` }}
            />
          </div>
          
          <button
            onClick={handleClaimStreak}
            disabled={!canClaimStreak}
            className={cn(
              'w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
              canClaimStreak
                ? 'bg-bloom-green text-white hover:opacity-90 active:scale-[0.98]'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            )}
          >
            {streakClaimed ? (
              <>
                <Check className="w-4 h-4" />
                Claimed +2 Tickets
              </>
            ) : canClaimStreak ? (
              'Claim +2 Tickets'
            ) : (
              `${7 - claimStreak} more days to claim`
            )}
          </button>
        </div>

        {/* Prize Tiers */}
        <div className="bloom-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-bloom-gold" />
            <span className="font-semibold text-foreground">Prize Tiers (40 Winners)</span>
          </div>
          
          <div className="space-y-2">
            {JACKPOT_TIERS.map((tier) => (
              <div key={tier.tier} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    tier.tier === 1 ? 'bg-bloom-gold text-black' :
                    tier.tier === 2 ? 'bg-gray-300 text-black' :
                    tier.tier === 3 ? 'bg-amber-600 text-white' :
                    'bg-secondary text-foreground'
                  )}>
                    {tier.tier}
                  </span>
                  <span className="text-muted-foreground">{tier.winners} winner{tier.winners > 1 ? 's' : ''}</span>
                </div>
                <span className="font-medium text-foreground">{tier.poolPercentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-4 p-4 rounded-xl bg-secondary/50">
          <p className="text-sm font-medium text-foreground mb-2">How to Earn Tickets</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 1 ticket per invite</li>
            <li>• 1 ticket per 1M BLOOM held</li>
            <li>• 20-50 tickets per upgrade attempt</li>
            <li>• 2 tickets for 7-day claim streak</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            ⚠️ Tickets reset weekly. Winners skip the next week.
          </p>
        </div>
      </div>
    </div>
  );
}

function getNextThursday(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
  const nextThursday = new Date(now);
  nextThursday.setDate(now.getDate() + daysUntilThursday);
  return nextThursday;
}

function getNextFriday(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + daysUntilFriday);
  return nextFriday;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
