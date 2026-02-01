import { FeaturedAuction, AuctionBid } from '@/types/bloom';
import { formatBloom, formatTimeRemaining } from '@/lib/bloom-utils';
import { Eye, Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturedCardProps {
  auction: FeaturedAuction;
  onVisit: () => void;
  onClaim: () => void;
  canClaim: boolean;
}

export function FeaturedCard({ auction, onVisit, onClaim, canClaim }: FeaturedCardProps) {
  return (
    <div className="bloom-card rounded-2xl p-4 border border-bloom-pink-light/20">
      <p className="text-sm text-muted-foreground mb-3">Featured Today</p>

      {/* Creator Info */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={auction.avatar || '/placeholder.svg'}
          alt={auction.username}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <p className="font-medium text-foreground">{auction.username}</p>
            <span className="text-xs text-bloom-green">✓</span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            🔗 {new URL(auction.link).hostname}
          </p>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          •••
        </button>
      </div>

      {/* Content */}
      <h3 className="font-display font-semibold text-foreground mb-2">{auction.title}</h3>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{auction.description}</p>

      {auction.image && (
        <div className="relative mb-3 rounded-xl overflow-hidden">
          <img
            src={auction.image}
            alt={auction.title}
            className="w-full h-40 object-cover"
          />
          <button
            onClick={onVisit}
            className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-bloom-purple text-white text-sm font-medium flex items-center gap-1"
          >
            Viewcast <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          <span>{auction.visits.toLocaleString()} visits</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{formatTimeRemaining(auction.endsAt)} remaining</span>
        </div>
      </div>

      {/* Claim Section */}
      {canClaim && (
        <div className="space-y-2">
          <p className="text-center text-lg font-display font-bold text-bloom-gold">
            Claim {formatBloom(auction.claimableBloom)} BLOOM
          </p>
          <button
            onClick={onClaim}
            className="w-full py-3 rounded-xl bloom-gradient-button text-white font-medium bloom-button-shadow hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Claim Bloom Boost
          </button>
        </div>
      )}
    </div>
  );
}

interface BidLeaderboardProps {
  bids: AuctionBid[];
  userBalance: number;
  onSupport: (bidId: string) => void;
  onPlaceBid: () => void;
}

export function BidLeaderboard({ bids, userBalance, onSupport, onPlaceBid }: BidLeaderboardProps) {
  const canSupport = userBalance >= 10_000_000;
  
  return (
    <div className="bloom-card rounded-2xl p-4 border border-border">
      <h3 className="font-display font-semibold text-foreground mb-4">LIVE AUCTION</h3>

      <div className="space-y-3 mb-4">
        {bids.map((bid, index) => (
          <div
            key={bid.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl transition-all',
              bid.isLeader ? 'bg-bloom-gold/10 border border-bloom-gold/30' : 'bg-secondary'
            )}
          >
            <span className="font-bold text-foreground w-6">{index + 1}.</span>
            <span className="flex-1 font-medium text-foreground">{bid.username}</span>
            <span className="text-sm text-muted-foreground">{bid.bidAmount} USDC</span>
            
            {bid.isLeader ? (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-bloom-gold/20 text-bloom-gold">
                Leader
              </span>
            ) : (
              <button
                onClick={() => onSupport(bid.id)}
                disabled={!canSupport}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                  canSupport
                    ? 'bg-bloom-purple/10 text-bloom-purple hover:bg-bloom-purple/20'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                + Support
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground mb-4">
        <Clock className="w-4 h-4 inline mr-1" />
        Ends in 03h 19m
      </div>

      <button
        onClick={onPlaceBid}
        className="w-full py-3 rounded-xl bg-bloom-purple text-white font-medium hover:bg-bloom-purple-dark active:scale-[0.98] transition-all"
      >
        Place Bid
      </button>
    </div>
  );
}
