import { cn } from '@/lib/utils';
import { Flower2, Rocket, Eye } from 'lucide-react';

type Tab = 'mining' | 'boost' | 'see';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs = [
  { id: 'mining' as Tab, label: 'Bloom Mining', icon: Flower2, emoji: '🌸' },
  { id: 'boost' as Tab, label: 'Bloom Boost', icon: Rocket, emoji: '🚀' },
  { id: 'see' as Tab, label: 'Bloom & See', icon: Eye, emoji: '👁' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-primary scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className={cn(
                'text-xs font-medium transition-all',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {tab.label.split(' ').slice(-1)[0]}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
