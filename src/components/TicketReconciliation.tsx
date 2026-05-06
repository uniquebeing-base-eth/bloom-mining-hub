import { AlertTriangle, Check, Ticket, Users, TrendingUp, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UPGRADE_TICKETS } from '@/types/bloom';
import { BloomFlower } from '@/types/bloom';

interface TicketReconciliationProps {
  onchainTickets: number;
  holdingTickets: number;
  walletBalance: number;
  invitesUsed: number;
  eventUpgradeTickets?: number;
  flowers: BloomFlower[];
}

function formatNum(n: number): string {
  return Math.floor(n).toLocaleString('en-US');
}

export function TicketReconciliation({
  onchainTickets,
  holdingTickets,
  walletBalance,
  invitesUsed,
  eventUpgradeTickets,
  flowers,
}: TicketReconciliationProps) {
  // Calculate expected tickets from upgrades
  const levelDerivedUpgradeTickets = flowers.reduce((total, f) => {
    if (!f.isUnlocked) return total;
    let tickets = 0;
    for (let lvl = 2; lvl <= f.level; lvl++) {
      tickets += UPGRADE_TICKETS[lvl] || 0;
    }
    return total + tickets;
  }, 0);
  const upgradeTickets = eventUpgradeTickets ?? levelDerivedUpgradeTickets;

  // Expected total tickets
  const inviteTickets = invitesUsed;
  const expectedTickets = upgradeTickets + inviteTickets;
  const displayTotal = onchainTickets + holdingTickets;
  const hasDivergence = Math.abs(onchainTickets - expectedTickets) > 0 && expectedTickets > 0;

  return (
    <div className="bloom-card rounded-2xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Ticket className="w-5 h-5 text-bloom-purple" />
        <h3 className="font-display font-semibold text-foreground text-sm">Ticket Breakdown</h3>
      </div>

      <div className="space-y-2.5 mb-3">
        {/* Upgrade tickets */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            From Upgrades
          </span>
          <span className="font-bold text-foreground">{formatNum(upgradeTickets)}</span>
        </div>

        {/* Invite tickets */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            From Invites
          </span>
          <span className="font-bold text-foreground">{formatNum(inviteTickets)}</span>
        </div>

        {/* Holding bonus */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" />
            Holding Bonus <span className="text-[10px]">(1/1M BLOOM)</span>
          </span>
          <span className="font-bold text-foreground">{formatNum(holdingTickets)}</span>
        </div>

        <div className="border-t border-border pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Total Tickets</span>
            <span className="font-bold text-bloom-purple text-lg">{formatNum(displayTotal)}</span>
          </div>
        </div>

        {/* On-chain vs expected */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">On-chain tickets</span>
          <span className="font-mono text-muted-foreground">{formatNum(onchainTickets)}</span>
        </div>
      </div>

      {/* Divergence alert */}
      {hasDivergence && (
        <div className="p-2.5 rounded-lg bg-bloom-gold/10 border border-bloom-gold/20 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-bloom-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-bloom-gold">Ticket Sync Pending</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Expected {formatNum(expectedTickets)} from events, on-chain shows {formatNum(onchainTickets)}.
              The current Flowers contract does not auto-mint Jackpot tickets — an admin call or contract upgrade is needed to sync.
            </p>
          </div>
        </div>
      )}

      {!hasDivergence && onchainTickets > 0 && (
        <div className="p-2 rounded-lg bg-bloom-green/10 border border-bloom-green/20 flex items-center gap-2">
          <Check className="w-4 h-4 text-bloom-green flex-shrink-0" />
          <p className="text-xs text-bloom-green font-medium">Tickets synced with on-chain ✓</p>
        </div>
      )}

      {!hasDivergence && onchainTickets === 0 && expectedTickets === 0 && (
        <div className="p-2 rounded-lg bg-secondary/50 border border-border flex items-center gap-2">
          <Ticket className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground">Upgrade flowers or invite friends to earn tickets</p>
        </div>
      )}
    </div>
  );
}
