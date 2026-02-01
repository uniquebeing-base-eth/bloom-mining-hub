// Bloom Protocol Types

export interface BloomFlower {
  id: number;
  level: 1 | 2 | 3 | 4 | 5;
  isUnlocked: boolean;
  isBlooming: boolean;
}

export interface FlowerLevel {
  level: number;
  upgradeCost: number;
  successRate: number;
  dailyYield: number;
}

export const FLOWER_LEVELS: FlowerLevel[] = [
  { level: 1, upgradeCost: 0, successRate: 100, dailyYield: 1000 },
  { level: 2, upgradeCost: 10_000_000, successRate: 90, dailyYield: 100_000 },
  { level: 3, upgradeCost: 30_000_000, successRate: 60, dailyYield: 300_000 },
  { level: 4, upgradeCost: 100_000_000, successRate: 30, dailyYield: 1_000_000 },
  { level: 5, upgradeCost: 200_000_000, successRate: 15, dailyYield: 2_000_000 },
];

export const UNLOCK_COST = 100_000;

export interface UserState {
  balance: number;
  flowers: BloomFlower[];
  hasOnboarded: boolean;
  inviteCode: string | null;
  invitesUsed: number;
  invitesAvailable: number;
  jackpotTickets: number;
  claimStreak: number;
  lastClaimDate: string | null;
  boostMultiplier: number;
  unclaimedBloom: number;
}

export interface Campaign {
  id: string;
  creatorUsername: string;
  creatorAvatar: string;
  castText: string;
  castImage?: string;
  remainingPool: number;
  totalPool: number;
  rewardPerAction: number;
  boostMultiplier: number;
  participants: number;
  tasks: CampaignTask[];
}

export interface CampaignTask {
  type: 'like' | 'recast' | 'follow' | 'reply';
  completed: boolean;
}

export interface AuctionBid {
  id: string;
  username: string;
  avatar?: string;
  bidAmount: number;
  supportCount: number;
  isLeader: boolean;
}

export interface FeaturedAuction {
  id: string;
  username: string;
  avatar?: string;
  link: string;
  title: string;
  description: string;
  image?: string;
  visits: number;
  endsAt: Date;
  claimableBloom: number;
}

export interface JackpotTier {
  tier: number;
  winners: number;
  poolPercentage: number;
}

export const JACKPOT_TIERS: JackpotTier[] = [
  { tier: 1, winners: 1, poolPercentage: 22 },
  { tier: 2, winners: 2, poolPercentage: 18 },
  { tier: 3, winners: 3, poolPercentage: 15 },
  { tier: 4, winners: 5, poolPercentage: 14 },
  { tier: 5, winners: 7, poolPercentage: 12 },
  { tier: 6, winners: 10, poolPercentage: 11 },
  { tier: 7, winners: 12, poolPercentage: 8 },
];

export const UPGRADE_TICKETS: Record<number, number> = {
  2: 20,
  3: 30,
  4: 40,
  5: 50,
};
