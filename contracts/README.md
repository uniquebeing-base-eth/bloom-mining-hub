# Bloom Protocol Smart Contracts

## Live Contract Addresses (Base Mainnet)

| Contract | Address |
|----------|---------|
| **BLOOM Token** | `0xa07e759da6b3d4d75ed76f92fbcb867b9c145b07` |
| **BloomJackpot** | `0xa520b30f0b1B0345181eBb2cCC020fa52aB6795d` |
| **BloomFlowers** | `0x0320401eF50e5816a8091Fa52ed53Ac1cD00d110` |
| **BloomMining** | 0xaa75Becc8C2c4F68f7eE34C1f933F3d27B80b090 |
| **BloomBoostAndSee** | *Not yet deployed* |

## Post-Deployment Setup

After deploying BloomJackpot and BloomFlowers, link them:
```
BloomJackpot.setFlowersContract(0x0320401eF50e5816a8091Fa52ed53Ac1cD00d110)
```

## Deployment Order

1. ✅ **Deploy BloomJackpot** with:
   - `_bloomToken`: `0xa07e759da6b3d4d75ed76f92fbcb867b9c145b07`
   - `_flowersContract`: `0x0000000000000000000000000000000000000000` (placeholder)
2. ✅ **Deploy BloomFlowers** with:
   - `_bloomToken`: `0xa07e759da6b3d4d75ed76f92fbcb867b9c145b07`
   - `_jackpotContract`: `0xa520b30f0b1B0345181eBb2cCC020fa52aB6795d`
   - `_protocolTreasury`: Your treasury wallet
3. ✅ **Link contracts**: `BloomJackpot.setFlowersContract(0x0320401eF50e5816a8091Fa52ed53Ac1cD00d110)`
4. ⬜ **Deploy BloomMining** with:
   - `_bloomToken`: `0xa07e759da6b3d4d75ed76f92fbcb867b9c145b07`
   - `_flowersContract`: `0x0320401eF50e5816a8091Fa52ed53Ac1cD00d110`
5. ⬜ **Deploy BloomBoostAndSee** with:
   - `_bloomToken`: `0xa07e759da6b3d4d75ed76f92fbcb867b9c145b07`
   - `_usdcToken`: Base USDC address (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
   - `_flowersContract`: `0x0320401eF50e5816a8091Fa52ed53Ac1cD00d110`
   - `_jackpotContract`: `0xa520b30f0b1B0345181eBb2cCC020fa52aB6795d`
   - `_buybackAddress`: Your buyback wallet
   - `_protocolTreasury`: Your treasury wallet

## Overview

Bloom Protocol is a gamified social mining protocol built on Base. These contracts manage:
- Flower-based mining with upgrades
- Weekly jackpot with ticket system
- Boost campaigns for social engagement
- See auctions for featured links

## Contract Architecture

### 1. BloomFlowers.sol
Manages user flowers (4 per user) with unlock and upgrade mechanics.

**Upgrade Economics:**
| Level | Cost | Success Rate | On Success | On Failure |
|-------|------|--------------|------------|------------|
| 1→2 | 10M | 90% | 95% protocol, 5% jackpot | 85% burned, 15% jackpot |
| 2→3 | 30M | 60% | 95% protocol, 5% jackpot | 85% burned, 15% jackpot |
| 3→4 | 100M | 30% | 95% protocol, 5% jackpot | 85% burned, 15% jackpot |
| 4→5 | 200M | 15% | 95% protocol, 5% jackpot | 85% burned, 15% jackpot |

### 2. BloomJackpot.sol
Weekly jackpot with 40 winners across 7 tiers.

### 3. BloomMining.sol
Handles passive BLOOM mining based on flower levels.

### 4. BloomBoostAndSee.sol
Manages campaigns and auctions.

## Security Considerations

- All contracts use ReentrancyGuard
- Pausable for emergency stops
- Ownable for admin functions
- VRF recommended for production randomness
- All parameters are configurable

## License

MIT
