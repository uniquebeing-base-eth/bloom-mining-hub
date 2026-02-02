import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserState, BloomFlower, FLOWER_LEVELS, UNLOCK_COST } from '@/types/bloom';

interface BloomStore extends UserState {
  setOnboarded: (inviteCode: string) => void;
  claimBloom: () => void;
  unlockFlower: (flowerId: number) => boolean;
  upgradeFlower: (flowerId: number) => { success: boolean; burned: number; toJackpot: number };
  addTickets: (amount: number) => void;
  calculateTotalDailyYield: () => number;
  addBloom: (amount: number) => void;
  addUnclaimedBloom: (amount: number) => void;
  resetUnclaimedBloom: () => void;
}

const createInitialFlowers = (): BloomFlower[] => [
  { id: 1, level: 1, isUnlocked: true, isBlooming: true },
  { id: 2, level: 1, isUnlocked: false, isBlooming: false },
  { id: 3, level: 1, isUnlocked: false, isBlooming: false },
  { id: 4, level: 1, isUnlocked: false, isBlooming: false },
];

export const useBloomStore = create<BloomStore>()(
  persist(
    (set, get) => ({
      balance: 30_000_000, // Starting with 30M for testing upgrades
      flowers: createInitialFlowers(),
      hasOnboarded: false,
      inviteCode: null,
      invitesUsed: 0,
      invitesAvailable: 999999, // Unlimited invites
      jackpotTickets: 0,
      claimStreak: 0,
      lastClaimDate: null,
      boostMultiplier: 1,
      unclaimedBloom: 5000, // Starting with some unclaimed bloom for demo

      setOnboarded: (inviteCode: string) => {
        set({ hasOnboarded: true, inviteCode });
      },

      claimBloom: () => {
        const { unclaimedBloom, balance, lastClaimDate, claimStreak } = get();
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        let newStreak = 1;
        if (lastClaimDate === yesterday) {
          newStreak = claimStreak + 1;
        } else if (lastClaimDate === today) {
          newStreak = claimStreak;
        }

        set({
          balance: balance + unclaimedBloom,
          unclaimedBloom: 0,
          lastClaimDate: today,
          claimStreak: newStreak,
        });
      },

      unlockFlower: (flowerId: number) => {
        const { balance, flowers } = get();
        const flower = flowers.find((f) => f.id === flowerId);
        
        if (!flower || flower.isUnlocked || balance < UNLOCK_COST) {
          return false;
        }

        const updatedFlowers = flowers.map((f) =>
          f.id === flowerId ? { ...f, isUnlocked: true, isBlooming: true } : f
        );

        set({
          balance: balance - UNLOCK_COST,
          flowers: updatedFlowers,
        });

        return true;
      },

      upgradeFlower: (flowerId: number) => {
        const { balance, flowers, jackpotTickets } = get();
        const flower = flowers.find((f) => f.id === flowerId);
        
        if (!flower || !flower.isUnlocked || !flower.isBlooming || flower.level >= 5) {
          return { success: false, burned: 0, toJackpot: 0 };
        }

        const nextLevel = flower.level + 1;
        const levelInfo = FLOWER_LEVELS[nextLevel - 1];
        
        if (balance < levelInfo.upgradeCost) {
          return { success: false, burned: 0, toJackpot: 0 };
        }

        const roll = Math.random() * 100;
        const success = roll <= levelInfo.successRate;

        let burned = 0;
        let toJackpot = 0;
        let newTickets = jackpotTickets;

        // Add tickets for upgrade attempt
        const ticketsEarned = { 2: 20, 3: 30, 4: 40, 5: 50 }[nextLevel] || 0;
        newTickets += ticketsEarned;

        if (success) {
          // 95% to protocol, 5% to jackpot
          toJackpot = levelInfo.upgradeCost * 0.05;
          const updatedFlowers = flowers.map((f) =>
            f.id === flowerId ? { ...f, level: nextLevel as 1 | 2 | 3 | 4 | 5 } : f
          );
          set({
            balance: balance - levelInfo.upgradeCost,
            flowers: updatedFlowers,
            jackpotTickets: newTickets,
          });
        } else {
          // 85% burned, 15% to jackpot
          burned = levelInfo.upgradeCost * 0.85;
          toJackpot = levelInfo.upgradeCost * 0.15;
          set({
            balance: balance - levelInfo.upgradeCost,
            jackpotTickets: newTickets,
          });
        }

        return { success, burned, toJackpot };
      },

      addTickets: (amount: number) => {
        set((state) => ({ jackpotTickets: state.jackpotTickets + amount }));
      },

      calculateTotalDailyYield: () => {
        const { flowers, boostMultiplier } = get();
        return flowers
          .filter((f) => f.isUnlocked && f.isBlooming)
          .reduce((total, flower) => {
            const levelInfo = FLOWER_LEVELS[flower.level - 1];
            return total + levelInfo.dailyYield;
          }, 0) * boostMultiplier;
      },

      addBloom: (amount: number) => {
        set((state) => ({ balance: state.balance + amount }));
      },

      addUnclaimedBloom: (amount: number) => {
        set((state) => ({ unclaimedBloom: state.unclaimedBloom + amount }));
      },

      resetUnclaimedBloom: () => {
        set({ unclaimedBloom: 0 });
      },
    }),
    {
      name: 'bloom-storage',
    }
  )
);
