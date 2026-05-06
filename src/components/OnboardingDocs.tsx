import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Sparkles, Flower2, Ticket, Users, TrendingUp, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sdk } from '@farcaster/miniapp-sdk';
import { toast } from 'sonner';
import bloomLogo from '@/assets/bloom-logo.png';

interface OnboardingDocsProps {
  isOpen: boolean;
  onClose: () => void;
}

const slides = [
  {
    icon: '🌸',
    title: 'Welcome to Bloom Protocol',
    subtitle: 'Gamified Social Mining on Base',
    content: [
      'Mine BLOOM tokens passively with your Bloom Flowers',
      'Upgrade flowers to earn more — up to 400,000 BLOOM/day',
      'Win weekly jackpots with tickets you earn',
      'Invite friends and grow together',
    ],
    color: 'from-bloom-pink/20 to-bloom-purple/20',
  },
  {
    icon: '🌺',
    title: 'Bloom Flowers',
    subtitle: '4 Independent Flowers, 5 Levels Each',
    content: [
      'Start with 1 flower unlocked at Level 1',
      'Unlock more flowers for 100,000 BLOOM each',
      'Each flower mines independently — more flowers = more yield',
      'Upgrade flowers to increase daily mining rate',
    ],
    color: 'from-pink-500/20 to-rose-500/20',
  },
  {
    icon: '⛏️',
    title: 'Mining Yields',
    subtitle: 'Earn BLOOM Every Second',
    content: [
      'Level 1: 100 BLOOM/day',
      'Level 2: 20,000 BLOOM/day',
      'Level 3: 60,000 BLOOM/day',
      'Level 4: 200,000 BLOOM/day',
      'Level 5: 400,000 BLOOM/day',
    ],
    extra: '⚠️ Claim within 48 hours or unclaimed rewards are burned!',
    color: 'from-bloom-gold/20 to-amber-500/20',
  },
  {
    icon: '📈',
    title: 'Upgrades & Risk',
    subtitle: 'Higher Levels = Higher Risk & Reward',
    content: [
      'Lv2: 10M BLOOM (90% success)',
      'Lv3: 30M BLOOM (60% success)',
      'Lv4: 100M BLOOM (30% success)',
      'Lv5: 200M BLOOM (15% success)',
    ],
    extra: 'Failed upgrades: 85% burned, 15% goes to jackpot pool. Every attempt earns jackpot tickets!',
    color: 'from-blue-500/20 to-indigo-500/20',
  },
  {
    icon: '🎰',
    title: 'Weekly Jackpot',
    subtitle: '40 Winners Every Week',
    content: [
      'Earn tickets from upgrades, invites, and BLOOM holdings',
      'Holding 1M BLOOM = 1 ticket',
      'Snapshot Thursday, Drawing Friday',
      '7 prize tiers from Grand Prize (22%) to Tier 7 (8%)',
    ],
    color: 'from-bloom-gold/20 to-yellow-500/20',
  },
  {
    icon: '👥',
    title: 'Invite & Earn',
    subtitle: 'Grow the Bloom Community',
    content: [
      'Each user gets a unique on-chain invite code',
      'Share your code — friends paste it to onboard',
      'You earn 1 jackpot ticket per successful invite',
      'Unlimited invites available',
    ],
    color: 'from-bloom-purple/20 to-purple-500/20',
  },
  {
    icon: '🔔',
    title: 'Stay Connected',
    subtitle: 'Never Miss a Jackpot Draw',
    content: [
      'Add Bloom to your Farcaster apps for notifications',
      'Get alerts for jackpot draws and new features',
      'Tap the button below to enable notifications',
    ],
    isLastSlide: true,
    color: 'from-bloom-green/20 to-emerald-500/20',
  },
];

export function OnboardingDocs({ isOpen, onClose }: OnboardingDocsProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;
  const isFirst = currentSlide === 0;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleAddMiniApp = async () => {
    try {
      await sdk.actions.addMiniApp();
      toast.success('Bloom added to your apps! 🌸');
    } catch (err: any) {
      if (err?.message?.includes('RejectedByUser')) {
        toast.info('You can add it later from settings');
      } else {
        console.error('addMiniApp failed:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-sm mx-4 bg-card rounded-3xl overflow-hidden shadow-2xl animate-bloom">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Slide content */}
        <div className={cn('p-6 pt-8 bg-gradient-to-b', slide.color)}>
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-card/80 backdrop-blur flex items-center justify-center text-3xl shadow-lg">
              {slide.icon}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-display font-bold text-foreground text-center mb-1">
            {slide.title}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-5">
            {slide.subtitle}
          </p>
        </div>

        <div className="px-6 pb-6">
          {/* Content */}
          <ul className="space-y-2.5 mb-4 mt-4">
            {slide.content.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* Extra note */}
          {slide.extra && (
            <div className="p-3 rounded-xl bg-bloom-gold/10 border border-bloom-gold/20 mb-4">
              <p className="text-xs text-foreground">{slide.extra}</p>
            </div>
          )}

          {/* Add Mini App button on last slide */}
          {slide.isLastSlide && (
            <button
              onClick={handleAddMiniApp}
              className="w-full py-3 rounded-xl bloom-gradient-button text-white font-bold flex items-center justify-center gap-2 mb-4 bloom-button-shadow active:scale-[0.98] transition-transform"
            >
              <Bell className="w-4 h-4" />
              Add Bloom to Farcaster
            </button>
          )}

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={cn(
                  'rounded-full transition-all duration-300',
                  i === currentSlide
                    ? 'w-6 h-2 bg-primary'
                    : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className={cn(
                'flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                isFirst
                  ? 'text-muted-foreground/40 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-5 py-2 rounded-xl text-sm font-bold bloom-gradient-button text-white bloom-button-shadow active:scale-[0.98] transition-transform"
            >
              {isLast ? 'Get Started' : 'Next'}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
