export function formatBloom(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toLocaleString();
}

export function formatNumber(amount: number): string {
  return amount.toLocaleString();
}

export function formatTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'Ended';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

export function getFlowerEmoji(level: number, isUnlocked: boolean): string {
  if (!isUnlocked) return '🔒';
  
  const emojis: Record<number, string> = {
    1: '🌸',
    2: '🌺',
    3: '🌷',
    4: '💐',
    5: '🌹',
  };
  
  return emojis[level] || '🌸';
}

export function calculateMiningRate(dailyYield: number): number {
  // Returns BLOOM per hour
  return dailyYield / 24;
}
