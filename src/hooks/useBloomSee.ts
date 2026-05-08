import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
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
    query: { enabled: true },
  });

  const ensureAllowance = async (amount: bigint) => {
    if (!address) return;
    const current: bigint = await readContract({
      address: CONTRACTS.USDC,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [address, CONTRACTS.BLOOM_SEE],
    });
    if (current < amount) {
      await writeContractAsync({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.BLOOM_SEE, amount],
        chain: base,
        account: address,
      });
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
      toast.error(err?.shortMessage || 'Failed to place bid');
      throw err;
    }
  };

  return {
    currentAuction: currentAuction ? Number(currentAuction) : 0,
    placeBid,
    isPending,
  };
}
