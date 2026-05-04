import { cn } from '@/lib/utils';
import { BloomFlower, FLOWER_LEVELS, UNLOCK_COST, RARITY_COLORS, RARITY_BG } from '@/types/bloom';
import { getFlowerImage } from '@/lib/bloom-utils';
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
        'relative rounded-2xl overflow-hidden transition-all duration-500 group',
        isLocked
          ? 'bg-muted/30 opacity-60'
          : 'bloom-card border border-bloom-pink-light/20 hover:border-bloom-pink-light/50'
      )}
    >
      {/* Glow effect for unlocked flowers */}
      {!isLocked && (
        <div className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none',
          flower.level >= 4 ? 'bg-gradient-to-t from-purple-500/10 via-transparent to-transparent' :
          flower.level >= 3 ? 'bg-gradient-to-t from-blue-500/10 via-transparent to-transparent' :
          'bg-gradient-to-t from-pink-500/10 via-transparent to-transparent'
        )} />
      )}

      {/* Level Badge */}
      <div className={cn(
        'absolute top-1.5 left-1.5 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold border',
        isLocked ? 'bg-muted text-muted-foreground border-border' :
        RARITY_BG[levelInfo.rarity]
      )}>
        <span className={isLocked ? '' : RARITY_COLORS[levelInfo.rarity]}>
          Lv{flower.level}
        </span>
      </div>

      <div className="p-2.5 pt-7">
        {/* Flower Image */}
        <div className={cn(
          'relative w-full aspect-square rounded-xl overflow-hidden mb-2 flex items-center justify-center',
          isLocked ? 'bg-muted/50' : 'bg-gradient-to-b from-transparent to-bloom-pink/5'
        )}>
          {isLocked ? (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Lock className="w-6 h-6" />
              <span className="text-[10px]">Locked</span>
            </div>
          ) : (
            <img
              src={getFlowerImage(flower.level)}
              alt={levelInfo.name}
              className={cn(
                'w-full h-full object-contain transition-transform duration-700',
                flower.isBlooming && 'animate-float group-hover:scale-110'
              )}
              loading="lazy"
            />
          )}

          {/* Sparkle particles for high levels */}
          {!isLocked && flower.level >= 3 && (
            <>
              <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-bloom-gold animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute bottom-2 left-1 w-1 h-1 rounded-full bg-bloom-pink animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
              <div className="absolute top-3 left-2 w-0.5 h-0.5 rounded-full bg-bloom-purple-light animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
            </>
          )}
        </div>

        {/* Name & Rarity */}
        {!isLocked && (
          <div className="text-center mb-1.5">
            <p className="text-[11px] font-bold text-foreground leading-tight">{levelInfo.name}</p>
            <p className={cn('text-[9px] font-medium', RARITY_COLORS[levelInfo.rarity])}>
              {levelInfo.rarity}
            </p>
          </div>
        )}

        {/* Daily Yield */}
        {isLocked ? (
          <button
            onClick={() => onUnlock(flower.id)}
            disabled={!canUnlock}
            className={cn(
              'w-full py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all',
              canUnlock
                ? 'bg-bloom-purple text-white hover:bg-bloom-purple-dark active:scale-95 bloom-glow-purple'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            <Lock className="w-2.5 h-2.5 inline mr-0.5" />
            {formatFullNumber(UNLOCK_COST)}
          </button>
        ) : (
          <div className="text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1 text-bloom-gold">
              <Sparkles className="w-2.5 h-2.5" />
              <span className="text-[10px] font-bold">{formatFullNumber(levelInfo.dailyYield)}/day</span>
            </div>
            
            {nextLevelInfo ? (
              <button
                onClick={() => onUpgrade(flower.id)}
                disabled={!canUpgrade}
                className={cn(
                  'w-full py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all',
                  canUpgrade
                    ? 'bloom-gradient-button text-white bloom-button-shadow hover:opacity-90 active:scale-95 bloom-glow-pink'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                <TrendingUp className="w-2.5 h-2.5 inline mr-0.5" />
                Upgrade ({nextLevelInfo.successRate}%)
              </button>
            ) : (
              <div className="py-1.5 px-2 rounded-lg bg-bloom-gold/20 border border-bloom-gold/30">
                <span className="text-[10px] font-bold text-bloom-gold">✨ MAX LEVEL</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
