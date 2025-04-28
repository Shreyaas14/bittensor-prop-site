import { useState } from 'react';
import { castVote } from '@/api/api';

export const useVote = (
  mongoId: string,
  onchainId: number           // ← add this parameter
) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError]     = useState<string | null>(null);

  const vote = async (
    voteType: 'yes' | 'no' | 'abstain',
    wallet: string | null,
    taoBalance: number
  ) => {
    if (!wallet) {
      setError('Wallet not connected');
      return;
    }
    if (taoBalance <= 0) {
      setError('Insufficient TAO balance to vote');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const voteWeight = taoBalance;  // default to full balance
      console.log(`🔄 Casting vote with weight: ${voteWeight} TAO`);

      // Pass both mongoId and onchainId to backend
      await castVote(mongoId, onchainId, voteType, "0xeFcfDE6032b9b03d346C1A85dA3cbBb8BFd2D807", voteWeight);

      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('❌ Error casting vote →', err.response?.data ?? err);
      const serverMsg = err.response?.data?.error;
      setError(serverMsg || err.message || 'Error casting vote');
      setLoading(false);
    }
  };

  return { vote, loading, error };
};
