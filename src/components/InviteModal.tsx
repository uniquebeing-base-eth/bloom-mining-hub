import { X, Users, Copy, Share2, Gift, Check, Ticket } from 'lucide-react';
import { useBloomStore } from '@/store/bloomStore';
import { useState } from 'react';
import { toast } from 'sonner';
import { sdk } from '@farcaster/miniapp-sdk';
import { playClick } from '@/lib/bloom-utils';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onchainInviteCode?: `0x${string}`;
  onchainInviteCount?: number;
}

/**
 * Format bytes32 for display only — show first 10 hex chars.
 * The FULL bytes32 must be shared for onboarding to work.
 */
function formatCodeForDisplay(code: `0x${string}`): string {
  if (!code || code === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return '';
  }
  return code.slice(0, 14).toUpperCase() + '…';
}

export function InviteModal({ isOpen, onClose, onchainInviteCode, onchainInviteCount }: InviteModalProps) {
  const { invitesUsed } = useBloomStore();
  const displayInvites = onchainInviteCount ?? invitesUsed;
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const hasCode = !!onchainInviteCode &&
    onchainInviteCode !== '0x0000000000000000000000000000000000000000000000000000000000000000';
  
  // The full bytes32 is what users need to share
  const fullCode = hasCode ? onchainInviteCode! : '';
  const displayCode = hasCode ? formatCodeForDisplay(onchainInviteCode!) : 'Onboard to get code';

  const handleCopyCode = async () => {
    if (!hasCode) return;
    playClick();
    try {
      // Copy the FULL bytes32 code — this is what the recipient enters
      await navigator.clipboard.writeText(fullCode);
      setCopied(true);
      toast.success('Invite code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    if (!hasCode) return;
    playClick();
    try {
      await sdk.actions.composeCast({
        text: `Join me on Bloom Protocol! 🌸\n\nMine BLOOM tokens, evolve blooms, and win weekly jackpots!\n\nUse my invite code: ${fullCode}`,
        embeds: ['https://bloom-mining.vercel.app'],
      });
    } catch {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Join Bloom Protocol',
            text: `Start mining BLOOM with my invite code: ${fullCode}`,
            url: 'https://bloom-mining.vercel.app',
          });
        } catch {
          handleCopyCode();
        }
      } else {
        handleCopyCode();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-t-3xl p-6 pb-10 animate-bloom">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-bloom-purple" />
            <h2 className="text-xl font-display font-bold text-foreground">Invite Friends</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bloom-card rounded-xl p-4 border border-bloom-purple-light/20 text-center">
            <p className="text-2xl font-bold text-bloom-purple">{displayInvites}</p>
            <p className="text-sm text-muted-foreground">Friends Invited</p>
          </div>
          <div className="bloom-card rounded-xl p-4 border border-bloom-gold/20 text-center">
            <p className="text-2xl font-bold text-bloom-gold">{displayInvites}</p>
            <p className="text-sm text-muted-foreground">Tickets Earned</p>
          </div>
        </div>

        <div className="bloom-card rounded-2xl p-4 mb-4 border border-border">
          <p className="text-sm text-muted-foreground mb-2">Your Unique Invite Code</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-3 rounded-xl bg-secondary font-mono text-sm font-bold text-foreground truncate">
              {displayCode}
            </div>
            <button
              onClick={handleCopyCode}
              disabled={!hasCode}
              className="p-3 rounded-xl bg-bloom-purple text-white hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          {!hasCode && (
            <p className="text-xs text-bloom-gold mt-2">
              ⚠️ Complete on-chain onboarding to get your unique invite code
            </p>
          )}
          {hasCode && (
            <p className="text-xs text-muted-foreground mt-2">
              📋 Your friend must paste the full code when onboarding
            </p>
          )}
        </div>

        {hasCode && (
          <button
            onClick={handleShare}
            className="w-full mb-6 py-3.5 rounded-xl bloom-gradient-button text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform bloom-button-shadow"
          >
            <Share2 className="w-5 h-5" />
            Share on Farcaster
          </button>
        )}

        <div className="bloom-card rounded-2xl p-4 mb-4 border border-bloom-green/20 bg-bloom-green/5">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-bloom-green" />
            <span className="font-semibold text-foreground">How Invites Work</span>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-bloom-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-bloom-purple">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Copy & Share Code</p>
                <p className="text-xs text-muted-foreground">Your code is unique and on-chain — share the full code</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-bloom-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-bloom-purple">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">They Paste to Onboard</p>
                <p className="text-xs text-muted-foreground">New users paste the code to join the protocol</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-bloom-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Ticket className="w-3 h-3 text-bloom-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Earn Jackpot Tickets</p>
                <p className="text-xs text-muted-foreground">Get 1 jackpot ticket per successful invite</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
