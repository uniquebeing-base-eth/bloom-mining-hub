import { X, Ticket, Calendar, Trophy, Gift, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JACKPOT_TIERS } from '@/types/bloom';
import { useState } from 'react';

interface JackpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  jackpotPool: number;
  userTickets?: number;
  walletBalance?: number;
}

function formatFullNumber(n: number): string {
  return Math.floor(n).toLocaleString('en-US');
}

export function JackpotModal({ isOpen, onClose, jackpotPool, userTickets = 0, walletBalance = 0 }: JackpotModalProps) {
  if (!isOpen) return null;

  const holdingTickets = Math.floor(walletBalance / 1_000_000);
  const upgradeTickets = Math.max(0, userTickets - holdingTickets);

  const nextThursday = getNextThursday();
  const nextFriday = getNextFriday();

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
            <span className="text-2xl font-bold text-bloom-gold">{formatFullNumber(jackpotPool)} BLOOM</span>
          </div>
        </div>

        {/* Your Tickets */}
        <div className="bloom-card rounded-2xl p-4 mb-4 border border-bloom-purple-light/20">
          <div className="flex items-center gap-2 mb-3">
            <Ticket className="w-5 h-5 text-bloom-purple" />
            <span className="font-semibold text-foreground">Your Tickets</span>
            <span className="ml-auto text-xl font-bold text-bloom-purple">{userTickets}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>From holdings ({formatFullNumber(walletBalance)})</span>
              <span>{holdingTickets}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>From upgrades/invites</span>
              <span>{upgradeTickets}</span>
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
