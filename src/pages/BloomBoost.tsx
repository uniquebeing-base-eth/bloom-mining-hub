import { useState } from 'react';
import { Campaign, CampaignTask } from '@/types/bloom';
import { useBloomStore } from '@/store/bloomStore';
import { cn } from '@/lib/utils';
import { Plus, Rocket, Check, X, ExternalLink, Heart, Repeat, UserPlus, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatBloom } from '@/lib/bloom-utils';

// Demo campaigns
const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    creatorUsername: 'dave',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dave',
    castText: "Bitcoin breaks $70k! Where do you think it's headed next? 🚀",
    castImage: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=200&fit=crop',
    castLink: 'https://warpcast.com/dave/0x123',
    remainingPool: 87,
    totalPool: 70_145,
    rewardPerAction: 0.05,
    boostMultiplier: 2.0,
    participants: 245,
    tasks: [
      { type: 'like', completed: false },
      { type: 'recast', completed: false },
      { type: 'follow', completed: false },
      { type: 'reply', completed: false },
    ],
  },
  {
    id: '2',
    creatorUsername: 'alicefarcaster',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    castText: 'Announcing New AI Research Tool - Check out our new AI research tool that can generate insights from web3 data in seconds.',
    castImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
    castLink: 'https://warpcast.com/alice/0x456',
    remainingPool: 8_195,
    totalPool: 3_447_390,
    rewardPerAction: 0.05,
    boostMultiplier: 2.0,
    participants: 579,
    tasks: [
      { type: 'like', completed: false },
      { type: 'recast', completed: false },
      { type: 'follow', completed: false },
      { type: 'reply', completed: false },
    ],
  },
];

const TASK_CONFIG = {
  like: { label: 'Like', icon: Heart, color: 'text-red-400' },
  recast: { label: 'Recast', icon: Repeat, color: 'text-bloom-green' },
  follow: { label: 'Follow', icon: UserPlus, color: 'text-bloom-purple' },
  reply: { label: 'Reply', icon: MessageCircle, color: 'text-bloom-pink' },
};

export function BloomBoost() {
  const { balance } = useBloomStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const handleCreateCampaign = (newCampaign: Campaign) => {
    setCampaigns([newCampaign, ...campaigns]);
    setShowCreateModal(false);
  };

  const handleViewDetails = (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    if (campaign) {
      setSelectedCampaign(campaign);
    }
  };

  const handleTaskAction = (campaignId: string, taskType: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign?.castLink) {
      window.open(campaign.castLink, '_blank');
      toast.info(`Perform the ${taskType} action`, {
        description: 'Come back and verify once done.',
      });
    }
  };

  const handleVerifyTask = (campaignId: string, taskType: string) => {
    setCampaigns(campaigns.map(campaign => {
      if (campaign.id === campaignId) {
        return {
          ...campaign,
          tasks: campaign.tasks.map(task => 
            task.type === taskType ? { ...task, completed: true } : task
          )
        };
      }
      return campaign;
    }));
    
    if (selectedCampaign?.id === campaignId) {
      setSelectedCampaign({
        ...selectedCampaign,
        tasks: selectedCampaign.tasks.map(task =>
          task.type === taskType ? { ...task, completed: true } : task
        )
      });
    }
    
    toast.success(`${taskType} verified!`, {
      description: `+$0.05 USDC equivalent earned`,
    });
  };

  const handleClaimReward = () => {
    if (selectedCampaign) {
      const completedTasks = selectedCampaign.tasks.filter(t => t.completed).length;
      const reward = completedTasks * selectedCampaign.rewardPerAction;
      toast.success('Rewards claimed! 🎉', {
        description: `+$${reward.toFixed(2)} USDC equivalent in BLOOM`,
      });
      setSelectedCampaign(null);
    }
  };

  return (
    <div className="min-h-screen bloom-gradient-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex flex-col items-center py-4 px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <h1 className="text-lg font-display font-bold text-foreground">Bloom Boost</h1>
          </div>
          <p className="text-sm text-muted-foreground">Amplify attention. Accelerate mining.</p>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
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
          <h2 className="font-display font-semibold text-foreground mb-4">Active Campaigns</h2>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onViewDetails={() => handleViewDetails(campaign.id)}
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
        />
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <CampaignDetailModal
          campaign={selectedCampaign}
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
  campaign: Campaign;
  onViewDetails: () => void;
}

function CampaignCard({ campaign, onViewDetails }: CampaignCardProps) {
  return (
    <div 
      className="bloom-card rounded-2xl p-4 border border-border cursor-pointer hover:border-bloom-pink/30 transition-all active:scale-[0.99]"
      onClick={onViewDetails}
    >
      {/* Creator Info */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={campaign.creatorAvatar}
          alt={campaign.creatorUsername}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="font-medium text-foreground">@{campaign.creatorUsername}</p>
          <p className="text-xs text-muted-foreground">{campaign.participants} participants</p>
        </div>
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          'bg-bloom-green/10 text-bloom-green'
        )}>
          +{campaign.boostMultiplier}x
        </span>
      </div>

      {/* Cast Preview */}
      <p className="text-sm text-foreground mb-3 line-clamp-2">{campaign.castText}</p>

      {campaign.castImage && (
        <img
          src={campaign.castImage}
          alt="Cast"
          className="w-full h-32 object-cover rounded-xl mb-3"
        />
      )}

      {/* Task Icons */}
      <div className="flex items-center gap-2 mb-3">
        {campaign.tasks.map((task) => {
          const config = TASK_CONFIG[task.type];
          const Icon = config.icon;
          return (
            <div
              key={task.type}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                task.completed ? 'bg-bloom-green/20' : 'bg-secondary'
              )}
            >
              <Icon className={cn('w-4 h-4', task.completed ? 'text-bloom-green' : config.color)} />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-sm text-muted-foreground">
          Pool: <span className="font-bold text-foreground">{formatBloom(campaign.remainingPool)}</span>
        </span>
        <span className="text-sm font-medium text-bloom-purple">
          Earn ${(campaign.tasks.length * campaign.rewardPerAction).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

interface CreateBoostModalProps {
  onClose: () => void;
  onCreate: (campaign: Campaign) => void;
  balance: number;
}

function CreateBoostModal({ onClose, onCreate, balance }: CreateBoostModalProps) {
  const [castLink, setCastLink] = useState('');
  const [paymentType, setPaymentType] = useState<'bloom' | 'usdc'>('bloom');
  const [budget, setBudget] = useState('7500000');
  const [tasks, setTasks] = useState({
    like: true,
    recast: true,
    follow: true,
    reply: true,
  });

  const handleLaunch = () => {
    const selectedTasks: CampaignTask[] = Object.entries(tasks)
      .filter(([_, selected]) => selected)
      .map(([type]) => ({ type: type as 'like' | 'recast' | 'follow' | 'reply', completed: false }));

    const newCampaign: Campaign = {
      id: Date.now().toString(),
      creatorUsername: 'you',
      creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=you',
      castText: castLink || 'My awesome Bloom Boost campaign! 🌸',
      castLink: castLink || 'https://warpcast.com/you/0x789',
      remainingPool: parseInt(budget),
      totalPool: parseInt(budget),
      rewardPerAction: 0.05,
      boostMultiplier: 2.5,
      participants: 0,
      tasks: selectedTasks,
    };

    onCreate(newCampaign);
    toast.success('Bloom Boost created! 🚀', {
      description: 'Your campaign is now live.',
    });
  };

  const canAfford = paymentType === 'bloom' ? balance >= parseInt(budget) : true;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto animate-bloom">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-bloom-pink" />
            <h2 className="text-lg font-display font-bold text-foreground">Create Bloom Boost</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance */}
        <div className="mb-4 p-3 rounded-xl bg-secondary/50">
          <p className="text-sm text-muted-foreground">Your Balance: <span className="font-bold text-foreground">{formatBloom(balance)} BLOOM</span></p>
        </div>

        {/* Cast Link */}
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">Cast Link</label>
          <input
            type="text"
            value={castLink}
            onChange={(e) => setCastLink(e.target.value)}
            placeholder="https://warpcast.com/..."
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Payment Type */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setPaymentType('bloom')}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium transition-all',
              paymentType === 'bloom'
                ? 'bloom-gradient-button text-white'
                : 'bg-secondary text-foreground'
            )}
          >
            Pay with BLOOM
          </button>
          <button
            onClick={() => setPaymentType('usdc')}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium transition-all flex flex-col items-center',
              paymentType === 'usdc'
                ? 'bg-bloom-green text-white'
                : 'bg-secondary text-foreground'
            )}
          >
            <span>Pay with USDC</span>
            {paymentType === 'usdc' && (
              <span className="text-xs opacity-80">0.2 USDC fee</span>
            )}
          </button>
        </div>

        {/* Budget */}
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">Budget</label>
          <div className="p-4 rounded-xl bg-secondary">
            <p className="text-lg font-bold text-foreground mb-2">{formatBloom(parseInt(budget))} BLOOM</p>
            <input
              type="range"
              min="1000000"
              max="50000000"
              step="500000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full accent-bloom-pink"
            />
          </div>
        </div>

        {/* Tasks */}
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">Required Actions</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(TASK_CONFIG) as Array<keyof typeof TASK_CONFIG>).map((task) => {
              const config = TASK_CONFIG[task];
              const Icon = config.icon;
              return (
                <button
                  key={task}
                  onClick={() => setTasks((prev) => ({ ...prev, [task]: !prev[task] }))}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-xl transition-all',
                    tasks[task]
                      ? 'bg-bloom-green/10 border border-bloom-green/30'
                      : 'bg-secondary border border-border'
                  )}
                >
                  <Icon className={cn('w-4 h-4', tasks[task] ? 'text-bloom-green' : config.color)} />
                  <span className="text-sm font-medium text-foreground capitalize">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Launch */}
        <button
          onClick={handleLaunch}
          disabled={!canAfford}
          className={cn(
            'w-full py-4 rounded-xl font-display font-bold text-lg transition-all',
            canAfford
              ? 'bloom-gradient-button text-white bloom-button-shadow hover:opacity-90 active:scale-[0.98]'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {canAfford ? 'Launch Campaign' : 'Insufficient BLOOM'}
        </button>
      </div>
    </div>
  );
}

interface CampaignDetailModalProps {
  campaign: Campaign;
  onClose: () => void;
  onTaskAction: (campaignId: string, taskType: string) => void;
  onVerifyTask: (campaignId: string, taskType: string) => void;
  onClaim: () => void;
}

function CampaignDetailModal({ campaign, onClose, onTaskAction, onVerifyTask, onClaim }: CampaignDetailModalProps) {
  const allTasksComplete = campaign.tasks.every(t => t.completed);
  const completedCount = campaign.tasks.filter(t => t.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto animate-bloom">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={campaign.creatorAvatar}
              alt={campaign.creatorUsername}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-semibold text-foreground">@{campaign.creatorUsername}</p>
              <p className="text-xs text-muted-foreground">{campaign.participants} participants</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cast Preview with Link */}
        <div className="bloom-card rounded-xl p-4 mb-4 border border-border">
          <p className="text-sm text-foreground mb-2">{campaign.castText}</p>
          {campaign.castImage && (
            <img
              src={campaign.castImage}
              alt="Cast"
              className="w-full h-32 object-cover rounded-lg mb-2"
            />
          )}
          {campaign.castLink && (
            <a
              href={campaign.castLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-bloom-purple hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              View on Warpcast
            </a>
          )}
        </div>

        {/* Pool Info */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-secondary">
          <span className="text-sm text-muted-foreground">Pool Remaining</span>
          <span className="font-bold text-foreground">{formatBloom(campaign.remainingPool)} / {formatBloom(campaign.totalPool)}</span>
        </div>

        {/* Tasks */}
        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-3">
            Complete Actions ({completedCount}/{campaign.tasks.length})
          </p>
          <div className="space-y-2">
            {campaign.tasks.map((task) => {
              const config = TASK_CONFIG[task.type];
              const Icon = config.icon;
              
              return (
                <div
                  key={task.type}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl transition-all',
                    task.completed
                      ? 'bg-bloom-green/10 border border-bloom-green/30'
                      : 'bg-secondary border border-border'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    task.completed ? 'bg-bloom-green/20' : 'bg-background'
                  )}>
                    <Icon className={cn('w-5 h-5', task.completed ? 'text-bloom-green' : config.color)} />
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{config.label}</p>
                    <p className="text-xs text-muted-foreground">+$0.05 reward</p>
                  </div>
                  
                  {task.completed ? (
                    <div className="w-8 h-8 rounded-full bg-bloom-green flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onTaskAction(campaign.id, task.type)}
                        className="px-3 py-1.5 rounded-lg bg-bloom-purple text-white text-sm font-medium hover:opacity-90 transition-all"
                      >
                        Go
                      </button>
                      <button
                        onClick={() => onVerifyTask(campaign.id, task.type)}
                        className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-all"
                      >
                        Verify
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reward */}
        <div className="mb-4 p-3 rounded-xl bg-bloom-gold/10 border border-bloom-gold/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Your Reward</span>
            <span className="font-bold text-bloom-gold">
              ${(completedCount * campaign.rewardPerAction).toFixed(2)} USDC eq.
            </span>
          </div>
        </div>

        {/* Claim */}
        <button
          onClick={onClaim}
          disabled={!allTasksComplete}
          className={cn(
            'w-full py-4 rounded-xl font-display font-bold text-lg transition-all',
            allTasksComplete
              ? 'bloom-gradient-button text-white bloom-button-shadow hover:opacity-90 active:scale-[0.98]'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {allTasksComplete ? 'Claim Rewards' : `Complete ${campaign.tasks.length - completedCount} more actions`}
        </button>
      </div>
    </div>
  );
}
