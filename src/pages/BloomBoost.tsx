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
  Heart,
  Repeat,
  UserPlus,
  MessageCircle,
  Loader2,
} from 'lucide-react';

import { toast } from 'sonner';
import { formatBloom } from '@/lib/bloom-utils';

import { useBloomBoost } from '@/hooks/useBloomBoost';

import {
  useAccount,
  useReadContract,
} from 'wagmi';

import {
  CONTRACTS,
  BLOOM_BOOST_ABI,
} from '@/config/contracts';

import { formatUnits } from 'viem';

const BASE_REWARD = 0.02;

const TASK_CONFIG = {
  like: {
    label: 'Like',
    icon: Heart,
    color: 'text-red-400',
  },

  recast: {
    label: 'Recast',
    icon: Repeat,
    color: 'text-bloom-green',
  },

  follow: {
    label: 'Follow',
    icon: UserPlus,
    color: 'text-bloom-purple',
  },

  reply: {
    label: 'Reply',
    icon: MessageCircle,
    color: 'text-bloom-pink',
  },
};

const REWARD_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 2.0,
  3: 3.0,
  4: 4.0,
  5: 5.0,
};

export function BloomBoost() {
  const { balance, flowers } = useBloomStore();

  const {
    campaignCount,
    userReward: contractReward,
    claimCampaign,
    createCampaign,
  } = useBloomBoost();

  const { isConnected } = useAccount();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);

  const highestFlowerLevel = Math.max(
    ...flowers.filter((f) => f.isUnlocked).map((f) => f.level),
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
      tasks: selectedCampaign.tasks.map((task) =>
        task.type === taskType
          ? { ...task, completed: true }
          : task
      ),
    });

    toast.success(`${taskType} verified!`, {
      description: 'Task completed. Claim your reward.',
    });
  };

  const handleClaimReward = async () => {
    if (!selectedCampaign) return;

    try {
      await claimCampaign(Number(selectedCampaign.id));

      toast.success('Rewards claimed! 🎉', {
        description: 'Campaign reward claimed successfully.',
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

      await createCampaign(Number(campaign.totalPool), payWithBloom);

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

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full py-4 rounded-xl bloom-gradient-button text-white font-medium bloom-button-shadow hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Bloom Boost
        </button>

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

      {showCreateModal && (
        <CreateBoostModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCampaign}
          balance={balance}
          creating={creating}
        />
      )}

      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedCampaign(null)}
          />

          <div className="relative w-full max-w-md bg-card rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden animate-bloom">
            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Campaign Tasks
                </h2>

                <p className="text-sm text-muted-foreground">
                  Complete all tasks to claim reward
                </p>
              </div>

              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 pb-40">
              <div className="mb-5">
                <p className="text-sm text-foreground leading-relaxed">
                  {selectedCampaign.castText}
                </p>
              </div>

              <div className="space-y-4">
                {selectedCampaign.tasks.map((task) => {
                  const config = TASK_CONFIG[task.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={task.type}
                      className="p-4 rounded-xl border border-border bg-secondary/40"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                            <Icon className={cn('w-5 h-5', config.color)} />
                          </div>

                          <div>
                            <p className="font-medium text-foreground capitalize">
                              {task.type}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ✅ FIXED BUTTON GUARD */}
            <div className="sticky bottom-0 left-0 right-0 p-6 bg-card border-t border-border z-20">
              <button
                onClick={handleClaimReward}
                disabled={
                  !selectedCampaign?.tasks?.every(
                    (task) => task.completed
                  )
                }
                className={cn(
                  'w-full py-4 rounded-xl font-bold text-lg transition-all',
                  selectedCampaign?.tasks?.every(
                    (task) => task.completed
                  )
                    ? 'bloom-gradient-button text-white bloom-button-shadow'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                Claim ${finalReward.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
