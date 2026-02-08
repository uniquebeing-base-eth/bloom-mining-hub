import { useState } from 'react';
import { cn } from '@/lib/utils';
import bloomLogo from '@/assets/bloom-logo.png';

interface OnboardingScreenProps {
  onComplete: (inviteCode: string) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate validation delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // For demo purposes, accept any code
    onComplete(inviteCode);
  };

  return (
    <div className="min-h-screen bloom-gradient-bg flex flex-col items-center justify-center p-6">
      {/* Decorative clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-16 bg-white/30 rounded-full blur-2xl" />
        <div className="absolute top-20 right-10 w-48 h-24 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-5 w-40 h-20 bg-white/25 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={bloomLogo}
            alt="Bloom Protocol"
            className="w-24 h-24 rounded-3xl bloom-shadow mb-4 animate-bloom"
          />
          <h1 className="text-3xl font-display font-bold bloom-text-gradient">
            Bloom Protocol
          </h1>
          <p className="text-muted-foreground mt-2 text-center">
            Gamified social mining with Bloom Flowers
          </p>
        </div>

        {/* Invite Form */}
        <div className="bloom-card rounded-3xl p-6 border border-bloom-pink-light/30">
          <h2 className="text-xl font-display font-semibold text-foreground text-center mb-2">
            Enter Invite Code
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            You need an invite code to start mining
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="BLOOM-XXXX"
                className={cn(
                  'w-full px-4 py-4 rounded-xl text-center text-lg font-mono uppercase tracking-widest',
                  'bg-secondary border-2 transition-all placeholder:text-muted-foreground/50',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20',
                  error
                    ? 'border-destructive'
                    : 'border-transparent focus:border-bloom-pink'
                )}
                maxLength={12}
              />
              {error && (
                <p className="text-sm text-destructive text-center mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full py-4 rounded-xl font-display font-bold text-lg transition-all',
                'bloom-gradient-button text-white bloom-button-shadow',
                'hover:opacity-90 active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Start Mining 🌸'
              )}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Don't have an invite? Ask a friend or join our community.
          </p>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { emoji: '🌸', label: 'Mine BLOOM' },
            { emoji: '🚀', label: 'Boost Casts' },
            { emoji: '👁', label: 'Win Auctions' },
          ].map((feature) => (
            <div key={feature.label} className="flex flex-col items-center gap-2">
              <span className="text-2xl">{feature.emoji}</span>
              <span className="text-xs text-muted-foreground">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
