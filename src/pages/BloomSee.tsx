import { useState } from 'react';
import { FeaturedCard, BidLeaderboard } from '@/components/AuctionComponents';
import { FeaturedAuction, AuctionBid } from '@/types/bloom';
import { useBloomStore } from '@/store/bloomStore';
import { toast } from 'sonner';
import { Eye } from 'lucide-react';
import bloomLogo from '@/assets/bloom-logo.png';

// Demo data
const DEMO_FEATURED: FeaturedAuction = {
  id: '1',
  username: 'alicefarcaster',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
  link: 'https://warpcast.com',
  title: 'Announcing New AI Research Tool',
  description: 'Check out our new AI research tool that can generate insights from web3 data in seconds.',
  image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=300&fit=crop',
  visits: 6_802,
  endsAt: new Date(Date.now() + 22 * 60 * 60 * 1000 + 14 * 60 * 1000), // 22h 14m from now
  claimableBloom: 250_000,
};

const DEMO_BIDS: AuctionBid[] = [
  { id: '1', username: 'bob', bidAmount: 489, supportCount: 12, isLeader: true },
  { id: '2', username: 'carla', bidAmount: 354, supportCount: 8, isLeader: false },
  { id: '3', username: 'dave', bidAmount: 215, supportCount: 5, isLeader: false },
];

export function BloomSee() {
  const { balance } = useBloomStore();
  const [featured] = useState<FeaturedAuction>(DEMO_FEATURED);
  const [bids] = useState<AuctionBid[]>(DEMO_BIDS);
  const [hasVisited, setHasVisited] = useState(false);

  const handleVisit = () => {
    setHasVisited(true);
    window.open(featured.link, '_blank');
    toast.success('Visit recorded!', {
      description: 'Come back to claim your BLOOM reward.',
    });
  };

  const handleClaim = () => {
    toast.success('BLOOM claimed! 🎉', {
      description: `+${featured.claimableBloom.toLocaleString()} BLOOM added to your balance.`,
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
    toast.info('Bid placement coming soon!');
  };

  return (
    <div className="min-h-screen bloom-gradient-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-center gap-2 py-4 px-4">
          <span className="text-xl">👁</span>
          <h1 className="text-lg font-display font-bold text-foreground">Bloom & See</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Featured Today */}
        <FeaturedCard
          auction={featured}
          onVisit={handleVisit}
          onClaim={handleClaim}
          canClaim={hasVisited}
        />

        {/* Live Auction */}
        <BidLeaderboard
          bids={bids}
          userBalance={balance}
          onSupport={handleSupport}
          onPlaceBid={handlePlaceBid}
        />
      </main>
    </div>
  );
}
