import { useState, useEffect } from 'react';
import { FeaturedAuction, AuctionBid } from '@/types/bloom';
import { useBloomStore } from '@/store/bloomStore';
import { BidModal } from '@/components/BidModal';
import { toast } from 'sonner';
import { sdk } from '@farcaster/miniapp-sdk';
import { 
  Eye, 
  Clock, 
  Users, 
  ExternalLink, 
  Trophy, 
  HelpCircle,
  DollarSign,
  Link2,
  ImageOff
} from 'lucide-react';
import { formatBloom, formatTimeRemaining } from '@/lib/bloom-utils';
import { cn } from '@/lib/utils';
// Current featured auction (winner of previous day)
const FEATURED_AUCTION: FeaturedAuction = {
  id: '1',
  username: 'naughty_nice',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=naughty',
  link: 'https://naughty-or-nice-wrapped.vercel.app',
  title: 'Naughty or Nice Wrapped',
  description: 'Find out if you were naughty or nice this year with this fun Farcaster mini-app!',
  image: 'https://naughty-or-nice-wrapped.vercel.app/og-image.png',
  visits: 12_847,
  endsAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
  claimableBloom: 150_000,
};

// Current live bids for auction #2
const LIVE_BIDS: AuctionBid[] = [
  { id: '1', username: 'cryptobuilder', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=builder', bidAmount: 57, supportCount: 12, isLeader: true },
  { id: '2', username: 'nft_artist', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=artist', bidAmount: 43, supportCount: 5, isLeader: false },
  { id: '3', username: 'web3_dev', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev', bidAmount: 35, supportCount: 3, isLeader: false },
  { id: '4', username: 'alpha_hunter', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alpha', bidAmount: 25, supportCount: 0, isLeader: false },
];

// Past winners history
const PAST_WINNERS = [
  { id: '1', username: 'defi_whale', link: 'warpcast.com/defi_whale', winAmount: 52, date: 'Today' },
];

export function BloomSee() {
  const { balance } = useBloomStore();
  const [bids, setBids] = useState<AuctionBid[]>(LIVE_BIDS);
  const [hasVisited, setHasVisited] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidModalType, setBidModalType] = useState<'bid' | 'support'>('bid');
  const [selectedBidder, setSelectedBidder] = useState<string>('');
  const [newBidUrl, setNewBidUrl] = useState('');
  const [userExistingBid, setUserExistingBid] = useState<AuctionBid | null>(null);

  const canSupport = balance >= 10_000_000;
  const currentAuctionNumber = 2; // Next auction number
  const [imageError, setImageError] = useState(false);

  const handleVisit = async () => {
    // Store visited state before redirect
    localStorage.setItem('bloom_visited_' + FEATURED_AUCTION.id, 'true');
    
    try {
      // Use Farcaster SDK to open URL externally (outside the mini-app)
      await sdk.actions.openUrl(FEATURED_AUCTION.link);
      setHasVisited(true);
    } catch (error) {
      // Fallback for non-Farcaster environments
      console.log('SDK openUrl failed, using fallback:', error);
      window.open(FEATURED_AUCTION.link, '_blank');
      setHasVisited(true);
    }
  };

  // Check if user has visited on component mount
  useEffect(() => {
    const visited = localStorage.getItem('bloom_visited_' + FEATURED_AUCTION.id);
    if (visited === 'true') {
      setHasVisited(true);
    }
  }, []);

  const handleClaim = () => {
    toast.success('BLOOM claimed! 🎉', {
      description: `+${FEATURED_AUCTION.claimableBloom.toLocaleString()} BLOOM added to your balance.`,
    });
    setHasVisited(false);
  };

  const handleOpenBidModal = (type: 'bid' | 'support', bidderName?: string) => {
    setBidModalType(type);
    setSelectedBidder(bidderName || '');
    // Check if user has existing bid
    const existingBid = bids.find(b => b.username === 'you');
    setUserExistingBid(existingBid || null);
    setShowBidModal(true);
  };

  const handleBidSubmit = (amount: number) => {
    if (bidModalType === 'bid') {
      // Check if user already has a bid (top up)
      const existingBid = bids.find(b => b.username === 'you');
      
      if (existingBid) {
        // Top up existing bid
        const updatedBids = bids.map(bid => {
          if (bid.username === 'you') {
            return { ...bid, bidAmount: bid.bidAmount + amount };
          }
          return bid;
        }).sort((a, b) => (b.bidAmount + b.supportCount) - (a.bidAmount + a.supportCount));
        
        updatedBids.forEach((bid, index) => {
          bid.isLeader = index === 0;
        });
        setBids(updatedBids);
        toast.success('Bid topped up! 🎉', {
          description: `+$${amount} USDC added to your bid.`,
        });
      } else {
        // New bid
        if (!newBidUrl) {
          toast.error('Please enter a link first');
          return;
        }
        const newBid: AuctionBid = {
          id: Date.now().toString(),
          username: 'you',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=you',
          bidAmount: amount,
          supportCount: 0,
          isLeader: false,
        };
        const updatedBids = [...bids, newBid].sort((a, b) => (b.bidAmount + b.supportCount) - (a.bidAmount + a.supportCount));
        updatedBids.forEach((bid, index) => {
          bid.isLeader = index === 0;
        });
        setBids(updatedBids);
        setNewBidUrl('');
        toast.success('Bid placed! 🎉', {
          description: `Your $${amount} bid has been submitted.`,
        });
      }
    } else {
      // Support existing bid
      setBids(bids.map(bid => {
        if (bid.username === selectedBidder) {
          return { ...bid, supportCount: bid.supportCount + amount };
        }
        return bid;
      }).sort((a, b) => (b.bidAmount + b.supportCount) - (a.bidAmount + a.supportCount)));
      toast.success(`Supported @${selectedBidder}!`, {
        description: `+$${amount} USDC added to their bid.`,
      });
    }
  };

  return (
    <div className="min-h-screen bloom-gradient-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-center gap-2 py-4 px-4">
          <Eye className="w-5 h-5 text-bloom-purple" />
          <h1 className="text-lg font-display font-bold text-foreground">Bloom & See</h1>
          <button
            onClick={() => setShowHowItWorks(true)}
            className="p-1 rounded-full hover:bg-secondary transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Featured Cast - Winner of Auction #1 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-bloom-gold" />
              <h2 className="font-display font-semibold text-foreground">Featured Cast</h2>
            </div>
            <span className="text-sm text-bloom-gold font-medium">Auction #1 Winner</span>
          </div>

          <div className="bloom-card rounded-2xl overflow-hidden border border-bloom-gold/30">
            <div className="relative h-40 bg-gradient-to-br from-bloom-purple/20 to-bloom-pink/20">
              {!imageError ? (
                <img
                  src={FEATURED_AUCTION.image}
                  alt={FEATURED_AUCTION.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <ImageOff className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{FEATURED_AUCTION.title}</span>
                </div>
              )}
              <button
                onClick={handleVisit}
                className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-white" />
              </button>
              <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-bloom-gold text-black text-xs font-bold">
                FEATURED
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={FEATURED_AUCTION.avatar}
                  alt={FEATURED_AUCTION.username}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">@{FEATURED_AUCTION.username}</p>
                  <p className="text-sm text-muted-foreground truncate">{FEATURED_AUCTION.link}</p>
                </div>
              </div>

              <p className="text-sm text-foreground mb-3">{FEATURED_AUCTION.description}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{FEATURED_AUCTION.visits.toLocaleString()} visits</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimeRemaining(FEATURED_AUCTION.endsAt)} left</span>
                </div>
              </div>

              {/* Visit & Claim */}
              <div className="flex gap-2">
                <button
                  onClick={handleVisit}
                  className="flex-1 py-3 rounded-xl bg-bloom-purple text-white font-medium hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  Visit & Earn BLOOM
                </button>
                {hasVisited && (
                  <button
                    onClick={handleClaim}
                    className="py-3 px-4 rounded-xl bg-bloom-green text-white font-medium hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                    Claim
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Live Auction #2 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-foreground">
              Auction #{currentAuctionNumber} - Live Bids
            </h2>
            <div className="flex items-center gap-1 text-sm text-bloom-pink">
              <Clock className="w-4 h-4" />
              <span>23h 45m</span>
            </div>
          </div>

          <div className="bloom-card rounded-2xl p-4 border border-border">
            {/* Place New Bid Section */}
            <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-bloom-purple/10 to-bloom-pink/10 border border-bloom-purple/20">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-bloom-green" />
                <h3 className="font-semibold text-foreground">Place Your Bid</h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                Minimum bid: <span className="text-bloom-green font-bold">$10 USDC</span>. Top up anytime before auction ends.
              </p>
              
              <div className="space-y-3">
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={newBidUrl}
                    onChange={(e) => setNewBidUrl(e.target.value)}
                    placeholder="Paste your Warpcast or Farcaster link..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-bloom-purple/30"
                  />
                </div>
                
                <button
                  onClick={() => handleOpenBidModal('bid')}
                  disabled={!newBidUrl && !bids.find(b => b.username === 'you')}
                  className={cn(
                    'w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                    (!newBidUrl && !bids.find(b => b.username === 'you'))
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-bloom-pink text-white hover:opacity-90 active:scale-[0.98]'
                  )}
                >
                  <DollarSign className="w-4 h-4" />
                  {bids.find(b => b.username === 'you') ? 'Top Up My Bid' : 'Place Bid (Min $10)'}
                </button>
              </div>
            </div>

            {/* Bid Leaderboard */}
            <div className="space-y-2">
              {bids.map((bid, index) => (
                <div
                  key={bid.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl transition-all',
                    bid.isLeader ? 'bg-bloom-gold/10 border border-bloom-gold/30' : 'bg-secondary/50'
                  )}
                >
                  <span className="w-6 text-center font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  <img
                    src={bid.avatar}
                    alt={bid.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">@{bid.username}</p>
                    {bid.supportCount > 0 && (
                      <p className="text-xs text-muted-foreground">+${bid.supportCount} support</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">${bid.bidAmount + bid.supportCount}</span>
                    {bid.username === 'you' ? (
                      <button
                        onClick={() => handleOpenBidModal('bid')}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-bloom-green/20 text-bloom-green hover:bg-bloom-green/30 transition-all"
                      >
                        + Top Up
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenBidModal('support', bid.username)}
                        disabled={!canSupport}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                          canSupport
                            ? 'bg-bloom-purple/20 text-bloom-purple border-bloom-purple/30 hover:bg-bloom-purple/30 hover:border-bloom-purple/50'
                            : 'bg-muted/50 text-muted-foreground border-transparent cursor-not-allowed'
                        )}
                      >
                        + Support
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {!canSupport && (
              <div className="mt-4 p-3 rounded-xl bg-bloom-purple/5 border border-bloom-purple/20">
                <p className="text-xs text-muted-foreground text-center">
                  💎 Hold <span className="text-bloom-purple font-semibold">≥10M BLOOM</span> to support bidders with $1+ USDC
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Past Winners */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-bloom-gold" />
            <h2 className="font-display font-semibold text-foreground">Winner History</h2>
          </div>
          
          <div className="bloom-card rounded-2xl p-4 border border-border">
            {PAST_WINNERS.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No winners yet. Be the first!
              </p>
            ) : (
              <div className="space-y-2">
                {PAST_WINNERS.map((winner) => (
                  <div key={winner.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-bloom-gold">#{winner.id}</span>
                      <span className="text-sm text-foreground">@{winner.username}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <a 
                        href={`https://${winner.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-bloom-purple hover:underline truncate max-w-[100px]"
                      >
                        {winner.link}
                      </a>
                      <span className="text-sm font-bold text-bloom-green">${winner.winAmount}</span>
                      <span className="text-xs text-muted-foreground">{winner.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Bid Modal */}
      <BidModal
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
        type={bidModalType}
        bidderName={selectedBidder}
        balance={balance}
        onSubmit={handleBidSubmit}
        existingBidAmount={userExistingBid?.bidAmount}
      />

      {/* How It Works Modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHowItWorks(false)} />
          <div className="relative w-full max-w-md bg-card rounded-t-3xl p-6 pb-10 animate-bloom">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold text-foreground">How Bloom & See Works</h2>
              <button onClick={() => setShowHowItWorks(false)} className="text-muted-foreground">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-bloom-purple/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-bloom-purple">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Daily USDC Auction</p>
                  <p className="text-sm text-muted-foreground">Projects bid USDC to feature their link. Auctions are numbered sequentially (#1, #2, #3...).</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-bloom-pink/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-bloom-pink">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Highest Bid Wins</p>
                  <p className="text-sm text-muted-foreground">After 24 hours, the top bid wins. Their link becomes featured. All other bids are refunded.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-bloom-green/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-bloom-green">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Earn BLOOM</p>
                  <p className="text-sm text-muted-foreground">Visit the featured link, return, and claim your BLOOM reward.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-bloom-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-bloom-gold">4</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Support Bids</p>
                  <p className="text-sm text-muted-foreground">Hold ≥10M BLOOM to add USDC to any bidder's total.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
