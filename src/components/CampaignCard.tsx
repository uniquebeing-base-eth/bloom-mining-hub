import { Campaign, CampaignTask } from '@/types/bloom';
import { formatBloom } from '@/lib/bloom-utils';
import { Clock, Users, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignCardProps {
  campaign: Campaign;
  onViewDetails: (campaignId: string) => void;
}

export function CampaignCard({ campaign, onViewDetails }: CampaignCardProps) {
  return (
    <div className="bloom-card rounded-2xl p-4 border border-border">
      {/* Creator Info */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={campaign.creatorAvatar || '/placeholder.svg'}
          alt={campaign.creatorUsername}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="font-medium text-foreground">@{campaign.creatorUsername}</p>
          <p className="text-xs text-muted-foreground">🔗 warpcast.com</p>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          •••
        </button>
      </div>

      {/* Cast Content */}
      <p className="text-sm text-foreground mb-3 line-clamp-2">{campaign.castText}</p>

      {campaign.castImage && (
        <div className="relative mb-3 rounded-xl overflow-hidden">
          <img
            src={campaign.castImage}
            alt="Cast preview"
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{formatBloom(campaign.remainingPool)} remaining</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>{campaign.participants} participants</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Reward Pool:</span>
          <span className="text-sm font-bold text-foreground">{formatBloom(campaign.totalPool)} BLOOM</span>
        </div>
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          'bg-bloom-green/10 text-bloom-green'
        )}>
          +{campaign.boostMultiplier}x
        </span>
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: CampaignTask;
  onToggle: () => void;
}

export function TaskItem({ task, onToggle }: TaskItemProps) {
  const taskLabels: Record<CampaignTask['type'], string> = {
    like: 'Like',
    recast: 'Recast',
    follow: 'Follow',
    reply: 'Reply',
  };

  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center justify-between w-full p-3 rounded-xl transition-all',
        task.completed
          ? 'bg-bloom-green/10 border border-bloom-green/30'
          : 'bg-secondary border border-border hover:border-bloom-pink/30'
      )}
    >
      <span className="text-sm font-medium text-foreground">{taskLabels[task.type]}</span>
      <div className={cn(
        'w-5 h-5 rounded-md flex items-center justify-center',
        task.completed
          ? 'bg-bloom-green text-white'
          : 'border-2 border-muted-foreground'
      )}>
        {task.completed && <span className="text-xs">✓</span>}
      </div>
    </button>
  );
}
