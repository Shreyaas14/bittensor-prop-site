import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useVote } from "@/hooks/useVote";
import { useSocket } from "@/hooks/useSocket";
import WalletConnectButton from "@/components/ui/WalletConnectButton";
import { FaClock } from "react-icons/fa";

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
  const [selectedVote, setSelectedVote] = useState<"yes" | "no" | "abstain" | null>(null);
  const [taoBalance, setTaoBalance] = useState<number>(0);

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
    if (hasVoted) return;

    const result = await vote(voteType, account, taoBalance);
    if (result) {
      setSelectedVote(voteType);
      setHasVoted(true);
      localStorage.setItem("votedProposals", JSON.stringify({ ...JSON.parse(localStorage.getItem("votedProposals") || "{}"), [proposalId]: true }));
    }
  };

  const totalVotes = votingStats.total_votes || 1;
  const yesPercentage = (votingStats.yes / totalVotes) * 100;
  const noPercentage = (votingStats.no / totalVotes) * 100;
  const abstainPercentage = (votingStats.abstain / totalVotes) * 100;
  const isVotingActive = new Date() < new Date(dates.votingEnd);

  return (
    <div className="p-6 border rounded-xl bg-white shadow-lg max-w-lg mx-auto">
      <div className="mb-4">
        <WalletConnectButton onConnect={(walletAddress) => setAccount(walletAddress)} />
      </div>
      <h3 className="mb-4 font-bold text-xl">Cast Your Vote</h3>
      <div className="flex flex-col gap-3">
        {[
          { label: "For", type: "yes", color: "green" },
          { label: "Abstain", type: "abstain", color: "gray" },
          { label: "Against", type: "no", color: "red" },
        ].map(({ label, type, color }) => (
          <motion.button
            key={type}
            onClick={() => handleVote(type as "yes" | "no" | "abstain")}
            disabled={!isVotingActive || loading || hasVoted}
            className={`w-full flex justify-between items-center p-4 border rounded-lg shadow-md transition-all font-semibold ${
              selectedVote === type ? `bg-${color}-100 border-${color}-500` : "bg-gray-50 border-gray-300 hover:bg-gray-200"
            } ${hasVoted ? "opacity-50 cursor-not-allowed" : ""}`}
            whileTap={{ scale: 0.95 }}
          >
            <span className={`text-${color}-600`}>{label}</span>
          </motion.button>
        ))}
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {hasVoted && <p className="mt-2 text-green-600 font-semibold">You have voted!</p>}

      <h3 className="mt-6 mb-2 font-bold text-xl">Voting Stats</h3>
      <div className="space-y-3">
        {[{ label: "For", value: yesPercentage, color: "green" },
          { label: "Abstain", value: abstainPercentage, color: "gray" },
          { label: "Against", value: noPercentage, color: "red" }].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-3">
            <span className={`text-${color}-600 font-semibold w-16`}>{label}</span>
            <Progress value={value} max={100} className={`h-2 rounded-full bg-${color}-500`} />
            <span className="text-sm font-medium">{value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <div className="mt-6 p-6 border rounded-lg shadow-sm bg-white">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FaClock className="text-gray-500" /> Timeline
        </h3>
        <div className="relative border-l-2 border-gray-300 pl-4 mt-4">
          {[{ label: "Created", value: dates.votingCreatedAt },
            { label: "Start", value: dates.votingStart },
            { label: "End", value: dates.votingEnd }].map(({ label, value }, index) => (
            <div key={label} className="mb-4 flex items-start gap-2">
              <div className={`w-3 h-3 rounded-full relative -left-[10px] ${index === 2 ? "bg-gray-400" : "bg-black"}`}></div>
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-gray-600">{new Date(value).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VotingPanel;
