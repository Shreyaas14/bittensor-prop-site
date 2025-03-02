// src/hooks/useProposals.ts
import { useState, useEffect } from 'react';
import { fetchProposals } from '@/api/api';
import { io, Socket } from 'socket.io-client';

export interface Proposal {
  _id: string;
  content: {
    summary: string;
    abstract: string;
  };
  voting_stats: {
    yes: number;
    no: number;
    abstain: number;
    total_votes: number;
  };
}

export const useProposals = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProposals()
      .then((data: Proposal[]) => {
        setProposals(data);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || "Error fetching proposals");
        setLoading(false);
      });

    const socket: Socket = io('http://localhost:5001');
    socket.on('proposalCreated', (newProposal: Proposal) => {
      setProposals((prev) => [...prev, newProposal]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { proposals, loading, error };
};
