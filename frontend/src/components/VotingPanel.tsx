import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useVote } from "@/hooks/useVote";
import { useSocket } from "@/hooks/useSocket";
import WalletConnectButton from "@/components/ui/WalletConnectButton";
import { FaClock } from "react-icons/fa"; // Import for timeline icon

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
  const { vote, loading, error } = useVote(proposalId);
  const socket = useSocket();
  const [account, setAccount] = useState<string | null>(null);
  const [votingStats, setVotingStats] = useState<VotingStats>(initialVotingStats);
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  useEffect(() => {
    setVotingStats(initialVotingStats);
    const votedProposals = JSON.parse(localStorage.getItem("votedProposals") || "{}");
    setHasVoted(!!votedProposals[proposalId]);
  }, [proposalId, initialVotingStats]);

  useEffect(() => {
    if (!socket) return;
    const handleVoteUpdate = (updatedProposal: any) => {
      if (updatedProposal._id === proposalId) {
        setVotingStats(updatedProposal.voting_stats);
      }
    };
    socket.on("voteUpdate", handleVoteUpdate);
    return () => {
      socket.off("voteUpdate", handleVoteUpdate);
    };
  }, [socket, proposalId]);

  const handleVote = async (voteType: "yes" | "no" | "abstain") => {
    if (!account) {
      alert("Please connect your wallet first!");
      return;
    }
    const votedProposals = JSON.parse(localStorage.getItem("votedProposals") || "{}");
    if (votedProposals[proposalId]) return;
    
    const result = await vote(voteType, account);
    if (result) {
      votedProposals[proposalId] = true;
      localStorage.setItem("votedProposals", JSON.stringify(votedProposals));
      setHasVoted(true);
    }
  };

  const totalVotes = votingStats.total_votes || 1;
  const yesPercentage = (votingStats.yes / totalVotes) * 100;
  const noPercentage = (votingStats.no / totalVotes) * 100;
  const abstainPercentage = (votingStats.abstain / totalVotes) * 100;
  const isVotingActive = new Date() < new Date(dates.votingEnd);

  const formattedDates = {
    created: new Date(dates.votingCreatedAt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }),
    start: new Date(dates.votingStart).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }),
    end: new Date(dates.votingEnd).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }),
  };

  return (
    <div className="p-4 border-l">
      <div className="mb-4">
        <WalletConnectButton onConnect={(walletAddress) => setAccount(walletAddress)} />
      </div>
      <div className="mb-4">
        <h3 className="mb-2 font-bold">Cast Your Vote</h3>
        <div className="flex gap-2">
          <Button onClick={() => handleVote("yes")} disabled={!isVotingActive || loading || hasVoted}>
            Yes
          </Button>
          <Button onClick={() => handleVote("no")} disabled={!isVotingActive || loading || hasVoted}>
            No
          </Button>
          <Button onClick={() => handleVote("abstain")} disabled={!isVotingActive || loading || hasVoted}>
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

      {/* Updated Timeline UI */}
      <div className="p-4 border rounded-lg shadow-sm">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FaClock className="text-gray-500" /> Timeline
        </h3>
        <div className="relative border-l-2 border-gray-300 pl-4 mt-2">
          <div className="mb-3 flex items-start gap-2">
            <div className="w-3 h-3 bg-black rounded-full relative -left-[10px]"></div>
            <div>
              <p className="font-semibold">Created</p>
              <p className="text-sm text-gray-600">{formattedDates.created}</p>
            </div>
          </div>
          <div className="mb-3 flex items-start gap-2">
            <div className="w-3 h-3 bg-black rounded-full relative -left-[10px]"></div>
            <div>
              <p className="font-semibold">Start</p>
              <p className="text-sm text-gray-600">{formattedDates.start}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full relative -left-[10px]"></div>
            <div>
              <p className="font-semibold">End</p>
              <p className="text-sm text-gray-600">{formattedDates.end}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingPanel;
