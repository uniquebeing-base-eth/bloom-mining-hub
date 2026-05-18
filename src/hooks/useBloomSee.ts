import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { base } from 'wagmi/chains';
import { CONTRACTS, BLOOM_SEE_ABI, ERC20_ABI } from '@/config/contracts';
import { toast } from 'sonner';
import { readContract } from 'wagmi/actions';

export function useBloomSee() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: currentAuction } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'currentAuction',
    query: { enabled: true, refetchInterval: 15000 },
  });

  const { data: auction } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'getAuction',
    args: currentAuction !== undefined ? [currentAuction] : undefined,
    query: { enabled: currentAuction !== undefined, refetchInterval: 15000 },
  });

  const { data: bids } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'getAuctionBids',
    args: currentAuction !== undefined ? [currentAuction] : undefined,
    query: { enabled: currentAuction !== undefined, refetchInterval: 15000 },
  });

  const { data: pastWinners } = useReadContract({
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

  const ensureAllowance = async (amount: bigint) => {
    if (!address) return;

    const current = (await readContract({
      address: CONTRACTS.USDC_TOKEN,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [address, CONTRACTS.BLOOM_SEE],
    })) as bigint | undefined;

    if (!current || current < amount) {
      toast.info('Approving USDC for BloomSee...');
      await writeContractAsync({
        address: CONTRACTS.USDC_TOKEN,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.BLOOM_SEE, amount],
        chain: base,
        account: address,
      });
      toast.success('USDC approved ✅');
    }
  };

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
    placeBid,
    isPending,
  };
}
