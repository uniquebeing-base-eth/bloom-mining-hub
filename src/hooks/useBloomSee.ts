import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { base } from 'wagmi/chains';
import { CONTRACTS, BLOOM_SEE_ABI, ERC20_ABI } from '@/config/contracts';
import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';

export interface OnchainAuction {
  id: number;
  highestBidder: string;
  highestBid: bigint;
  totalSupport: bigint;
  endTime: number;
  link: string;
  settled: boolean;
}

export interface OnchainBid {
  bidder: string;
  amount: bigint;
  supportReceived: bigint;
  link: string;
}

export function useBloomSee() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: currentAuctionId, refetch: refetchAuctionId } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'currentAuction',
    query: { enabled: true, refetchInterval: 15_000 },
  });

  const auctionId = currentAuctionId ? Number(currentAuctionId) : 0;

  const { data: auctionData, refetch: refetchAuction } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'getAuction',
    args: auctionId > 0 ? [BigInt(auctionId)] : undefined,
    query: { enabled: auctionId > 0, refetchInterval: 15_000 },
  });

  const { data: bidsData, refetch: refetchBids } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'getAuctionBids',
    args: auctionId > 0 ? [BigInt(auctionId)] : undefined,
    query: { enabled: auctionId > 0, refetchInterval: 15_000 },
  });

  const { data: timeRemaining, refetch: refetchTime } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'getTimeRemaining',
    query: { enabled: true, refetchInterval: 30_000 },
  });

  const { data: minBid } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'minBid',
    query: { enabled: true },
  });

  const { data: minSupport } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'minSupport',
    query: { enabled: true },
  });

  const { data: pastWinners } = useReadContract({
    address: CONTRACTS.BLOOM_SEE,
    abi: BLOOM_SEE_ABI,
    functionName: 'getPastWinners',
    query: { enabled: true },
  });

  const placeBid = async (amountUsdc: number, link: string) => {
    if (!address) { toast.error('Wallet not connected'); return; }
    const amount = parseUnits(String(amountUsdc), 6);
    // Approve USDC first
    try {
      await writeContractAsync({
        address: CONTRACTS.USDC_TOKEN,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.BLOOM_SEE, amount],
        chain: base,
        account: address,
      });
    } catch (err: any) {
      toast.error('USDC approval failed');
      throw err;
    }
    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_SEE,
        abi: BLOOM_SEE_ABI,
        functionName: 'placeBid',
        args: [amount, link],
        chain: base,
        account: address,
      });
      toast.success('Bid placed! 🎯');
      await refetchAuction();
      await refetchBids();
      return tx;
    } catch (err: any) {
      console.error('Place bid failed:', err);
      toast.error(err?.shortMessage || 'Failed to place bid');
      throw err;
    }
  };

  const supportBid = async (bidder: string, amountUsdc: number) => {
    if (!address) { toast.error('Wallet not connected'); return; }
    const amount = parseUnits(String(amountUsdc), 6);
    try {
      await writeContractAsync({
        address: CONTRACTS.USDC_TOKEN,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.BLOOM_SEE, amount],
        chain: base,
        account: address,
      });
    } catch (err: any) {
      toast.error('USDC approval failed');
      throw err;
    }
    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_SEE,
        abi: BLOOM_SEE_ABI,
        functionName: 'supportBid',
        args: [bidder as `0x${string}`, amount],
        chain: base,
        account: address,
      });
      toast.success('Bid supported! 🌸');
      await refetchBids();
      return tx;
    } catch (err: any) {
      console.error('Support bid failed:', err);
      toast.error(err?.shortMessage || 'Failed to support bid');
      throw err;
    }
  };

  const settleAuction = async () => {
    if (!address) { toast.error('Wallet not connected'); return; }
    try {
      const tx = await writeContractAsync({
        address: CONTRACTS.BLOOM_SEE,
        abi: BLOOM_SEE_ABI,
        functionName: 'settleAuction',
        chain: base,
        account: address,
      });
      toast.success('Auction settled! New auction started 🌸');
      await refetchAuctionId();
      await refetchAuction();
      await refetchBids();
      return tx;
    } catch (err: any) {
      console.error('Settle auction failed:', err);
      toast.error(err?.shortMessage || 'Failed to settle auction');
      throw err;
    }
  };

  const refetchAll = useCallback(async () => {
    await Promise.all([refetchAuctionId(), refetchAuction(), refetchBids(), refetchTime()]);
  }, [refetchAuctionId, refetchAuction, refetchBids, refetchTime]);

  const auction: OnchainAuction | null = auctionData
    ? {
        id: Number((auctionData as any).id),
        highestBidder: (auctionData as any).highestBidder,
        highestBid: (auctionData as any).highestBid,
        totalSupport: (auctionData as any).totalSupport,
        endTime: Number((auctionData as any).endTime),
        link: (auctionData as any).link,
        settled: (auctionData as any).settled,
      }
    : null;

  const bids: OnchainBid[] = bidsData
    ? (bidsData as any[]).map((b: any) => ({
        bidder: b.bidder,
        amount: b.amount,
        supportReceived: b.supportReceived,
        link: b.link,
      }))
    : [];

  return {
    auctionId,
    auction,
    bids,
    timeRemaining: timeRemaining ? Number(timeRemaining) : 0,
    minBid: minBid ? Number(formatUnits(minBid as bigint, 6)) : 10,
    minSupport: minSupport ? Number(formatUnits(minSupport as bigint, 6)) : 1,
    pastWinners: (pastWinners as any[]) || [],
    placeBid,
    supportBid,
    settleAuction,
    isPending,
    refetchAll,
  };
}
