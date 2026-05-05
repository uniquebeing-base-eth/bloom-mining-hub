import { useAccount, usePublicClient, useReadContract, useWriteContract } from 'wagmi';
import { parseUnits, formatUnits, stringToHex, decodeEventLog, type Hash, type TransactionReceipt } from 'viem';
import { base } from 'wagmi/chains';
import { CONTRACTS, CONTRACT_DEPLOYMENT_BLOCKS, BLOOM_FLOWERS_ABI, ERC20_ABI, BLOOM_JACKPOT_ABI, BLOOM_MINING_ABI } from '@/config/contracts';
import { FLOWER_LEVELS, UNLOCK_COST } from '@/types/bloom';
import { toast } from 'sonner';

export interface UpgradeOnchainResult {
  hash: Hash;
  status: TransactionReceipt['status'];
  success: boolean;
  newLevel: number;
  ticketDelta: number;
  burned: number;
  toJackpot: number;
  toProtocol: number;
}

export function useOnchainFlowers() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: base.id });
  const { writeContractAsync, isPending } = useWriteContract();

  // Read on-chain flower state
  const { data: onchainFlowers, refetch: refetchFlowers } = useReadContract({
    address: CONTRACTS.BLOOM_FLOWERS,
    abi: BLOOM_FLOWERS_ABI,
    functionName: 'getUserFlowers',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: hasOnboarded, refetch: refetchOnboarded } = useReadContract({
    address: CONTRACTS.BLOOM_FLOWERS,
    abi: BLOOM_FLOWERS_ABI,
    functionName: 'hasOnboarded',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read user's on-chain invite code
  const { data: userInviteCode } = useReadContract({
    address: CONTRACTS.BLOOM_FLOWERS,
    abi: BLOOM_FLOWERS_ABI,
    functionName: 'userInviteCode',
    args: address ? [address] : undefined,
    query: { enabled: !!address && hasOnboarded === true },
  });

  const { data: tokenBalance } = useReadContract({
    address: CONTRACTS.BLOOM_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: configuredJackpotContract } = useReadContract({
    address: CONTRACTS.BLOOM_FLOWERS,
    abi: BLOOM_FLOWERS_ABI,
    functionName: 'jackpotContract',
    query: { enabled: true },
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
      toast.info('Upgrade submitted — waiting for confirmation...');

      if (!publicClient) {
        await refetchFlowers();
        return {
          hash: tx,
          status: 'success',
          success: false,
          newLevel: currentLevel,
          ticketDelta: 0,
          burned: 0,
          toJackpot: 0,
          toProtocol: 0,
        } satisfies UpgradeOnchainResult;
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      const upgradeLog = receipt.logs
        .map((log) => {
          try {
            const rawLog = log as any;
            return decodeEventLog({ abi: BLOOM_FLOWERS_ABI, data: rawLog.data, topics: rawLog.topics });
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.eventName === 'FlowerUpgraded' &&
          String((event.args as any).user).toLowerCase() === address.toLowerCase()) as any;

      const eventArgs = upgradeLog?.args as any;
      const wasSuccessful = Boolean(eventArgs?.success);
      const confirmedLevel = eventArgs?.newLevel ? Number(eventArgs.newLevel) : currentLevel;
      const ticketDelta = 0;

      await refetchFlowers();
      toast[wasSuccessful ? 'success' : 'warning'](
        wasSuccessful ? `Upgrade confirmed: Level ${confirmedLevel}!` : `Upgrade confirmed: stayed Level ${confirmedLevel}`,
        { description: ticketDelta > 0 ? `+${ticketDelta} jackpot tickets` : 'No ticket event was emitted by the current Flower contract.' }
      );

      return {
        hash: tx,
        status: receipt.status,
        success: wasSuccessful,
        newLevel: confirmedLevel,
        ticketDelta,
        burned: eventArgs?.burned ? Number(formatUnits(eventArgs.burned, 18)) : 0,
        toJackpot: eventArgs?.toJackpot ? Number(formatUnits(eventArgs.toJackpot, 18)) : 0,
        toProtocol: eventArgs?.toProtocol ? Number(formatUnits(eventArgs.toProtocol, 18)) : 0,
      } satisfies UpgradeOnchainResult;
    } catch (err) {
      console.error('Upgrade failed:', err);
      toast.error('Upgrade transaction failed');
      throw err;
    }
  };

  // Onboard on-chain with invite code
  const onboardOnchain = async (inviteCode: string) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    // If the code is already a bytes32 hex string, use it directly
    // Otherwise convert from string (for BLOOM2025 admin code)
    const codeBytes32: `0x${string}` = inviteCode.startsWith('0x') && inviteCode.length === 66
      ? (inviteCode as `0x${string}`)
      : stringToHex(inviteCode, { size: 32 });

    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_FLOWERS,
        abi: BLOOM_FLOWERS_ABI,
        functionName: 'onboard',
        args: [codeBytes32],
        chain: base,
        account: address!,
      });
      toast.success('Onboarded on-chain! 🌸');
      await refetchOnboarded();
      await refetchFlowers();
      return tx;
    } catch (err) {
      console.error('Onboard failed:', err);
      toast.error('Failed to onboard on-chain');
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
    onboardOnchain,
    userInviteCode: userInviteCode as `0x${string}` | undefined,
    configuredJackpotContract: configuredJackpotContract as `0x${string}` | undefined,
    refetchFlowers,
  };
}

export function useOnchainJackpot() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: base.id });

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

  const { data: currentWeek } = useReadContract({
    address: CONTRACTS.BLOOM_JACKPOT,
    abi: BLOOM_JACKPOT_ABI,
    functionName: 'currentWeek',
    query: { enabled: true },
  });

  const { data: weekStartTime } = useReadContract({
    address: CONTRACTS.BLOOM_JACKPOT,
    abi: BLOOM_JACKPOT_ABI,
    functionName: 'weekStartTime',
    query: { enabled: true },
  });

  const syncJackpotState = async () => {
    await Promise.all([refetchTickets(), refetchParticipantCount()]);
  };

  const getUpgradeEventSummary = async (userAddress: `0x${string}`) => {
    if (!publicClient || !currentWeek || !weekStartTime) {
      return { inviteCount: 0, upgradeTicketTotal: 0 };
    }

    const logs = await publicClient.getLogs({
      address: CONTRACTS.BLOOM_FLOWERS,
      events: BLOOM_FLOWERS_ABI.filter((item: any) => item.type === 'event') as any,
      fromBlock: CONTRACT_DEPLOYMENT_BLOCKS.BLOOM_FLOWERS,
      toBlock: 'latest',
    });

    const user = userAddress.toLowerCase();
    let inviteCount = 0;
    let upgradeTicketTotal = 0;
    const weekStartMs = Number(weekStartTime) * 1000;

    for (const log of logs as any[]) {
      const args = log.args as any;
      if (log.eventName === 'UserOnboarded') {
        const inviter = args?.inviteCodeOwner;
      }
      if (log.eventName === 'FlowerUpgraded' && String(args?.user).toLowerCase() === user) {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        if (Number(block.timestamp) * 1000 >= weekStartMs) {
          const level = Number(args?.success ? args?.newLevel : Math.max(2, Number(args?.newLevel) + 1));
          upgradeTicketTotal += level === 2 ? 20 : level === 3 ? 30 : level === 4 ? 40 : level === 5 ? 50 : 0;
        }
      }
    }

    return { inviteCount, upgradeTicketTotal };
  };

  return {
    jackpotBalance: jackpotBalance ? Number(jackpotBalance / BigInt(1e18)) : 0,
    userTickets: userTickets ? Number(userTickets) : 0,
    participantCount: participantCount ? Number(participantCount) : 0,
    timeUntilDraw: timeUntilDraw ? Number(timeUntilDraw) : 0,
    currentWeek: currentWeek ? Number(currentWeek) : 0,
    syncJackpotState,
    refetchTickets,
    getUpgradeEventSummary,
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
