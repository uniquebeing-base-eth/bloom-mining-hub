import { X, Users, Copy, Share2, Gift, Check, Ticket } from 'lucide-react';
import { useBloomStore } from '@/store/bloomStore';
import { useState } from 'react';
import { toast } from 'sonner';
import { sdk } from '@farcaster/miniapp-sdk';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const { inviteCode, invitesUsed, farcasterFid } = useBloomStore();
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;

  // User's invite code is FC-{FID}
  const userInviteCode = farcasterFid 
    ? `FC-${farcasterFid}`
    : inviteCode ? `FC-${inviteCode}` : '';
  const inviteLink = `https://bloom-mining.vercel.app/invite/${userInviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Invite link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    // Try to use Farcaster's cast composer first
    try {
      await sdk.actions.composeCast({
        text: `Join me on Bloom Protocol! 🌸\n\nMine BLOOM tokens, boost casts, and win weekly jackpots!\n\nUse my invite code: ${userInviteCode}`,
        embeds: [inviteLink],
      });
    } catch {
      // Fallback to native share or copy
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Join Bloom Protocol',
            text: 'Start mining BLOOM with my invite code!',
            url: inviteLink,
          });
        } catch {
          // User cancelled or error
        }
      } else {
        handleCopy();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-t-3xl p-6 pb-10 animate-bloom">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-bloom-purple" />
            <h2 className="text-xl font-display font-bold text-foreground">Invite Friends</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bloom-card rounded-xl p-4 border border-bloom-purple-light/20 text-center">
            <p className="text-2xl font-bold text-bloom-purple">{invitesUsed}</p>
            <p className="text-sm text-muted-foreground">Friends Invited</p>
          </div>
          <div className="bloom-card rounded-xl p-4 border border-bloom-gold/20 text-center">
            <p className="text-2xl font-bold text-bloom-gold">{invitesUsed}</p>
            <p className="text-sm text-muted-foreground">Tickets Earned</p>
          </div>
        </div>

        {/* Your Invite Code */}
        <div className="bloom-card rounded-2xl p-4 mb-4 border border-border">
          <p className="text-sm text-muted-foreground mb-2">Your Invite Code</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 rounded-xl bg-secondary font-mono text-lg font-bold text-foreground">
              {userInviteCode}
            </div>
            <button
              onClick={handleCopy}
              className="p-3 rounded-xl bg-bloom-purple text-white hover:opacity-90 transition-all active:scale-95"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Invite Link */}
        <div className="bloom-card rounded-2xl p-4 mb-6 border border-border">
          <p className="text-sm text-muted-foreground mb-2">Invite Link</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 rounded-xl bg-secondary text-sm text-muted-foreground truncate">
              {inviteLink}
            </div>
            <button
              onClick={handleShare}
              className="p-3 rounded-xl bg-bloom-pink text-white hover:opacity-90 transition-all active:scale-95"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* How it works */}
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
                <p className="text-sm font-medium text-foreground">Share Your Code</p>
                <p className="text-xs text-muted-foreground">Send your invite code or link to friends</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-bloom-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-bloom-purple">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">They Start Mining</p>
                <p className="text-xs text-muted-foreground">New users need an invite code to join</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-bloom-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Ticket className="w-3 h-3 text-bloom-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Earn Jackpot Tickets</p>
                <p className="text-xs text-muted-foreground">Get 1 jackpot ticket per invite</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Unlimited Invites Notice */}
        <div className="p-4 rounded-xl bg-secondary/50 text-center">
          <p className="text-sm text-muted-foreground">
            ✨ <span className="font-medium text-foreground">No limits!</span> Invite as many friends as you want.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Invites never expire.
          </p>
        </div>
      </div>
    </div>
  );
}
