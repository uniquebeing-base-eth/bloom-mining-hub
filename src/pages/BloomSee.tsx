import { useState, useEffect } from 'react';
import { Eye, Clock, Gavel, ExternalLink, Loader2, Trophy, DollarSign } from 'lucide-react';
import { useBloomSee } from '@/hooks/useBloomSee';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { cn } from '@/lib/utils';

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return 'Ended';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}

function shortenAddress(addr: string): string {
  if (!addr || addr === '0x0000000000000000000000000000000000000000') return 'None';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function BloomSee() {
  const { address, isConnected } = useAccount();
  const {
    auctionId,
    auction,
    bids,
    timeRemaining,
    minBid,
    minSupport,
    pastWinners,
    placeBid,
    supportBid,
    settleAuction,
    isPending,
    refetchAll,
  } = useBloomSee();

  const [bidAmount, setBidAmount] = useState('');
  const [bidLink, setBidLink] = useState('');
  const [showBidForm, setShowBidForm] = useState(false);
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    setCountdown(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const auctionEnded = countdown <= 0 && auction && !auction.settled;

  const handlePlaceBid = async () => {
    const amt = parseFloat(bidAmount);
    if (isNaN(amt) || amt < minBid) {
      return;
    }
    if (!bidLink.trim()) return;
    await placeBid(amt, bidLink.trim());
    setBidAmount('');
    setBidLink('');
    setShowBidForm(false);
  };

  const sortedBids = [...bids].sort((a, b) => {
    const totalA = Number(a.amount) + Number(a.supportReceived);
    const totalB = Number(b.amount) + Number(b.supportReceived);
    return totalB - totalA;
  });

  return (
    <div className="min-h-screen bloom-gradient-bg pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex flex-col items-center py-4 px-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-bloom-purple" />
            <h1 className="text-lg font-display font-bold text-foreground">Bloom & See</h1>
          </div>
          <p className="text-sm text-muted-foreground">24-hour link auctions — bid for the spotlight</p>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-4">
        {/* Current auction card */}
        <div className="bloom-card rounded-2xl p-4 border border-bloom-purple-light/20">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display font-semibold text-foreground flex items-center gap-2">
              <Gavel className="w-4 h-4 text-bloom-purple" /> Auction #{auctionId}
            </span>
            <div className="flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3 text-bloom-gold" />
              <span className={cn('font-mono font-medium', countdown <= 0 ? 'text-red-400' : 'text-bloom-gold')}>
                {formatCountdown(countdown)}
              </span>
            </div>
          </div>

          {auction && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-secondary/50 border border-border p-3 text-center">
                  <p className="text-[11px] text-muted-foreground mb-1">Highest Bid</p>
                  <p className="text-lg font-display font-black text-foreground">
                    {Number(formatUnits(auction.highestBid, 6)).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">USDC</p>
                </div>
                <div className="rounded-xl bg-secondary/50 border border-border p-3 text-center">
                  <p className="text-[11px] text-muted-foreground mb-1">Leader</p>
                  <p className="text-sm font-semibold text-foreground">{shortenAddress(auction.highestBidder)}</p>
                  {auction.link && (
                    <p className="text-[10px] text-bloom-purple truncate mt-1">{auction.link}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Settle button */}
          {auctionEnded && (
            <button
              onClick={settleAuction}
              disabled={isPending}
              className="w-full py-3 rounded-xl bg-bloom-gold text-background font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mb-3"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '⚡ Settle & Start New Auction'}
            </button>
          )}

          {/* Place bid */}
          {!auctionEnded && countdown > 0 && (
            <>
              {showBidForm ? (
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder={`Min ${minBid} USDC`}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm"
                  />
                  <input
                    type="url"
                    placeholder="Your Farcaster cast link"
                    value={bidLink}
                    onChange={(e) => setBidLink(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowBidForm(false)}
                      className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePlaceBid}
                      disabled={isPending || !bidAmount || !bidLink}
                      className="flex-1 py-3 rounded-xl bloom-gradient-button text-white font-medium bloom-button-shadow hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Place Bid'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowBidForm(true)}
                  className="w-full py-3 rounded-xl bg-bloom-purple text-white font-medium hover:bg-bloom-purple-dark active:scale-[0.98] transition-all"
                >
                  <DollarSign className="w-4 h-4 inline mr-1" /> Place Bid (min {minBid} USDC)
                </button>
              )}
            </>
          )}
        </div>

        {/* Live bids leaderboard */}
        {sortedBids.length > 0 && (
          <div className="bloom-card rounded-2xl p-4 border border-border">
            <h3 className="font-display font-semibold text-foreground mb-3">Live Bids</h3>
            <div className="space-y-2">
              {sortedBids.map((bid, i) => {
                const total = Number(formatUnits(bid.amount + bid.supportReceived, 6));
                const bidUsdc = Number(formatUnits(bid.amount, 6));
                const supportUsdc = Number(formatUnits(bid.supportReceived, 6));
                const isLeader = i === 0;
                return (
                  <div
                    key={bid.bidder}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl transition-all',
                      isLeader ? 'bg-bloom-gold/10 border border-bloom-gold/30' : 'bg-secondary'
                    )}
                  >
                    <span className="font-bold text-foreground w-6">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{shortenAddress(bid.bidder)}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{bid.link}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-semibold text-foreground">{total.toFixed(2)} USDC</p>
                      {supportUsdc > 0 && <p className="text-muted-foreground">+{supportUsdc.toFixed(2)} support</p>}
                    </div>
                    {isLeader ? (
                      <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-bloom-gold/20 text-bloom-gold shrink-0">👑</span>
                    ) : (
                      <button
                        onClick={() => supportBid(bid.bidder, minSupport)}
                        disabled={isPending}
                        className="px-2 py-1 rounded-lg text-[10px] font-medium bg-bloom-purple/10 text-bloom-purple hover:bg-bloom-purple/20 shrink-0 disabled:opacity-50"
                      >
                        +Support
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Past winners */}
        {pastWinners.length > 0 && (
          <div className="bloom-card rounded-2xl p-4 border border-border">
            <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-bloom-gold" /> Past Winners
            </h3>
            <div className="space-y-2">
              {(pastWinners as any[]).slice(-5).reverse().map((w: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary text-sm">
                  <span className="text-foreground font-medium">{shortenAddress(w.winner)}</span>
                  <span className="text-muted-foreground">{Number(formatUnits(w.winningBid, 6)).toFixed(2)} USDC</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
