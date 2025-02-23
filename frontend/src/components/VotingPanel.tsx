import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useVote } from '@/hooks/useVote';
import { useSocket } from '@/hooks/useSocket';

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
  // Dummy wallet bypass for now
  const wallet = "dummy-wallet-address";
  const { vote, loading, error } = useVote(proposalId);
  const socket = useSocket();

  // Use local state for voting stats to update in real time.
  const [votingStats, setVotingStats] = useState<VotingStats>(initialVotingStats);

  // Persistent vote state per proposal via localStorage
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  useEffect(() => {
    // When proposalId changes, reset local voting stats and check localStorage.
    setVotingStats(initialVotingStats);
    const votedProposals = JSON.parse(localStorage.getItem('votedProposals') || '{}');
    setHasVoted(!!votedProposals[proposalId]);
  }, [proposalId, initialVotingStats]);

  // Listen for vote updates via Socket.io
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

  const handleVote = async (voteType: 'yes' | 'no' | 'abstain') => {
    // Check if already voted for this proposal
    const votedProposals = JSON.parse(localStorage.getItem('votedProposals') || '{}');
    if (votedProposals[proposalId]) return;

    const result = await vote(voteType, wallet);
    if (result) {
      votedProposals[proposalId] = true;
      localStorage.setItem('votedProposals', JSON.stringify(votedProposals));
      setHasVoted(true);
      // The backend will emit the update, so no need to manually update state here.
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
