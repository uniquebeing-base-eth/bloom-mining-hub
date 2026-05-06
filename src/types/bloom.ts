// Bloom Protocol Types

export interface BloomFlower {
  id: number;
  level: 1 | 2 | 3 | 4 | 5;
  isUnlocked: boolean;
  isBlooming: boolean;
}

export interface FlowerLevel {
  level: number;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  upgradeCost: number;
  successRate: number;
  dailyYield: number;
}

export const FLOWER_LEVELS: FlowerLevel[] = [
  { level: 1, name: 'Budding Bloom', rarity: 'Common', upgradeCost: 0, successRate: 100, dailyYield: 100 },
  { level: 2, name: 'Petal Pup', rarity: 'Common', upgradeCost: 10_000_000, successRate: 90, dailyYield: 20_000 },
  { level: 3, name: 'Leafy Lynx', rarity: 'Rare', upgradeCost: 30_000_000, successRate: 60, dailyYield: 60_000 },
  { level: 4, name: 'Floral Spirit', rarity: 'Rare', upgradeCost: 100_000_000, successRate: 30, dailyYield: 200_000 },
  { level: 5, name: 'Blossom Guardian', rarity: 'Epic', upgradeCost: 200_000_000, successRate: 15, dailyYield: 400_000 },
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
  farcasterFid: number | null;
  farcasterUsername: string | null;
}

export interface Campaign {
  id: string;
  creatorUsername: string;
  creatorAvatar: string;
  castText: string;
  castImage?: string;
  castLink?: string;
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

export const RARITY_COLORS: Record<string, string> = {
  Common: 'text-emerald-400',
  Rare: 'text-blue-400',
  Epic: 'text-purple-400',
  Legendary: 'text-amber-400',
};

export const RARITY_BG: Record<string, string> = {
  Common: 'bg-emerald-500/20 border-emerald-500/30',
  Rare: 'bg-blue-500/20 border-blue-500/30',
  Epic: 'bg-purple-500/20 border-purple-500/30',
  Legendary: 'bg-amber-500/20 border-amber-500/30',
};
