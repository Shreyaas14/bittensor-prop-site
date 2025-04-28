// src/hooks/useSocket.ts
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5001';

export interface ProposalCreatedPayload {
  id: number;
  creator: string;
}

export interface VoteCastPayload {
  id: number;
  voter: string;
  voteType: 'yes' | 'no' | 'abstain';
  weight: number;
}

export const useSocket = (
  onProposalCreated: (payload: ProposalCreatedPayload) => void,
  onVoteCast: (payload: VoteCastPayload) => void
): Socket | null => {
  const [socket, setSocket] = useState<Socket | null>(null);

  // wrap callbacks in useCallback so they don't re-register on every render
  const handleProposalCreated = useCallback(
    (data: ProposalCreatedPayload) => {
      onProposalCreated(data);
    },
    [onProposalCreated]
  );

  const handleVoteCast = useCallback(
    (data: VoteCastPayload) => {
      onVoteCast(data);
    },
    [onVoteCast]
  );

  useEffect(() => {
    const s = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    setSocket(s);

    // register listeners
    s.on('onchain:proposalCreated', handleProposalCreated);
    s.on('onchain:voteCast', handleVoteCast);

    return () => {
      // cleanup listeners & disconnect
      s.off('onchain:proposalCreated', handleProposalCreated);
      s.off('onchain:voteCast', handleVoteCast);
      s.disconnect();
    };
  }, [handleProposalCreated, handleVoteCast]);

  return socket;
};
