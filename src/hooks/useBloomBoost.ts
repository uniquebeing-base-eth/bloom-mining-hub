// useBloomBoost.ts

import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { base } from 'wagmi/chains';
import { waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/lib/wagmi';
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

  const claimCampaign = async (campaignId: number) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

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

      toast.error(
        err?.shortMessage || 'Failed to claim campaign'
      );

      throw err;
    }
  };

  const createCampaign = async (
    amount: number,
    payWithBloom: boolean
  ) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      const decimals = payWithBloom ? 18 : 6;

      const parsedAmount = parseUnits(
        String(amount),
        decimals
      );

      const approvalAmount = payWithBloom
        ? parsedAmount
        : parsedAmount + BigInt(200000);

      const tokenAddress = payWithBloom
        ? CONTRACTS.BLOOM_TOKEN
        : CONTRACTS.USDC_TOKEN;

      const approvalHash = await writeContractAsync({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.BLOOM_BOOST, approvalAmount],
        chain: base,
        account: address,
      });

      await waitForTransactionReceipt(config, {
        hash: approvalHash,
      });

      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_BOOST,
        abi: BLOOM_BOOST_ABI,
        functionName: 'createCampaign',
        args: [parsedAmount, payWithBloom],
        chain: base,
        account: address,
      });

      toast.success('Campaign created 🌸');

      await refetchCount();

      return tx;
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.shortMessage || 'Failed to create campaign'
      );

      throw err;
    }
  };

  return {
    campaignCount: campaignCount ? Number(campaignCount) : 0,
    baseReward: baseReward
      ? Number(formatUnits(baseReward as bigint, 18))
      : 0,
    userReward: userReward
      ? Number(formatUnits(userReward as bigint, 18))
      : 0,
    claimCampaign,
    createCampaign,
    isPending,
    refetchCount,
  };
}
