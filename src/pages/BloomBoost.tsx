'use client';
import { useState } from 'react';
import { Rocket, Sparkles, Users, Loader2, CheckCircle2, PlusCircle } from 'lucide-react';
import { useBloomBoost } from '@/hooks/useBloomBoost';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS, BLOOM_BOOST_ABI } from '@/config/contracts';
import { formatUnits } from 'viem';

function CampaignRow({ id, onClaim, isPending }: { id: number; onClaim: (id: number) => void; isPending: boolean }) {
  const { address } = useAccount();

  const { data: campaign } = useReadContract({
    address: CONTRACTS.BLOOM_BOOST,
    abi: BLOOM_BOOST_ABI,
    functionName: 'getCampaign',
    args: [BigInt(id)],
    query: { enabled: true, refetchInterval: 30_000 },
  });

  const { data: hasClaimed } = useReadContract({
    address: CONTRACTS.BLOOM_BOOST,
    abi: BLOOM_BOOST_ABI,
    functionName: 'hasClaimed',
    args: address ? [BigInt(id), address] : undefined,
    query: { enabled: !!address },
  });

  if (!campaign) return null;
  const c = campaign as any;
  if (!c.active) return null;

  const poolFormatted = c.payedWithBloom
    ? Number(formatUnits(c.pool, 18)).toLocaleString()
    : Number(formatUnits(c.pool, 6)).toFixed(2);
  const token = c.payedWithBloom ? 'BLOOM' : 'USDC';
  const claimed = Boolean(hasClaimed);

  return (
    <div className="bloom-card rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-bloom-pink" />
          <span className="font-display font-semibold text-foreground">Campaign #{id}</span>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-bloom-green/10 text-bloom-green font-medium">Active</span>
      </div>
      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-muted-foreground">Pool remaining</span>
        <span className="font-semibold text-foreground">{poolFormatted} {token}</span>
      </div>
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-muted-foreground flex items-center gap-1">
          <Users className="w-3 h-3" /> Participants
        </span>
        <span className="font-semibold text-foreground">{Number(c.participantCount)}</span>
      </div>
      {claimed ? (
        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-bloom-green/10 text-bloom-green text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" /> Claimed
        </div>
      ) : (
        <button
          onClick={() => onClaim(id)}
          disabled={isPending}
          className="w-full py-3 rounded-xl bloom-gradient-button text-white font-medium bloom-button-shadow hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Claim Reward'}
        </button>
      )}
    </div>
  );
}

export function BloomBoost() {
  const { campaignCount, userReward, claimCampaign, createCampaign, isPending } = useBloomBoost();
  const { isConnected } = useAccount();

  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    try {
      setCreating(true);
      // Example parameters: 100 BLOOM pool, paidWithBloom = true
      await createCampaign(100, true);
    } finally {
      setCreating(false);
    }
  };

  const campaignIds = Array.from({ length: campaignCount }, (_, i) => i + 1).reverse();

  return (
    <div className="min-h-screen bloom-gradient-bg pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex flex-col items-center py-4 px-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-bloom-pink" />
            <h1 className="text-lg font-display font-bold text-foreground">Bloom Boost</h1>
          </div>
          <p className="text-sm text-muted-foreground">Social task campaigns — earn by engaging</p>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-4">
        {isConnected && userReward > 0 && (
          <div className="bloom-card rounded-2xl p-4 border border-bloom-pink-light/20 text-center">
            <p className="text-xs text-muted-foreground mb-1">Your reward per campaign</p>
            <p className="text-xl font-display font-black text-foreground">
              {userReward.toLocaleString()} <span className="text-bloom-pink text-sm">BLOOM</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Higher flower level = higher multiplier
            </p>
          </div>
        )}

        {/* Campaign list or creation */}
        {campaignCount === 0 ? (
          <div className="bloom-card rounded-2xl p-8 border border-border text-center">
            <Sparkles className="w-10 h-10 text-bloom-pink mx-auto mb-3 animate-pulse" />
            <h2 className="text-lg font-display font-bold text-foreground mb-2">No campaigns yet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to create a Bloom Boost campaign!
            </p>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-lg bg-bloom-pink text-white font-medium hover:bg-bloom-pink/90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              {creating ? 'Creating…' : 'Launch Campaign'}
            </button>
          </div>
        ) : (
          campaignIds.map((id) => (
            <CampaignRow key={id} id={id} onClaim={claimCampaign} isPending={isPending} />
          ))
        )}
      </main>
    </div>
  );
}

export default BloomBoost;
