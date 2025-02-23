import { useState } from 'react';
import { castVote } from '@/api/api';

export const useVote = (proposalId: string) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const vote = async (voteType: 'yes' | 'no' | 'abstain', wallet: string | null) => {
    if (!wallet) {
      setError('Wallet not connected');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updatedProposal = await castVote(proposalId, voteType);
      setLoading(false);
      return updatedProposal;
    } catch (err: any) {
      setError(err.message || 'Error casting vote');
      setLoading(false);
    }
  };

  return { vote, loading, error };
};
