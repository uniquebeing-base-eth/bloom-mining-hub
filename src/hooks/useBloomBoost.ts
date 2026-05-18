import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { readContract } from 'wagmi/actions';
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

const USDC_FEE = 200_000n;

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

  const ensureAllowance = async (
    token: `0x${string}`,
    spender: `0x${string}`,
    amount: bigint
  ) => {
    if (!address) return;

    const currentAllowance = (await readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [address, spender],
    })) as bigint | undefined;

    if (!currentAllowance || currentAllowance < amount) {
      toast.info('Approving token spend...');
      await writeContractAsync({
        address: token,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, amount],
        chain: base,
        account: address,
      });
      toast.success('Approval transaction submitted');
    }
  };

  // --- Create campaign
  const createCampaign = async (amount: number, payWithBloom: boolean) => {
    if (!address) return toast.error('Wallet not connected');

    try {
      const decimals = payWithBloom ? 18 : 6;
      const amountScaled = parseUnits(amount.toString(), decimals);

      if (payWithBloom) {
        await ensureAllowance(
          CONTRACTS.BLOOM_TOKEN,
          CONTRACTS.BLOOM_BOOST,
          amountScaled
        );
      } else {
        const totalUsdc = amountScaled + USDC_FEE;
        await ensureAllowance(
          CONTRACTS.USDC_TOKEN,
          CONTRACTS.BLOOM_BOOST,
          totalUsdc
        );
      }

      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_BOOST,
        abi: BLOOM_BOOST_ABI,
        functionName: 'createCampaign',
        args: [amountScaled, payWithBloom],
        chain: base,
        account: address,
      });
      toast.success('Campaign created ✨');
      await refetchCount();
      return tx;
    } catch (err: any) {
      console.error('Failed to create campaign:', err);
      toast.error(err?.shortMessage || err?.message || 'Create campaign failed');
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
