import { useState } from 'react';
import { castVote } from '@/api/api';

export const useVote = (proposalId: string) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const vote = async (voteType: 'yes' | 'no' | 'abstain', wallet: string | null, taoBalance: number) => {
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
      // ✅ Ensure voteWeight is properly assigned
      const voteWeight = taoBalance || 1; // Default to 1 if undefined

      console.log(`🔄 Casting vote with weight: ${voteWeight} TAO`);

      // Ensure `castVote` receives the correct parameters
      const updatedProposal = await castVote(proposalId, voteType, wallet!, voteWeight);

      setLoading(false);
      return updatedProposal;
    } catch (err: any) {
      setError(err.message || 'Error casting vote');
      setLoading(false);
    }
  };

  return { vote, loading, error };
};
