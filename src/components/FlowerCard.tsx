import { cn } from '@/lib/utils';
import { BloomFlower, FLOWER_LEVELS, UNLOCK_COST } from '@/types/bloom';
import { getFlowerEmoji } from '@/lib/bloom-utils';
import { Lock, Sparkles, TrendingUp } from 'lucide-react';

function formatFullNumber(n: number): string {
  return Math.floor(n).toLocaleString('en-US');
}

interface FlowerCardProps {
  flower: BloomFlower;
  onUnlock: (flowerId: number) => void;
  onUpgrade: (flowerId: number) => void;
  canUnlock: boolean;
  canUpgrade: boolean;
}

export function FlowerCard({ flower, onUnlock, onUpgrade, canUnlock, canUpgrade }: FlowerCardProps) {
  const levelInfo = FLOWER_LEVELS[flower.level - 1];
  const nextLevelInfo = flower.level < 5 ? FLOWER_LEVELS[flower.level] : null;
  
  const isLocked = !flower.isUnlocked;
  
  return (
    <div
      className={cn(
        'relative rounded-2xl p-4 transition-all duration-300',
        isLocked
          ? 'bg-muted/50 opacity-70'
          : 'bloom-card border border-bloom-pink-light/30'
      )}
    >
      {/* Level Badge */}
      <div className={cn(
        'absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
        isLocked
          ? 'bg-muted text-muted-foreground'
          : 'bg-gradient-to-br from-bloom-pink to-bloom-purple text-white'
      )}>
        {flower.level}
      </div>

      {/* Flower Emoji */}
      <div className={cn(
        'text-4xl text-center mb-2 transition-transform',
        flower.isBlooming && 'animate-float'
      )}>
        {getFlowerEmoji(flower.level, flower.isUnlocked)}
      </div>

      {/* Level Label */}
      <p className="text-center text-sm font-medium text-foreground mb-1">
        Lvl {flower.level}
      </p>

      {/* Daily Yield or Lock Status */}
      {isLocked ? (
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">Locked</p>
          <button
            onClick={() => onUnlock(flower.id)}
            disabled={!canUnlock}
            className={cn(
              'w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-all',
              canUnlock
                ? 'bg-bloom-purple text-white hover:bg-bloom-purple-dark'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            <Lock className="w-3 h-3 inline mr-1" />
            {formatBloom(UNLOCK_COST)}
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-bloom-gold mb-2">
            <Sparkles className="w-3 h-3" />
            <span className="text-xs font-medium">{formatBloom(levelInfo.dailyYield)}/day</span>
          </div>
          
          {nextLevelInfo && (
            <button
              onClick={() => onUpgrade(flower.id)}
              disabled={!canUpgrade}
              className={cn(
                'w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-all',
                canUpgrade
                  ? 'bloom-gradient-button text-white bloom-button-shadow hover:opacity-90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Upgrade ({nextLevelInfo.successRate}%)
            </button>
          )}
          
          {flower.level === 5 && (
            <div className="flex items-center justify-center gap-1 text-bloom-green">
              <span className="text-xs font-bold">MAX LEVEL</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
