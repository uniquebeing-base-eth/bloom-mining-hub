# Bloom Protocol Smart Contracts

## Overview

Bloom Protocol is a gamified social mining protocol built on Base. These contracts manage:
- Flower-based mining with upgrades
- Weekly jackpot with ticket system
- Boost campaigns for social engagement
- See auctions for featured links

## Contract Architecture

### 1. BloomFlowers.sol
Manages user flowers (4 per user) with unlock and upgrade mechanics.

**Key Functions:**
- `onboard(bytes32 inviteCode)` - Initialize user with invite code
- `unlockFlower(uint8 flowerIndex)` - Unlock flower for 100K BLOOM
- `upgradeFlower(uint8 flowerIndex)` - Upgrade flower level (1→5)

**Upgrade Economics:**
| Level | Cost | Success Rate | On Success | On Failure |
|-------|------|--------------|------------|------------|
| 1→2 | 10M | 90% | 95% protocol, 5% jackpot | 85% burned, 15% jackpot |
| 2→3 | 30M | 60% | 95% protocol, 5% jackpot | 85% burned, 15% jackpot |
| 3→4 | 100M | 30% | 95% protocol, 5% jackpot | 85% burned, 15% jackpot |
| 4→5 | 200M | 15% | 95% protocol, 5% jackpot | 85% burned, 15% jackpot |

### 2. BloomMining.sol
Handles passive BLOOM mining based on flower levels.

**Daily Yields:**
| Level | Daily Yield |
|-------|-------------|
| 1 | 1,000 BLOOM |
| 2 | 100,000 BLOOM |
| 3 | 300,000 BLOOM |
| 4 | 1,000,000 BLOOM |
| 5 | 2,000,000 BLOOM |

**Rules:**
- Unclaimed rewards after 48 hours are burned
- Mining rate calculated per second

### 3. BloomJackpot.sol
Weekly jackpot with 40 winners across 7 tiers.

**Ticket Sources:**
- Invites: 1 ticket per invite
- Holdings: 1 ticket per 1M BLOOM
- Upgrades: 20-50 tickets based on level
- 7-day streak: 2 tickets

**Prize Distribution:**
| Tier | Winners | Pool % |
|------|---------|--------|
| 1 | 1 | 22% |
| 2 | 2 | 18% |
| 3 | 3 | 15% |
| 4 | 5 | 14% |
| 5 | 7 | 12% |
| 6 | 10 | 11% |
| 7 | 12 | 8% |

**Weekly Flow:**
- Thursday: Claim tickets (snapshot)
- Friday: Draw winners
- Winners excluded from next week

### 4. BloomBoostAndSee.sol
Manages campaigns and auctions.

**Campaign Rewards:**
| Flower Level | Multiplier | Reward |
|--------------|------------|--------|
| 1 | 1x | $0.02 |
| 2 | 2x | $0.04 |
| 3 | 3x | $0.06 |
| 4 | 4x | $0.08 |
| 5 | 5x | $0.10 |

**Auction Rules:**
- Minimum bid: 10 USDC
- Minimum support: 1 USDC
- Support requires 10M BLOOM balance
- 24-hour auction cycles
- Losing bids refunded

## Deployment

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Base
npx hardhat run scripts/deploy.js --network base
```

## Deployment Order

1. Deploy BloomToken (or use existing)
2. Deploy BloomJackpot
3. Deploy BloomFlowers (with jackpot address)
4. Deploy BloomMining (with flowers address)
5. Deploy BloomBoostAndSee (with all addresses)
6. Configure cross-references

## Security Considerations

- All contracts use ReentrancyGuard
- Pausable for emergency stops
- Ownable for admin functions
- VRF recommended for production randomness
- All parameters are configurable

## Testing

```solidity
// Test upgrade success/failure
it("should upgrade flower with correct probability")

// Test ticket math
it("should calculate tickets correctly")

// Test jackpot draw
it("should distribute prizes to 40 winners")

// Test campaign exhaustion
it("should end campaign when pool is empty")
```

## License

MIT
