import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useVote } from '@/hooks/useVote';
import { useSocket } from '@/hooks/useSocket';
import { hasVotedForProposal, markProposalAsVoted } from '@/utils/voteHelpers'; // your helper functions

interface VotingStats {
  yes: number;
  no: number;
  abstain: number;
  total_votes: number;
}

interface VotingPanelProps {
  proposalId: string;
  votingStats: VotingStats;
  dates: {
    votingCreatedAt: string;
    votingStart: string;
    votingEnd: string;
  };
}

const VotingPanel: React.FC<VotingPanelProps> = ({ proposalId, votingStats: initialVotingStats, dates }) => {
  // Dummy wallet bypass for now.
  const wallet = "dummy-wallet-address";
  const { vote, loading, error } = useVote(proposalId);
  const socket = useSocket();

  const [votingStats, setVotingStats] = useState<VotingStats>(initialVotingStats);
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  // On mount or when proposalId changes, read from localStorage
  useEffect(() => {
    setVotingStats(initialVotingStats);
    setHasVoted(hasVotedForProposal(proposalId));
  }, [proposalId, initialVotingStats]);

  // Listen for real-time vote updates
  useEffect(() => {
    if (!socket) return;
    const handleVoteUpdate = (updatedProposal: any) => {
      if (updatedProposal._id === proposalId) {
        setVotingStats(updatedProposal.voting_stats);
      }
    };
    socket.on('voteUpdate', handleVoteUpdate);
    return () => {
      socket.off('voteUpdate', handleVoteUpdate);
    };
  }, [socket, proposalId]);

  // Optionally, re-fetch latest stats as a fallback when component mounts
  useEffect(() => {
    fetch(`http://localhost:5001/api/proposals/${proposalId}`)
      .then(res => res.json())
      .then(data => {
        setVotingStats(data.voting_stats);
      })
      .catch(err => console.error('Error fetching updated proposal:', err));
  }, [proposalId]);

  const handleVote = async (voteType: 'yes' | 'no' | 'abstain') => {
    if (hasVotedForProposal(proposalId)) return;

    const result = await vote(voteType, wallet);
    if (result) {
      markProposalAsVoted(proposalId);
      setHasVoted(true);
      // The socket event should update votingStats, but you might also refetch here.
    }
  };

  const totalVotes = votingStats.total_votes || 1;
  const yesPercentage = (votingStats.yes / totalVotes) * 100;
  const noPercentage = (votingStats.no / totalVotes) * 100;
  const abstainPercentage = (votingStats.abstain / totalVotes) * 100;
  const isVotingActive = new Date() < new Date(dates.votingEnd);

  return (
    <div className="p-4 border-l">
      <div className="mb-4">
        <p className="text-sm">Wallet (bypassed): {wallet}</p>
      </div>
      <div className="mb-4">
        <h3 className="mb-2 font-bold">Cast Your Vote</h3>
        <div className="flex gap-2">
          <Button onClick={() => handleVote('yes')} disabled={!isVotingActive || loading || hasVoted}>
            Yes
          </Button>
          <Button onClick={() => handleVote('no')} disabled={!isVotingActive || loading || hasVoted}>
            No
          </Button>
          <Button onClick={() => handleVote('abstain')} disabled={!isVotingActive || loading || hasVoted}>
            Abstain
          </Button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        {hasVoted && <p>You have already voted for this proposal.</p>}
      </div>
      <div className="mb-4">
        <h3 className="mb-2 font-bold">Voting Stats</h3>
        <div className="space-y-2">
          <div>
            <p className="text-xs">Yes: {yesPercentage.toFixed(1)}%</p>
            <Progress value={yesPercentage} max={100} />
          </div>
          <div>
            <p className="text-xs">No: {noPercentage.toFixed(1)}%</p>
            <Progress value={noPercentage} max={100} />
          </div>
          <div>
            <p className="text-xs">Abstain: {abstainPercentage.toFixed(1)}%</p>
            <Progress value={abstainPercentage} max={100} />
          </div>
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-bold">Timeline</h3>
        <ul className="space-y-1 text-xs">
          <li>Created: {new Date(dates.votingCreatedAt).toLocaleString()}</li>
          <li>Voting Starts: {new Date(dates.votingStart).toLocaleString()}</li>
          <li>Voting Ends: {new Date(dates.votingEnd).toLocaleString()}</li>
        </ul>
      </div>
    </div>
  );
};

export default VotingPanel;
