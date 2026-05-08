import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { base } from 'wagmi/chains';
import { CONTRACTS, BLOOM_SEE_ABI, ERC20_ABI } from '@/config/contracts';
import { readContract } from 'wagmi/actions';
import { toast } from 'sonner';

export function useBloomSee() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: auctionId, refetch: refetchAuctionId } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'currentAuction',
    query: { enabled: true },
  });

  const { data: auction, refetch: refetchAuction } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'getAuction',
    args: auctionId ? [auctionId] : undefined,
    query: { enabled: !!auctionId },
  });

  const { data: timeRemaining, refetch: refetchTime } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'getTimeRemaining',
    query: { enabled: true, refetchInterval: 10_000 },
  });

  const { data: minBid } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'minBid',
  });

  const { data: minSupport } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'minSupport',
  });

  const { data: pastWinners } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'getPastWinners',
  });

  const { data: bids, refetch: refetchBids } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'getAuctionBids',
    args: auctionId ? [auctionId] : undefined,
    query: { enabled: !!auctionId, refetchInterval: 30_000 },
  });

  const refetchAll = async () => {
    await Promise.all([
      refetchAuctionId(),
      refetchAuction(),
      refetchBids(),
      refetchTime(),
    ]);
  };

  // ---- helpers ----
  const ensureAllowance = async (amount: bigint) => {
    if (!address) return;

    const allowance: bigint = await readContract({
      address: CONTRACTS.USDC,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [address, CONTRACTS.BLOOM_SEE],
    });

    if (allowance < amount) {
      toast.info('Approving USDC for BloomSee...');
      await writeContractAsync({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.BLOOM_SEE, amount],
        chain: base,
        account: address,
      });
      toast.success('USDC approved ✅');
    }
  };

  // ---- actions ----
  const placeBid = async (amount: number, link: string) => {
    if (!address) return toast.error('Wallet not connected');
    const bidAmount = parseUnits(amount.toString(), 6);

    try {
      await ensureAllowance(bidAmount);
      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_SEE,
        abi: BLOOM_SEE_ABI,
        functionName: 'placeBid',
        args: [bidAmount, link],
        chain: base,
        account: address,
      });
      toast.success('Bid placed 💰');
      await refetchAll();
      return tx;
    } catch (err: any) {
      console.error('Bid failed:', err);
      toast.error(err?.shortMessage || 'Bid transaction failed');
      throw err;
    }
  };

  const supportBid = async (bidder: string, amount: bigint) => {
    if (!address) return toast.error('Wallet not connected');
    try {
      const supportAmount = amount ?? parseUnits('1', 6);
      await ensureAllowance(supportAmount);
      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_SEE,
        abi: BLOOM_SEE_ABI,
        functionName: 'supportBid',
        args: [bidder, supportAmount],
        chain: base,
        account: address,
      });
      toast.success('Support added 🙌');
      await refetchAll();
      return tx;
    } catch (err: any) {
      console.error('Support failed:', err);
      toast.error(err?.shortMessage || 'Support transaction failed');
      throw err;
    }
  };

  const settleAuction = async () => {
    if (!address) return toast.error('Wallet not connected');
    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_SEE,
        abi: BLOOM_SEE_ABI,
        functionName: 'settleAuction',
        chain: base,
        account: address,
      });
      toast.success('Auction settled ⚡');
      await refetchAll();
      return tx;
    } catch (err: any) {
      console.error('Settle failed:', err);
      toast.error(err?.shortMessage || 'Settle failed');
      throw err;
    }
  };

  return {
    auctionId: auctionId ? Number(auctionId) : 0,
    auction: auction || null,
    bids: (bids as any[]) || [],
    minBid: minBid ? Number(minBid) / 1e6 : 10,
    minSupport: minSupport ? Number(minSupport) / 1e6 : 1,
    pastWinners: (pastWinners as any[]) || [],
    timeRemaining: timeRemaining ? Number(timeRemaining) : 0,
    placeBid,
    supportBid,
    settleAuction,
    refetchAll,
    isPending,
  };
}
