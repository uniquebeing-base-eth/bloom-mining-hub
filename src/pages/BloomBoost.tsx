import { useState } from 'react';
import { CampaignCard } from '@/components/CampaignCard';
import { Campaign, CampaignTask } from '@/types/bloom';
import { cn } from '@/lib/utils';
import { Plus, Rocket, Check } from 'lucide-react';
import { toast } from 'sonner';

// Demo campaigns
const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    creatorUsername: 'dave',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dave',
    castText: "Bitcoin breaks $70k! Where do you think it's headed next? 🚀",
    castImage: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=200&fit=crop',
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

export function BloomBoost() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaigns] = useState<Campaign[]>(DEMO_CAMPAIGNS);

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
                onViewDetails={(id) => toast.info(`Viewing campaign ${id}`)}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateBoostModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

interface CreateBoostModalProps {
  onClose: () => void;
}

function CreateBoostModal({ onClose }: CreateBoostModalProps) {
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
    toast.success('Bloom Boost created! 🚀', {
      description: 'Your campaign is now live.',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-t-3xl p-6 pb-10 animate-bloom">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-bloom-pink" />
            <h2 className="text-lg font-display font-bold text-foreground">Bloom Boost</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">Amplify attention. Accelerate mining.</p>

        {/* Cast Link Input */}
        <div className="mb-6">
          <input
            type="text"
            value={castLink}
            onChange={(e) => setCastLink(e.target.value)}
            placeholder="Paste Farcaster cast link..."
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
        <div className="mb-6 p-4 rounded-xl bg-secondary">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Budget</span>
            <span className="text-lg font-bold text-foreground">
              {parseInt(budget).toLocaleString()} BLOOM
            </span>
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-3 mb-6">
          {(['like', 'recast', 'follow', 'reply'] as const).map((task) => (
            <button
              key={task}
              onClick={() => setTasks((prev) => ({ ...prev, [task]: !prev[task] }))}
              className={cn(
                'flex items-center justify-between w-full p-3 rounded-xl transition-all',
                tasks[task]
                  ? 'bg-bloom-green/10 border border-bloom-green/30'
                  : 'bg-secondary border border-border'
              )}
            >
              <span className="text-sm font-medium text-foreground capitalize">{task}</span>
              <div className={cn(
                'w-5 h-5 rounded-md flex items-center justify-center',
                tasks[task]
                  ? 'bg-bloom-green text-white'
                  : 'border-2 border-muted-foreground'
              )}>
                {tasks[task] && <Check className="w-3 h-3" />}
              </div>
            </button>
          ))}
        </div>

        {/* Effects */}
        <div className="mb-6 p-4 rounded-xl bg-bloom-purple/10 border border-bloom-purple/20">
          <p className="text-sm font-medium text-foreground mb-2">Campaign Effects</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Mining boost: 1.5x – 5x</li>
            <li>• +3 jackpot tickets</li>
            <li>• Rewards escrowed</li>
          </ul>
        </div>

        {/* Launch Button */}
        <button
          onClick={handleLaunch}
          className="w-full py-4 rounded-xl bloom-gradient-button text-white font-display font-bold text-lg bloom-button-shadow hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Launch Bloom Boost
        </button>
      </div>
    </div>
  );
}
