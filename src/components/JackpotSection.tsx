import { formatBloom } from '@/lib/bloom-utils';
import { Ticket, Users, Gift } from 'lucide-react';

interface JackpotSectionProps {
  jackpotPool: number;
  userTickets: number;
  invitesUsed: number;
  invitesAvailable: number;
  onInvite: () => void;
}

export function JackpotSection({
  jackpotPool,
  userTickets,
  invitesUsed,
  invitesAvailable,
}: JackpotSectionProps) {
  return (
    <div className="space-y-4">
      {/* Jackpot Info */}
      <div className="bloom-card rounded-2xl p-4 border border-bloom-gold/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎰</span>
            <span className="font-display font-semibold text-foreground">Jackpot Pool</span>
          </div>
          <span className="text-lg font-bold text-bloom-gold">{formatBloom(jackpotPool)} BLOOM</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Ticket className="w-4 h-4" />
          <span>Your tickets: <strong className="text-foreground">{userTickets}</strong></span>
        </div>

        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            🗓 Snapshot: Thursday • Drawing: Friday
          </p>
        </div>
      </div>

      {/* Invites Section */}
      <div className="bloom-card rounded-2xl p-4 border border-bloom-purple-light/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-bloom-purple" />
            <span className="font-display font-semibold text-foreground">Invites</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Gift className="w-4 h-4" />
            <span>used – {invitesAvailable - invitesUsed} left</span>
          </div>
        </div>

        <button className="w-full py-3 rounded-xl bg-bloom-purple text-white font-medium transition-all hover:bg-bloom-purple-dark active:scale-[0.98]">
          Invite Friends
        </button>

        <p className="mt-3 text-xs text-muted-foreground">
          Invite required to start mining • Each invite = 1 jackpot ticket
        </p>
      </div>
    </div>
  );
}
