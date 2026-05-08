import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { base } from 'wagmi/chains';
import { CONTRACTS, BLOOM_BOOST_ABI, ERC20_ABI } from '@/config/contracts';
import { toast } from 'sonner';

export interface OnchainCampaign {
  id: number;
  creator: string;
  pool: bigint;
  payedWithBloom: boolean;
  active: boolean;
  participantCount: number;
}

export function useBloomBoost() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: campaignCount, refetch: refetchCount } = useReadContract({
    address: CONTRACTS.BLOOM_BOOST,
    abi: BLOOM_BOOST_ABI,
    functionName: 'campaignCount',
    query: { enabled: true },
  });

  const { data: baseReward } = useReadContract({
    address: CONTRACTS.BLOOM_BOOST,
    abi: BLOOM_BOOST_ABI,
    functionName: 'baseReward',
    query: { enabled: true },
  });

  const { data: userReward } = useReadContract({
    address: CONTRACTS.BLOOM_BOOST,
    abi: BLOOM_BOOST_ABI,
    functionName: 'getUserReward',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // --- Create campaign
  const createCampaign = async (amount: number, payWithBloom: boolean) => {
    if (!address) return toast.error('Wallet not connected');

    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_BOOST,
        abi: BLOOM_BOOST_ABI,
        functionName: 'createCampaign',
        args: [parseUnits(amount.toString(), 18), payWithBloom],
        chain: base,
        account: address,
      });
      toast.success('Campaign created ✨');
      await refetchCount();
      return tx;
    } catch (err: any) {
      console.error('Failed to create campaign:', err);
      toast.error(err?.shortMessage || 'Create campaign failed');
      throw err;
    }
  };

  // --- Claim reward
  const claimCampaign = async (campaignId: number) => {
    if (!address) return toast.error('Wallet not connected');

    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_BOOST,
        abi: BLOOM_BOOST_ABI,
        functionName: 'claimCampaign',
        args: [BigInt(campaignId)],
        chain: base,
        account: address,
      });
      toast.success('Campaign reward claimed! 🌸');
      return tx;
    } catch (err: any) {
      console.error('Claim campaign failed:', err);
      toast.error(err?.shortMessage || 'Failed to claim campaign');
      throw err;
    }
  };

  return {
    campaignCount: campaignCount ? Number(campaignCount) : 0,
    baseReward: baseReward ? Number(formatUnits(baseReward as bigint, 18)) : 0,
    userReward: userReward ? Number(formatUnits(userReward as bigint, 18)) : 0,
    createCampaign,
    claimCampaign,
    isPending,
    refetchCount,
  };
}
