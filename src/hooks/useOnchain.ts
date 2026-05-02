import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { base } from 'wagmi/chains';
import { CONTRACTS, BLOOM_FLOWERS_ABI, ERC20_ABI, BLOOM_JACKPOT_ABI, BLOOM_MINING_ABI } from '@/config/contracts';
import { FLOWER_LEVELS, UNLOCK_COST } from '@/types/bloom';
import { toast } from 'sonner';

export function useOnchainFlowers() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  // Read on-chain flower state
  const { data: onchainFlowers, refetch: refetchFlowers } = useReadContract({
    address: CONTRACTS.BLOOM_FLOWERS,
    abi: BLOOM_FLOWERS_ABI,
    functionName: 'getUserFlowers',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: hasOnboarded } = useReadContract({
    address: CONTRACTS.BLOOM_FLOWERS,
    abi: BLOOM_FLOWERS_ABI,
    functionName: 'hasOnboarded',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: tokenBalance } = useReadContract({
    address: CONTRACTS.BLOOM_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Approve BLOOM spending
  const approveBloom = async (amount: bigint) => {
    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_TOKEN,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.BLOOM_FLOWERS, amount],
        chain: base,
        account: address!,
      });
      toast.info('Approving BLOOM...');
      return tx;
    } catch (err) {
      console.error('Approve failed:', err);
      toast.error('Failed to approve BLOOM');
      throw err;
    }
  };

  // Check allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.BLOOM_TOKEN,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.BLOOM_FLOWERS] : undefined,
    query: { enabled: !!address },
  });

  // Unlock flower on-chain
  const unlockFlowerOnchain = async (flowerIndex: number) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }
    
    const cost = parseUnits(String(UNLOCK_COST), 18);
    
    // Check allowance first
    if (!allowance || allowance < cost) {
      await approveBloom(cost);
      await refetchAllowance();
    }

    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_FLOWERS,
        abi: BLOOM_FLOWERS_ABI,
        functionName: 'unlockFlower',
        args: [flowerIndex],
        chain: base,
        account: address!,
      });
      toast.success('Flower unlocked! 🌸');
      await refetchFlowers();
      return tx;
    } catch (err) {
      console.error('Unlock failed:', err);
      toast.error('Failed to unlock flower');
      throw err;
    }
  };

  // Upgrade flower on-chain
  const upgradeFlowerOnchain = async (flowerIndex: number, currentLevel: number) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    const nextLevel = currentLevel + 1;
    if (nextLevel > 5) {
      toast.error('Already max level');
      return;
    }

    const levelInfo = FLOWER_LEVELS[nextLevel - 1];
    const cost = parseUnits(String(levelInfo.upgradeCost), 18);

    // Check allowance first
    if (!allowance || allowance < cost) {
      await approveBloom(cost);
      await refetchAllowance();
    }

    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_FLOWERS,
        abi: BLOOM_FLOWERS_ABI,
        functionName: 'upgradeFlower',
        args: [flowerIndex],
        chain: base,
        account: address!,
      });
      toast.info('Upgrade rolling... 🎲');
      await refetchFlowers();
      return tx;
    } catch (err) {
      console.error('Upgrade failed:', err);
      toast.error('Upgrade transaction failed');
      throw err;
    }
  };

  return {
    address,
    onchainFlowers,
    hasOnboarded: hasOnboarded ?? false,
    tokenBalance,
    allowance,
    isPending,
    unlockFlowerOnchain,
    upgradeFlowerOnchain,
    refetchFlowers,
  };
}

export function useOnchainJackpot() {
  const { address } = useAccount();

  const { data: jackpotBalance } = useReadContract({
    address: CONTRACTS.BLOOM_JACKPOT,
    abi: BLOOM_JACKPOT_ABI,
    functionName: 'getJackpotBalance',
    query: { enabled: true },
  });

  const { data: userTickets } = useReadContract({
    address: CONTRACTS.BLOOM_JACKPOT,
    abi: BLOOM_JACKPOT_ABI,
    functionName: 'getUserTickets',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: participantCount } = useReadContract({
    address: CONTRACTS.BLOOM_JACKPOT,
    abi: BLOOM_JACKPOT_ABI,
    functionName: 'getParticipantCount',
    query: { enabled: true },
  });

  const { data: timeUntilDraw } = useReadContract({
    address: CONTRACTS.BLOOM_JACKPOT,
    abi: BLOOM_JACKPOT_ABI,
    functionName: 'getTimeUntilDraw',
    query: { enabled: true },
  });

  return {
    jackpotBalance: jackpotBalance ? Number(jackpotBalance / BigInt(1e18)) : 0,
    userTickets: userTickets ? Number(userTickets) : 0,
    participantCount: participantCount ? Number(participantCount) : 0,
    timeUntilDraw: timeUntilDraw ? Number(timeUntilDraw) : 0,
  };
}

export function useOnchainMining() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  // Read pending rewards from the mining contract
  const { data: pendingRewards, refetch: refetchPending } = useReadContract({
    address: CONTRACTS.BLOOM_MINING,
    abi: BLOOM_MINING_ABI,
    functionName: 'getPendingRewards',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });

  // Read on-chain daily yield
  const { data: onchainDailyYield } = useReadContract({
    address: CONTRACTS.BLOOM_MINING,
    abi: BLOOM_MINING_ABI,
    functionName: 'getDailyYield',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read last claim time
  const { data: lastClaimTime } = useReadContract({
    address: CONTRACTS.BLOOM_MINING,
    abi: BLOOM_MINING_ABI,
    functionName: 'lastClaimTime',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Claim mining rewards on-chain
  const claimMiningOnchain = async () => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_MINING,
        abi: BLOOM_MINING_ABI,
        functionName: 'claimMining',
        chain: base,
        account: address!,
      });
      toast.success('Mining rewards claimed! 🌸');
      await refetchPending();
      return tx;
    } catch (err) {
      console.error('Claim mining failed:', err);
      toast.error('Failed to claim mining rewards');
      throw err;
    }
  };

  const claimable = pendingRewards ? Number(formatUnits(pendingRewards[0], 18)) : 0;
  const wouldBeBurned = pendingRewards ? Number(formatUnits(pendingRewards[1], 18)) : 0;
  const dailyYield = onchainDailyYield ? Number(formatUnits(onchainDailyYield, 18)) : 0;

  return {
    claimable,
    wouldBeBurned,
    dailyYield,
    lastClaimTime: lastClaimTime ? Number(lastClaimTime) : 0,
    claimMiningOnchain,
    isPending,
    refetchPending,
  };
}
