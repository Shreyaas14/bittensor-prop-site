import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export interface ProposalContent {
  title: string; // New field
  summary: string;
  abstract: string;
  full_proposal: string; // Assumes the API transforms "full_proposal" to camelCase
}

export interface VotingStats {
  yes: number;
  no: number;
  abstain: number;
  total_votes: number;
}

export interface ProposalDetailData {
  _id: string;
  walletAddress: string;  // New field from proposal_creator
  content: ProposalContent;
  voting_stats: VotingStats;
}

export const useProposalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<ProposalDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:5001/api/proposals/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`http error, status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: ProposalDetailData) => {
        setProposal(data);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'error fetching proposal details');
        setLoading(false);
      });
  }, [id]);

  return { proposal, loading, error };
};
