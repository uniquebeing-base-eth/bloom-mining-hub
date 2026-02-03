import { useState } from 'react';
import { X, DollarSign, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'bid' | 'support';
  bidderName?: string;
  balance: number;
  onSubmit: (amount: number) => void;
  existingBidAmount?: number; // For topping up existing bids
}

export function BidModal({ isOpen, onClose, type, bidderName, balance, onSubmit, existingBidAmount = 0 }: BidModalProps) {
  // Bid minimum is 10 USDC, Support minimum is 1 USDC
  const minAmount = type === 'bid' ? 10 : 1;
  const [amount, setAmount] = useState(minAmount);
  const canSupport = balance >= 10_000_000;

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(amount);
    onClose();
  };

  const incrementAmount = () => setAmount(prev => prev + 1);
  const decrementAmount = () => setAmount(prev => Math.max(minAmount, prev - 1));

  // Quick amount buttons differ for bid vs support
  const quickAmounts = type === 'bid' ? [10, 25, 50, 100] : [1, 5, 10, 25];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card rounded-2xl p-6 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-display font-bold text-foreground mb-2 text-center">
          {type === 'bid' ? (existingBidAmount > 0 ? 'Top Up Bid' : 'Join Bid') : 'Support Bid'}
        </h2>
        
        {type === 'support' && bidderName && (
          <p className="text-sm text-muted-foreground text-center mb-4">
            Supporting @{bidderName}
          </p>
        )}

        {type === 'bid' && existingBidAmount > 0 && (
          <p className="text-sm text-muted-foreground text-center mb-4">
            Current bid: ${existingBidAmount} USDC
          </p>
        )}

        {type === 'support' && !canSupport && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
            <p className="text-sm text-red-500 text-center">
              You need ≥10M BLOOM to support bids
            </p>
          </div>
        )}

        {/* Minimum notice */}
        <p className="text-xs text-muted-foreground text-center mb-4">
          Minimum: ${minAmount} USDC
        </p>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block text-center">
            Amount (USDC)
          </label>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={decrementAmount}
              disabled={amount <= minAmount}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                amount <= minAmount ? 'bg-muted text-muted-foreground' : 'bg-secondary hover:bg-secondary/80'
              )}
            >
              <Minus className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-bloom-green/20 border border-bloom-green/30">
              <DollarSign className="w-5 h-5 text-bloom-green" />
              <span className="text-2xl font-bold text-foreground">{amount}</span>
            </div>
            
            <button
              onClick={incrementAmount}
              className="w-12 h-12 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex gap-2 mb-6">
          {quickAmounts.map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                amount === val
                  ? 'bg-bloom-purple text-white'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              )}
            >
              ${val}
            </button>
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={type === 'support' && !canSupport}
          className={cn(
            'w-full py-4 rounded-xl font-display font-bold text-lg transition-all',
            (type === 'support' && !canSupport)
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bloom-gradient-button text-white bloom-button-shadow hover:opacity-90 active:scale-[0.98]'
          )}
        >
          {type === 'bid' 
            ? (existingBidAmount > 0 ? `Add $${amount} USDC` : `Join with $${amount} USDC`)
            : `Support with $${amount} USDC`
          }
        </button>
      </div>
    </div>
  );
}
