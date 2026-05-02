// Bloom Protocol Contract Addresses (Base Mainnet)
export const CONTRACTS = {
  BLOOM_TOKEN: '0xa07e759da6b3d4d75ed76f92fbcb867b9c145b07' as `0x${string}`,
  BLOOM_FLOWERS: '0x0320401eF50e5816a8091Fa52ed53Ac1cD00d110' as `0x${string}`,
  BLOOM_MINING: '0xaa75Becc8C2c4F68f7eE34C1f933F3d27B80b090' as `0x${string}`,
  BLOOM_JACKPOT: '0xa520b30f0b1B0345181eBb2cCC020fa52aB6795d' as `0x${string}`,
  DEAD_ADDRESS: '0x000000000000000000000000000000000000dEaD' as `0x${string}`,
} as const;

// Base chain ID
export const BASE_CHAIN_ID = 8453;

// BloomFlowers ABI (relevant functions only)
export const BLOOM_FLOWERS_ABI = [
  {
    inputs: [{ name: 'inviteCode', type: 'bytes32' }],
    name: 'onboard',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'flowerIndex', type: 'uint8' }],
    name: 'unlockFlower',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'flowerIndex', type: 'uint8' }],
    name: 'upgradeFlower',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserFlowers',
    outputs: [
      {
        components: [
          { name: 'level', type: 'uint8' },
          { name: 'unlocked', type: 'bool' },
          { name: 'lastClaim', type: 'uint256' },
        ],
        name: '',
        type: 'tuple[4]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'hasOnboarded',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getHighestFlowerLevel',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ERC20 ABI (approve)
export const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// BloomJackpot ABI (relevant functions)
export const BLOOM_JACKPOT_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserTickets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getJackpotBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getParticipantCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTimeUntilDraw',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimTickets',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
