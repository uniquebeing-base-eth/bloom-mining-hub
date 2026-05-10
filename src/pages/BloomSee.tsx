'use client';
import { useState, useEffect } from 'react';
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
  ImageOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatUnits } from 'viem';
import { cn } from '@/lib/utils';
import { formatTimeRemaining } from '@/lib/bloom-utils';
import { useBloomStore } from '@/store/bloomStore';
import { BidModal } from '@/components/BidModal';
import { useBloomSee } from '@/hooks/useBloomSee';
import { useBloomBoost } from '@/hooks/useBloomBoost';
import { useAccount } from 'wagmi';

export default function BloomSee() {
  const { balance, addBloom } = useBloomStore();
  const { address } = useAccount();

  const {
    auctionId,
    auction,
    bids,
    pastWinners,
    minBid,
    minSupport,
    placeBid,
    isPending,
  } = useBloomSee();

  const { claimCampaign } = useBloomBoost();

  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidModalType, setBidModalType] = useState<'bid' | 'support'>('bid');
  const [selectedBidder, setSelectedBidder] = useState<string>('');
  const [newBidUrl, setNewBidUrl] = useState('');
  const [userExistingBidAmount, setUserExistingBidAmount] = useState<number>(0);
  const [hasVisited, setHasVisited] = useState(false);
  const [imageError, setImageError] = useState(false);

  const canSupport = balance >= 10_000_000;

  // --- Derive featured auction (last winner)
  const lastWinner =
    pastWinners && pastWinners.length > 0
      ? pastWinners[pastWinners.length - 1]
      : null;

  // fallback featured object
  const FEATURED_AUCTION = lastWinner
    ? {
        id: lastWinner.auctionId.toString(),
        username: lastWinner.winner.substring(0, 8),
        avatar:
          '[api.dicebear.com](https://api.dicebear.com/7.x/avataaars/svg?seed=)' +
          lastWinner.winner,
        link: lastWinner.link || '[warpcast.com](https://warpcast.com/)',
        title: 'Featured Winner',
        description: 'Yesterday’s winning link on Bloom & See ✨',
        image: '/placeholder.svg',
        visits: 0,
        endsAt: new Date(
          Number(lastWinner.timestamp) * 1000 + 24 * 60 * 60 * 1000
        ),
        claimableBloom: 0,
      }
    : null;

  // --- handle visit / claim state
  useEffect(() => {
    if (!FEATURED_AUCTION) return;
    const visited = localStorage.getItem(
      'bloom_visited_' + FEATURED_AUCTION.id
    );
    if (visited === 'true') setHasVisited(true);
  }, [FEATURED_AUCTION?.id]);

  const handleVisit = async () => {
    if (!FEATURED_AUCTION) return;
    localStorage.setItem('bloom_visited_' + FEATURED_AUCTION.id, 'true');
    try {
      await sdk.actions.openUrl(FEATURED_AUCTION.link);
    } catch {
      window.open(FEATURED_AUCTION.link, '_blank');
    }
    setHasVisited(true);
  };

  const handleClaim = async () => {
    try {
      await claimCampaign(Number(FEATURED_AUCTION?.id || 1));
      toast.success('BLOOM reward claimed on‑chain 🎉');
      addBloom(0.1); // or remove if contract auto‑rewards token
      setHasVisited(false);
      localStorage.removeItem('bloom_visited_' + FEATURED_AUCTION?.id);
    } catch (err: any) {
      toast.error(err?.shortMessage || 'Claim failed');
    }
  };

  // --- Bid modal wires on‑chain calls
  const handleBidSubmit = async (amount: number) => {
    if (bidModalType === 'bid') {
      if (!newBidUrl.trim()) {
        toast.error('Please paste your link first');
        return;
      }
      await placeBid(amount, newBidUrl.trim());
      setShowBidModal(false);
      setNewBidUrl('');
    } else {
      // support logic (placeholder; extend hook when ready)
      toast.info('Support coming soon on‑chain');
    }
  };

  // --- Map bids for display
  const mappedBids =
    bids?.map((b: any, i: number) => ({
      id: i.toString(),
      username:
        b.bidder.toLowerCase() === address?.toLowerCase()
          ? 'you'
          : b.bidder.slice(0, 8),
      avatar:
        '[api.dicebear.com](https://api.dicebear.com/7.x/avataaars/svg?seed=)' + b.bidder.slice(2),
      bidAmount: Number(formatUnits(b.amount, 6)),
      supportCount: Number(formatUnits(b.supportReceived, 6)),
      isLeader:
        auction?.highestBidder?.toLowerCase() === b.bidder.toLowerCase(),
    })) || [];

  const topBids = mappedBids.sort(
    (a, b) =>
      b.bidAmount + b.supportCount - (a.bidAmount + a.supportCount)
  );

  const currentAuctionNumber = auctionId || (lastWinner ? lastWinner.auctionId + 1 : 1);

  return (
    <div className="min-h-screen bloom-gradient-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-center gap-2 py-4 px-4">
          <Eye className="w-5 h-5 text-bloom-purple" />
          <h1 className="text-lg font-display font-bold text-foreground">
            Bloom & See
          </h1>
          <button
            onClick={() => setShowHowItWorks(true)}
            className="p-1 rounded-full hover:bg-secondary transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Featured Winner */}
        {FEATURED_AUCTION && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-bloom-gold" />
                <h2 className="font-display font-semibold text-foreground">
                  Featured Cast
                </h2>
              </div>
              <span className="text-sm text-bloom-gold font-medium">
                Auction #{FEATURED_AUCTION.id} Winner
              </span>
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
                    <span className="text-sm text-muted-foreground">
                      {FEATURED_AUCTION.title}
                    </span>
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
                    <p className="font-semibold text-foreground">
                      @{FEATURED_AUCTION.username}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {FEATURED_AUCTION.link}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-foreground mb-3">
                  {FEATURED_AUCTION.description}
                </p>

                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{FEATURED_AUCTION.visits.toLocaleString()} visits</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatTimeRemaining(FEATURED_AUCTION.endsAt)} left
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleVisit}
                    className="flex-1 py-3 rounded-xl bg-bloom-purple text-white font-medium hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                    Visit & Earn BLOOM
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
        )}

        {/* Live auction */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-foreground">
              Auction #{currentAuctionNumber} – Live Bids
            </h2>
            <div className="flex items-center gap-1 text-sm text-bloom-pink">
              <Clock className="w-4 h-4" />
              <span>{auction ? formatTimeRemaining(new Date(Number(auction.endTime) * 1000)) : '...'} </span>
            </div>
          </div>

          <div className="bloom-card rounded-2xl p-4 border border-border">
            {/* Place bid section */}
            <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-bloom-purple/10 to-bloom-pink/10 border border-bloom-purple/20">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-bloom-green" />
                <h3 className="font-semibold text-foreground">Place Your Bid</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Minimum bid: 
                <span className="text-bloom-green font-bold">
                  ${minBid} USDC
                </span>
              </p>
              <div className="space-y-3">
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={newBidUrl}
                    onChange={(e) => setNewBidUrl(e.target.value)}
                    placeholder="Paste your Warpcast link..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-bloom-purple/30"
                  />
                </div>
                <button
                  onClick={() => setShowBidModal(true)}
                  className="w-full py-3 rounded-xl bg-bloom-pink text-white font-medium hover:opacity-90 active:scale-[0.98] transition-all"
                  disabled={!newBidUrl}
                >
                  Place Bid
                </button>
              </div>
            </div>

            {/* Leaderboard */}
            {topBids.length > 0 && (
              <div className="space-y-2">
                {topBids.map((bid, i) => (
                  <div
                    key={bid.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl transition-all',
                      bid.isLeader
                        ? 'bg-bloom-gold/10 border border-bloom-gold/30'
                        : 'bg-secondary/50'
                    )}
                  >
                    <span className="w-6 text-center font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <img
                      src={bid.avatar}
                      alt={bid.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        @{bid.username}
                      </p>
                      {bid.supportCount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          +${bid.supportCount.toFixed(2)} support
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-foreground">
                      ${(bid.bidAmount + bid.supportCount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Bid modal */}
      <BidModal
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
        type={bidModalType}
        bidderName={selectedBidder}
        balance={balance}
        onSubmit={handleBidSubmit}
        existingBidAmount={userExistingBidAmount}
      />

      {/* How it works modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowHowItWorks(false)}
          />
          <div className="relative w-full max-w-md max-h-[85vh] bg-card rounded-t-3xl animate-bloom flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
              <h2 className="text-lg font-display font-bold text-foreground">
                How Bloom & See Works
              </h2>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-muted-foreground p-1"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-muted-foreground">
              <p><strong>1.</strong> Daily USDC Auction – projects bid to feature their link.</p>
              <p><strong>2.</strong> Highest Bid Wins – top bidder’s link becomes featured for 24 hours.</p>
              <p><strong>3.</strong> Earn BLOOM – visit the featured link and claim your reward.</p>
              <p><strong>4.</strong> Support Bids – holders of ≥10M BLOOM can add USDC to any bidder.</p>
            </div>
            <div className="h-8 flex-shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
}

export { BloomSee }
