import flowerLvl1 from '@/assets/flowers/flower-lvl1.png';
import flowerLvl2 from '@/assets/flowers/flower-lvl2.png';
import flowerLvl3 from '@/assets/flowers/flower-lvl3.png';
import flowerLvl4 from '@/assets/flowers/flower-lvl4.png';
import flowerLvl5 from '@/assets/flowers/flower-lvl5.png';

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

export const FLOWER_IMAGES: Record<number, string> = {
  1: flowerLvl1,
  2: flowerLvl2,
  3: flowerLvl3,
  4: flowerLvl4,
  5: flowerLvl5,
};

export function getFlowerImage(level: number): string {
  return FLOWER_IMAGES[level] || flowerLvl1;
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
  return dailyYield / 24;
}

// Simple sound effects using Web Audio API
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  if (!audioCtx) return;
  try {
    audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function playUpgradeSuccess() {
  if (!audioCtx) return;
  playTone(523, 0.15, 'sine', 0.12);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 100);
  setTimeout(() => playTone(784, 0.15, 'sine', 0.12), 200);
  setTimeout(() => playTone(1047, 0.3, 'sine', 0.15), 300);
}

export function playUpgradeFail() {
  if (!audioCtx) return;
  playTone(400, 0.2, 'sawtooth', 0.08);
  setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.08), 150);
  setTimeout(() => playTone(200, 0.5, 'sawtooth', 0.06), 300);
}

export function playClick() {
  playTone(800, 0.05, 'sine', 0.06);
}

export function playClaim() {
  if (!audioCtx) return;
  playTone(600, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(900, 0.1, 'sine', 0.1), 80);
  setTimeout(() => playTone(1200, 0.2, 'sine', 0.12), 160);
}

export function playUnlock() {
  if (!audioCtx) return;
  for (let i = 0; i < 5; i++) {
    setTimeout(() => playTone(400 + i * 150, 0.15, 'sine', 0.1), i * 80);
  }
}
