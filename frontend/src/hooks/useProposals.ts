import { useState, useEffect } from 'react';
import { fetchProposals } from '@/api/api';
import { io, Socket } from 'socket.io-client';

export interface Proposal {
  _id: string;
  content: {
    title: string;
    summary: string;
    abstract: string;
    fullProposal: string;
  };
  voting_stats: {
    yes: number;
    no: number;
    abstain: number;
    total_votes: number;
  };
  walletAddress: string;
  created_at?: string;
}

export const useProposals = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getProposals = async () => {
      try {
        const data = await fetchProposals();
        setProposals(data);
        setLoading(false);
      } catch (err: any) {
        console.error("Error in useProposals:", err);
        setError(err.message || "Error fetching proposals");
        setLoading(false);
      }
    };

    getProposals();

    // Set up socket connection
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
    const socket: Socket = io(socketUrl);
    
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });
    
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });
    
    socket.on('proposalCreated', (newProposal: Proposal) => {
      console.log('New proposal received:', newProposal);
      setProposals((prev) => [...prev, newProposal]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { proposals, loading, error };
};

