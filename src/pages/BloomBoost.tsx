'use client';

import { useState } from 'react';
import { Campaign, CampaignTask } from '@/types/bloom';
import { useBloomStore } from '@/store/bloomStore';
import { cn } from '@/lib/utils';
import {
  Plus,
  Rocket,
  Check,
  X,
  ExternalLink,
  Heart,
  Repeat,
  UserPlus,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatBloom } from '@/lib/bloom-utils';

import { useBloomBoost } from '@/hooks/useBloomBoost';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS, BLOOM_BOOST_ABI } from '@/config/contracts';
import { formatUnits } from 'viem';

// Base reward is $0.02, multiplied by highest flower level
const BASE_REWARD = 0.02;

const TASK_CONFIG = {
  like: { label: 'Like', icon: Heart, color: 'text-red-400' },
  recast: { label: 'Recast', icon: Repeat, color: 'text-bloom-green' },
  follow: { label: 'Follow', icon: UserPlus, color: 'text-bloom-purple' },
  reply: { label: 'Reply', icon: MessageCircle, color: 'text-bloom-pink' },
};

// Reward multipliers by flower level
const REWARD_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 2.0,
  3: 3.0,
  4: 4.0,
  5: 5.0,
};

export function BloomBoost() {
  const { balance, flowers } = useBloomStore();
  const { campaignCount, userReward: contractReward, claimCampaign, createCampaign, isPending } = useBloomBoost();
  const { isConnected } = useAccount();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);

  // Get highest flower level for reward calculation
  const highestFlowerLevel = Math.max(
    ...flowers.filter(f => f.isUnlocked).map(f => f.level),
    1
  );

  const rewardMultiplier = REWARD_MULTIPLIERS[highestFlowerLevel] || 1;

  const calculatedReward = BASE_REWARD * rewardMultiplier;

  const finalReward =
    contractReward && contractReward > 0
      ? contractReward
      : calculatedReward;

  const campaignIds = Array.from(
    { length: campaignCount },
    (_, i) => i + 1
  ).reverse();

  const handleViewDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
  };

  const handleTaskAction = (campaignId: string, taskType: string) => {
    const campaign = selectedCampaign;

    if (campaign?.castLink) {
      window.open(campaign.castLink, '_blank');

      toast.info(`Perform the ${taskType} action`, {
        description: 'Come back and verify once done.',
      });
    }
  };

  const handleVerifyTask = (campaignId: string, taskType: string) => {
    if (!selectedCampaign) return;

    setSelectedCampaign({
      ...selectedCampaign,
      tasks: selectedCampaign.tasks.map(task =>
        task.type === taskType
          ? { ...task, completed: true }
          : task
      ),
    });

    toast.success(`${taskType} verified!`, {
      description: `Task completed. Claim your reward.`,
    });
  };

  const handleClaimReward = async () => {
    if (!selectedCampaign) return;

    try {
      await claimCampaign(Number(selectedCampaign.id));

      toast.success('Rewards claimed! 🎉', {
        description: `Campaign reward claimed successfully.`,
      });

      setSelectedCampaign(null);
    } catch (err) {
      console.error(err);

      toast.error('Failed to claim reward');
    }
  };

  const handleCreateCampaign = async (
    campaign: Campaign,
    payWithBloom: boolean
  ) => {
    try {
      setCreating(true);

      await createCampaign(
        Number(campaign.totalPool),
        payWithBloom
      );

      toast.success('Bloom Boost created! 🚀', {
        description: 'Your campaign is now live.',
      });

      setShowCreateModal(false);
    } catch (err) {
      console.error(err);

      toast.error('Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bloom-gradient-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex flex-col items-center py-4 px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <h1 className="text-lg font-display font-bold text-foreground">
              Bloom Boost
            </h1>
          </div>

          <p className="text-sm text-muted-foreground">
            Amplify attention. Accelerate mining.
          </p>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Reward Info */}
        {isConnected && (
          <div className="bloom-card rounded-xl p-4 border border-bloom-gold/30 bg-bloom-gold/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Your Reward Rate
                </p>

                <p className="text-xl font-bold text-bloom-gold">
                  ${finalReward.toFixed(2)} per campaign
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Flower Level
                </p>

                <p className="font-bold text-foreground">
                  L{highestFlowerLevel} ({rewardMultiplier}x)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full py-4 rounded-xl bloom-gradient-button text-white font-medium bloom-button-shadow hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Bloom Boost
        </button>

        {/* Active Campaigns */}
        <section>
          <h2 className="font-display font-semibold text-foreground mb-4">
            Active Campaigns
          </h2>

          <div className="space-y-4">
            {campaignIds.map((id) => (
              <CampaignCard
                key={id}
                id={id}
                userReward={finalReward}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateBoostModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCampaign}
          balance={balance}
          creating={creating}
        />
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <CampaignDetailModal
          campaign={selectedCampaign}
          userReward={finalReward}
          rewardMultiplier={rewardMultiplier}
          flowerLevel={highestFlowerLevel}
          onClose={() => setSelectedCampaign(null)}
          onTaskAction={handleTaskAction}
          onVerifyTask={handleVerifyTask}
          onClaim={handleClaimReward}
        />
      )}
    </div>
  );
}

interface CampaignCardProps {
  id: number;
  userReward: number;
  onViewDetails: (campaign: Campaign) => void;
}

function CampaignCard({
  id,
  userReward,
  onViewDetails,
}: CampaignCardProps) {
  const { address } = useAccount();

  const { data: campaign } = useReadContract({
    address: CONTRACTS.BLOOM_BOOST,
    abi: BLOOM_BOOST_ABI,
    functionName: 'getCampaign',
    args: [BigInt(id)],
    query: {
      enabled: true,
      refetchInterval: 30_000,
    },
  });

  const { data: hasClaimed } = useReadContract({
    address: CONTRACTS.BLOOM_BOOST,
    abi: BLOOM_BOOST_ABI,
    functionName: 'hasClaimed',
    args: address ? [BigInt(id), address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  if (!campaign) return null;

  const c = campaign as any;

  if (!c.active) return null;

  const poolFormatted = c.payedWithBloom
    ? Number(formatUnits(c.pool, 18)).toLocaleString()
    : Number(formatUnits(c.pool, 6)).toFixed(2);

  const mappedCampaign: Campaign = {
    id: id.toString(),
    creatorUsername: 'Bloom',
    creatorAvatar:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=bloom',
    castText: c.castText || 'Complete social tasks and earn rewards 🌸',
    castLink: c.castLink || 'https://warpcast.com',
    remainingPool: Number(c.pool),
    totalPool: Number(c.pool),
    rewardPerAction: userReward,
    boostMultiplier: 2,
    participants: Number(c.participantCount),
    tasks: [
      { type: 'like', completed: false },
      { type: 'recast', completed: false },
      { type: 'follow', completed: false },
      { type: 'reply', completed: false },
    ],
  };

  return (
    <div
      className="bloom-card rounded-2xl p-4 border border-border cursor-pointer hover:border-bloom-pink/30 transition-all active:scale-[0.99]"
      onClick={() => onViewDetails(mappedCampaign)}
    >
      {/* Creator Info */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={mappedCampaign.creatorAvatar}
          alt={mappedCampaign.creatorUsername}
          className="w-10 h-10 rounded-full object-cover"
        />

        <div className="flex-1">
          <p className="font-medium text-foreground">
            @{mappedCampaign.creatorUsername}
          </p>

          <p className="text-xs text-muted-foreground">
            {mappedCampaign.participants} participants
          </p>
        </div>

        <span
          className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            'bg-bloom-green/10 text-bloom-green'
          )}
        >
          +{mappedCampaign.boostMultiplier}x
        </span>
      </div>

      {/* Cast Preview */}
      <p className="text-sm text-foreground mb-3 line-clamp-2">
        {mappedCampaign.castText}
      </p>

      {/* Task Icons */}
      <div className="flex items-center gap-2 mb-3">
        {mappedCampaign.tasks.map((task) => {
          const config = TASK_CONFIG[task.type];
          const Icon = config.icon;

          return (
            <div
              key={task.type}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                task.completed
                  ? 'bg-bloom-green/20'
                  : 'bg-secondary'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4',
                  task.completed
                    ? 'text-bloom-green'
                    : config.color
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-sm text-muted-foreground">
          Pool:{' '}
          <span className="font-bold text-foreground">
            {poolFormatted}
          </span>
        </span>

        {Boolean(hasClaimed) ? (
          <span className="text-sm font-medium text-bloom-green">
            Claimed
          </span>
        ) : (
          <span className="text-sm font-medium text-bloom-purple">
            Earn ${userReward.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}

interface CreateBoostModalProps {
  onClose: () => void;
  onCreate: (
    campaign: Campaign,
    payWithBloom: boolean
  ) => void;
  balance: number;
  creating: boolean;
}

function CreateBoostModal({
  onClose,
  onCreate,
  balance,
  creating,
}: CreateBoostModalProps) {
  const [castLink, setCastLink] = useState('');
  const [paymentType, setPaymentType] = useState<'bloom' | 'usdc'>(
    'bloom'
  );

  const [budget, setBudget] = useState('7500000');

  const [tasks, setTasks] = useState({
    like: true,
    recast: true,
    follow: true,
    reply: true,
  });

  const handleLaunch = async () => {
    const selectedTasks: CampaignTask[] = Object.entries(tasks)
      .filter(([_, selected]) => selected)
      .map(([type]) => ({
        type: type as
          | 'like'
          | 'recast'
          | 'follow'
          | 'reply',
        completed: false,
      }));

    const newCampaign: Campaign = {
      id: Date.now().toString(),
      creatorUsername: 'you',
      creatorAvatar:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=you',
      castText:
        castLink || 'My awesome Bloom Boost campaign! 🌸',
      castLink:
        castLink || 'https://warpcast.com/you/0x789',
      remainingPool: parseInt(budget),
      totalPool: parseInt(budget),
      rewardPerAction: BASE_REWARD,
      boostMultiplier: 2.5,
      participants: 0,
      tasks: selectedTasks,
    };

    await onCreate(newCampaign, paymentType === 'bloom');
  };

  const canAfford =
    paymentType === 'bloom'
      ? balance >= parseInt(budget)
      : true;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-card rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto animate-bloom">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-bloom-pink" />

            <h2 className="text-lg font-display font-bold text-foreground">
              Create Bloom Boost
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance */}
        <div className="mb-4 p-3 rounded-xl bg-secondary/50">
          <p className="text-sm text-muted-foreground">
            Your Balance:{' '}
            <span className="font-bold text-foreground">
              {formatBloom(balance)} BLOOM
            </span>
          </p>
        </div>

        {/* Cast Link */}
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">
            Cast Link
          </label>

          <input
            type="text"
            value={castLink}
            onChange={(e) => setCastLink(e.target.value)}
            placeholder="https://warpcast.com/..."
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Launch */}
        <button
          onClick={handleLaunch}
          disabled={!canAfford || creating}
          className={cn(
            'w-full py-4 rounded-xl font-display font-bold text-lg transition-all',
            canAfford
              ? 'bloom-gradient-button text-white bloom-button-shadow hover:opacity-90 active:scale-[0.98]'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {creating ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : canAfford ? (
            'Launch Campaign'
          ) : (
            'Insufficient BLOOM'
          )}
        </button>
      </div>
    </div>
  );
}
