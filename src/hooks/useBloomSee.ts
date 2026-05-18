import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { base } from 'wagmi/chains';
import { CONTRACTS, BLOOM_SEE_ABI, BLOOM_FLOWERS_ABI, ERC20_ABI } from '@/config/contracts';
import { toast } from 'sonner';
import { readContract } from 'wagmi/actions';

export function useBloomSee() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: currentAuction, refetch: refetchCurrentAuction } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'currentAuction',
    query: { enabled: true, refetchInterval: 15000 },
  });

  const { data: auction, refetch: refetchAuction } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'getAuction',
    args: currentAuction !== undefined ? [currentAuction] : undefined,
    query: { enabled: currentAuction !== undefined, refetchInterval: 15000 },
  });

  const { data: bids, refetch: refetchBids } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'getAuctionBids',
    args: currentAuction !== undefined ? [currentAuction] : undefined,
    query: { enabled: currentAuction !== undefined, refetchInterval: 15000 },
  });

  const { data: pastWinners, refetch: refetchPastWinners } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'getPastWinners',
    query: { enabled: true, refetchInterval: 30000 },
  });

  const { data: minBid } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'minBid',
    query: { enabled: true, refetchInterval: 15000 },
  });

  const { data: minSupport } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'minSupport',
    query: { enabled: true, refetchInterval: 15000 },
  });

  const { data: timeRemaining, refetch: refetchTimeRemaining } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'getTimeRemaining',
    query: { enabled: true, refetchInterval: 15000 },
  });

  const { data: hasOnboarded } = useReadContract({
    address: CONTRACTS.BLOOM_FLOWERS,
    abi: BLOOM_FLOWERS_ABI,
    functionName: 'hasOnboarded',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const ensureAllowance = async (amount: bigint) => {
    if (!address || !isConnected) {
      toast.error('Wallet not connected');
      return;
    }

    const current = (await readContract({
      address: CONTRACTS.USDC_TOKEN,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [address, CONTRACTS.BLOOM_SEE],
    })) as bigint | undefined;

    if (!current || current < amount) {
      if (!writeContractAsync) {
        toast.error('Wallet connector not ready — please connect again');
        throw new Error('writeContractAsync is unavailable');
      }
      toast.info('Approving USDC for BloomSee...');
      const tx = await writeContractAsync({
        address: CONTRACTS.USDC_TOKEN,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.BLOOM_SEE, amount],
        chain: base,
        account: address,
      });
      // wait for onchain confirmation before continuing
      try {
        await tx.wait?.();
      } catch (_) {}
      toast.success('USDC approved ✅');
    }
  };

  const settleAuction = async () => {
    if (!address || !isConnected) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      if (!writeContractAsync) {
        toast.error('Wallet connector not ready — please connect again');
        throw new Error('writeContractAsync is unavailable');
      }
      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_SEE,
        abi: BLOOM_SEE_ABI,
        functionName: 'settleAuction',
        args: [],
        chain: base,
        account: address,
      });
      try {
        await tx.wait?.();
      } catch (_) {}
      toast.success('Auction settled — next auction started');
      await Promise.all([
        refetchCurrentAuction?.(),
        refetchAuction?.(),
        refetchBids?.(),
        refetchTimeRemaining?.(),
        refetchPastWinners?.(),
      ]);
      return tx;
    } catch (err: any) {
      console.error('Settle auction failed:', err);
      toast.error(err?.shortMessage || err?.message || 'Failed to settle auction');
      throw err;
    }
  };

  const placeBid = async (amount: number, link: string) => {
    if (!address || !isConnected) return toast.error('Wallet not connected');
    // If onboarding state is ambiguous (undefined) perform an explicit onchain check
    if (hasOnboarded !== true) {
      try {
        const onboarded = (await readContract({
          address: CONTRACTS.BLOOM_FLOWERS,
          abi: BLOOM_FLOWERS_ABI,
          functionName: 'hasOnboarded',
          args: [address],
        })) as boolean;
        if (!onboarded) return toast.error('Please onboard before bidding');
      } catch (e) {
        return toast.error('Unable to verify onboarding status');
      }
    }

    const bidAmount = parseUnits(amount.toString(), 6);

    try {
      if (auction && !auction.settled && timeRemaining === 0) {
        toast.info('Auction ended — settling next auction...');
        await settleAuction();
      }

      toast.info('Checking USDC allowance...');
      await ensureAllowance(bidAmount);
      toast.info('Submitting bid transaction...');
      if (!writeContractAsync) {
        toast.error('Wallet connector not ready — please connect again');
        throw new Error('writeContractAsync is unavailable');
      }
      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_SEE,
        abi: BLOOM_SEE_ABI,
        functionName: 'placeBid',
        args: [bidAmount, link],
        chain: base,
        account: address,
      });
      console.log('placeBid tx:', tx);
      try {
        await tx.wait?.();
      } catch (_) {}
      toast.success('Bid placed 💰');
      await Promise.all([
        refetchCurrentAuction?.(),
        refetchAuction?.(),
        refetchBids?.(),
        refetchTimeRemaining?.(),
      ]);
      return tx;
    } catch (err: any) {
      console.error('Bid failed:', err);
      toast.error(err?.shortMessage || err?.message || 'Failed to place bid');
      throw err;
    }
  };

  return {
    auctionId: currentAuction ? Number(currentAuction) : 0,
    auction: auction as any,
    bids: bids as any,
    pastWinners: pastWinners as any,
    minBid: minBid ? Number(formatUnits(minBid as bigint, 6)) : 0,
    minSupport: minSupport ? Number(formatUnits(minSupport as bigint, 6)) : 0,
    timeRemaining: timeRemaining ? Number(timeRemaining as bigint) : 0,
    hasOnboarded: hasOnboarded === true,
    settleAuction,
    placeBid,
    isPending: writeContract?.isPending,
  };
}
