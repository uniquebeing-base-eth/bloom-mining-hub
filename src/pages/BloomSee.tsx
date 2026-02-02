import { useState } from 'react';
import { FeaturedAuction, AuctionBid } from '@/types/bloom';
import { useBloomStore } from '@/store/bloomStore';
import { toast } from 'sonner';
import { 
  Eye, 
  Clock, 
  Users, 
  ExternalLink, 
  Trophy, 
  ChevronLeft, 
  ChevronRight,
  HelpCircle,
  DollarSign,
  Link2
} from 'lucide-react';
import { formatBloom, formatTimeRemaining } from '@/lib/bloom-utils';
import { cn } from '@/lib/utils';

// Demo data for current and previous auctions
const DEMO_AUCTIONS: FeaturedAuction[] = [
  {
    id: '333',
    username: 'NEYNARtodes',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neynar',
    link: 'https://farcaster.xyz/miniapps/uaKwcOvUry8F/neyn',
    title: 'NEYNARtodes App',
    description: 'The best Farcaster miniapp for trading and analytics.',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=300&fit=crop',
    visits: 5_477,
    endsAt: new Date(Date.now() + 5 * 60 * 60 * 1000 + 34 * 60 * 1000),
    claimableBloom: 250_000,
  },
  {
    id: '332',
    username: 'alicefarcaster',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    link: 'https://warpcast.com/alice',
    title: 'AI Research Tool Launch',
    description: 'Revolutionary AI tool for web3 data analysis.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=300&fit=crop',
    visits: 6_802,
    endsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    claimableBloom: 320_000,
  },
];

const DEMO_BIDS: AuctionBid[] = [
  { id: '1', username: 'NEYNARtodes', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neynar', bidAmount: 330, supportCount: 0, isLeader: true },
  { id: '2', username: 'YazhisaiSivanat', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yazh', bidAmount: 325, supportCount: 5, isLeader: false },
  { id: '3', username: 'yar0x', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yar', bidAmount: 320, supportCount: 10, isLeader: false },
  { id: '4', username: 'druxamb', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=drux', bidAmount: 310, supportCount: 20, isLeader: false },
  { id: '5', username: 'Emerge', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emerge', bidAmount: 300, supportCount: 15, isLeader: false },
];

const PAST_WINNERS = [
  { id: '332', username: 'alicefarcaster', link: 'warpcast.com/alice', winAmount: 325, date: '2024-01-14' },
  { id: '331', username: 'bob_trader', link: 'farcaster.xyz/bob', winAmount: 298, date: '2024-01-13' },
  { id: '330', username: 'cryptoqueen', link: 'warpcast.com/queen', winAmount: 410, date: '2024-01-12' },
  { id: '329', username: 'defi_dave', link: 'farcaster.xyz/dave', winAmount: 275, date: '2024-01-11' },
];

export function BloomSee() {
  const { balance } = useBloomStore();
  const [currentAuctionIndex, setCurrentAuctionIndex] = useState(0);
  const [bids] = useState<AuctionBid[]>(DEMO_BIDS);
  const [hasVisited, setHasVisited] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidUrl, setBidUrl] = useState('');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const currentAuction = DEMO_AUCTIONS[currentAuctionIndex];
  const auctionNumber = 333 - currentAuctionIndex;
  const canSupport = balance >= 10_000_000;

  const handleVisit = () => {
    setHasVisited(true);
    window.open(currentAuction.link, '_blank');
    toast.success('Visit recorded!', {
      description: 'Come back to claim your BLOOM reward.',
    });
  };

  const handleClaim = () => {
    toast.success('BLOOM claimed! 🎉', {
      description: `+${currentAuction.claimableBloom.toLocaleString()} BLOOM added to your balance.`,
    });
    setHasVisited(false);
  };

  const handleSupport = (bidId: string) => {
    const bid = bids.find((b) => b.id === bidId);
    if (bid) {
      toast.success(`Supported ${bid.username}!`, {
        description: '+1 USDC added to their bid.',
      });
    }
  };

  const handlePlaceBid = () => {
    if (!bidAmount || !bidUrl) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Bid placed! 🎉', {
      description: `Your $${bidAmount} bid has been submitted.`,
    });
    setBidAmount('');
    setBidUrl('');
  };

  const navigateAuction = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentAuctionIndex > 0) {
      setCurrentAuctionIndex(currentAuctionIndex - 1);
    } else if (direction === 'next' && currentAuctionIndex < DEMO_AUCTIONS.length - 1) {
      setCurrentAuctionIndex(currentAuctionIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bloom-gradient-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-center gap-2 py-4 px-4">
          <Eye className="w-5 h-5 text-bloom-purple" />
          <h1 className="text-lg font-display font-bold text-foreground">Bloom & See</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Auction Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateAuction('prev')}
            disabled={currentAuctionIndex === 0}
            className={cn(
              'p-2 rounded-full transition-all',
              currentAuctionIndex === 0 ? 'opacity-30' : 'hover:bg-secondary active:scale-95'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-display font-bold text-foreground">
              Auction #{auctionNumber}
            </h2>
            <button
              onClick={() => setShowHowItWorks(true)}
              className="p-1 rounded-full hover:bg-secondary transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          <button
            onClick={() => navigateAuction('next')}
            disabled={currentAuctionIndex === DEMO_AUCTIONS.length - 1}
            className={cn(
              'p-2 rounded-full transition-all',
              currentAuctionIndex === DEMO_AUCTIONS.length - 1 ? 'opacity-30' : 'hover:bg-secondary active:scale-95'
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Current Auction Card */}
        <div className="bloom-card rounded-2xl overflow-hidden border border-border">
          {currentAuction.image && (
            <div className="relative h-40">
              <img
                src={currentAuction.image}
                alt={currentAuction.title}
                className="w-full h-full object-cover"
              />
              <a
                href={currentAuction.link}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-white" />
              </a>
            </div>
          )}
          
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={currentAuction.avatar}
                alt={currentAuction.username}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <p className="font-semibold text-foreground">{currentAuction.username}</p>
                <p className="text-sm text-muted-foreground truncate">{currentAuction.link}</p>
              </div>
            </div>

            {/* Bid Info & Timer */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-xl bg-secondary">
                <p className="text-xs text-muted-foreground">Current bid</p>
                <p className="text-xl font-bold text-foreground">${bids[0]?.bidAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary">
                <p className="text-xs text-muted-foreground">Time left</p>
                <p className="text-xl font-bold text-bloom-pink">{formatTimeRemaining(currentAuction.endsAt)}</p>
                <p className="text-xs text-muted-foreground">ends @ 6:00 PM</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{currentAuction.visits.toLocaleString()} visitors</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>Avg. win: $592</span>
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

        {/* Place Bid Section */}
        <div className="bloom-card rounded-2xl p-4 border border-border">
          <h3 className="font-display font-semibold text-foreground mb-3">Place a Bid</h3>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="$11.11 or more"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="px-4 py-3 rounded-xl bg-bloom-green/20 border border-bloom-green/30 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-bloom-green" />
                <span className="text-sm font-medium text-bloom-green">USDC</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={bidUrl}
                  onChange={(e) => setBidUrl(e.target.value)}
                  placeholder="example.com"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="px-4 py-3 rounded-xl bg-secondary border border-border">
                <Link2 className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <button
              onClick={handlePlaceBid}
              className="w-full py-3 rounded-xl bg-bloom-pink text-white font-medium hover:opacity-90 transition-all active:scale-[0.98]"
            >
              Start Bid
            </button>
          </div>
        </div>

        {/* Bid Leaderboard */}
        <div className="bloom-card rounded-2xl p-4 border border-border">
          <h3 className="font-display font-semibold text-foreground mb-3">Live Bids</h3>
          
          <div className="space-y-2">
            {bids.map((bid, index) => (
              <div
                key={bid.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl transition-all',
                  bid.isLeader ? 'bg-bloom-gold/10 border border-bloom-gold/30' : 'bg-secondary'
                )}
              >
                <img
                  src={bid.avatar}
                  alt={bid.username}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">@{bid.username}</p>
                  {bid.supportCount > 0 && (
                    <p className="text-xs text-muted-foreground">(+${bid.supportCount.toFixed(2)})</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">${bid.bidAmount.toFixed(2)}</span>
                  {canSupport && !bid.isLeader && (
                    <button
                      onClick={() => handleSupport(bid.id)}
                      className="px-3 py-1 rounded-lg bg-bloom-purple text-white text-sm font-medium hover:opacity-90 transition-all"
                    >
                      Join bid
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {!canSupport && (
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Hold ≥10M BLOOM to support bidders
            </p>
          )}
        </div>

        {/* Past Winners */}
        <div className="bloom-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-bloom-gold" />
            <h3 className="font-display font-semibold text-foreground">Past Winners</h3>
          </div>
          
          <div className="space-y-2">
            {PAST_WINNERS.map((winner) => (
              <div key={winner.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-bloom-purple">#{winner.id}</span>
                  <span className="text-sm text-foreground">@{winner.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">{winner.link}</span>
                  <span className="text-sm font-bold text-bloom-gold">${winner.winAmount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

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
                  <p className="text-sm text-muted-foreground">Projects bid USDC to feature their link for 24 hours.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-bloom-pink/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-bloom-pink">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Highest Bid Wins</p>
                  <p className="text-sm text-muted-foreground">The top bidder gets featured. All other bids are refunded.</p>
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
                  <p className="text-sm text-muted-foreground">Hold ≥10M BLOOM to add +1 USDC to any bidder.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
