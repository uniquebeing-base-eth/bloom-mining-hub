import { Rocket, Sparkles, Clock, ShieldCheck } from 'lucide-react';

export function BloomBoost() {
  return (
    <div className="min-h-screen bloom-gradient-bg pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex flex-col items-center py-4 px-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-bloom-pink" />
            <h1 className="text-lg font-display font-bold text-foreground">Bloom Boost</h1>
          </div>
          <p className="text-sm text-muted-foreground">Coming soon</p>
        </div>
      </header>

      <main className="px-4 py-10 max-w-md mx-auto">
        <section className="relative overflow-hidden bloom-card rounded-2xl p-6 border border-bloom-pink-light/20 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-bloom-pink/10 via-transparent to-bloom-purple/10 pointer-events-none" />
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-bloom-pink/10 border border-bloom-pink-light/20 flex items-center justify-center bloom-glow-pink">
              <Sparkles className="w-9 h-9 text-bloom-pink animate-pulse" />
            </div>
            <h2 className="text-2xl font-display font-black text-foreground mb-2">Boost campaigns are coming soon</h2>
            <p className="text-sm text-muted-foreground mb-6">
              stay positioned.
            </p>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="rounded-xl bg-secondary/50 border border-border p-3">
                <Clock className="w-4 h-4 text-bloom-gold mb-2" />
                <p className="text-xs font-semibold text-foreground"> blooming  🌸🌸</p>
                <p className="text-[11px] text-muted-foreground"> real rewards soon</p>
              </div>
              <div className="rounded-xl bg-secondary/50 border border-border p-3">
                <ShieldCheck className="w-4 h-4 text-bloom-green mb-2" />
                <p className="text-xs font-semibold text-foreground"> coming soon </p>
                <p className="text-[11px] text-muted-foreground">On-chain campaigns only</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
