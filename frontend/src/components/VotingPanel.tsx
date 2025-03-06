import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useVote } from "@/hooks/useVote";
import { useSocket } from "@/hooks/useSocket";
import WalletConnectButton from "@/components/ui/WalletConnectButton";
import { FaClock, FaCheckCircle, FaMinusCircle, FaTimesCircle } from "react-icons/fa";

interface VotingStats {
  yes: number;
  no: number;
  abstain: number;
  total_votes: number;
}

interface DateInfo {
  votingCreatedAt: string;
  votingStart: string;
  votingEnd: string;
}

interface VotingPanelProps {
  proposalId: string;
  votingStats: VotingStats;
  dates: DateInfo;
}

const VotingPanel: React.FC<VotingPanelProps> = ({ proposalId, votingStats: initialVotingStats, dates }) => {
  const { vote, loading, error } = useVote(proposalId);
  const socket = useSocket();
  const [account, setAccount] = useState<string | null>(null);
  const [votingStats, setVotingStats] = useState<VotingStats>(initialVotingStats);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [selectedVote, setSelectedVote] = useState<"yes" | "no" | "abstain" | null>(null);
  const [taoBalance, setTaoBalance] = useState<number>(0);
  
  // Calculate the timeline directly using the dates prop
  // @ts-ignore - Ignore TypeScript errors for this line
  const timeline = {
    created: new Date(dates.votingCreatedAt),
    start: new Date(new Date(dates.votingCreatedAt).getTime() + 24 * 60 * 60 * 1000), // 24 hours after creation
    end: new Date(new Date(dates.votingCreatedAt).getTime() + 4 * 24 * 60 * 60 * 1000) // 4 days after creation
  };

  useEffect(() => {
    setVotingStats(initialVotingStats);
    const votedProposals = JSON.parse(localStorage.getItem("votedProposals") || "{}");
    setHasVoted(!!votedProposals[proposalId]);
    if (votedProposals[proposalId]) {
      setSelectedVote(votedProposals[proposalId + "_type"] || null);
    }
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
    if (taoBalance <= 0) {
      alert("You need TAO tokens to vote. Your current balance is 0.");
      return;
    }

    const result = await vote(voteType, account, taoBalance);
    if (result) {
      // Update local state
      setSelectedVote(voteType);
      setHasVoted(true);
      
      // Save to localStorage
      const votedProposals = JSON.parse(localStorage.getItem("votedProposals") || "{}");
      votedProposals[proposalId] = true;
      votedProposals[proposalId + "_type"] = voteType;
      votedProposals[proposalId + "_weight"] = taoBalance;
      localStorage.setItem("votedProposals", JSON.stringify(votedProposals));
      
      // Update voting stats locally to provide immediate feedback
      const voteWeight = taoBalance;
      setVotingStats(prev => {
        const newStats = { ...prev };
        newStats[voteType] += voteWeight;
        newStats.total_votes += voteWeight;
        return newStats;
      });
    }
  };

  const totalVotes = votingStats.total_votes || 1;
  const yesPercentage = (votingStats.yes / totalVotes) * 100;
  const noPercentage = (votingStats.no / totalVotes) * 100;
  const abstainPercentage = (votingStats.abstain / totalVotes) * 100;
  const isVotingActive = new Date() < new Date(dates.votingEnd);

  // Time remaining calculation
  const getTimeRemaining = () => {
    const now = new Date();
    const end = new Date(dates.votingEnd);
    
    if (now > end) return "Voting ended";
    
    const diffMs = end.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    return `${diffHrs}h remaining`;
  };

  // Check if proposal is in active voting period
  const isInVotingPeriod = () => {
    const now = new Date();
    const start = new Date(dates.votingStart);
    const end = new Date(dates.votingEnd);
    
    return now >= start && now <= end;
  };

  // Check if voting has ended
  const hasVotingEnded = () => {
    const now = new Date();
    const end = new Date(dates.votingEnd);
    
    return now > end;
  };

  // Determine if proposal passed
  const didProposalPass = () => {
    // Assuming a proposal passes if "yes" votes are more than "no" votes
    return votingStats.yes > votingStats.no;
  };

  // Format date to 
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}, ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(' ', '')}`;
  };

  // Handle wallet connection
  const handleWalletConnect = (address: string | null, balance: number) => {
    setAccount(address);
    setTaoBalance(balance);
  };

  return (
    <div className="bg-gray-900 h-full overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Governance Vote</h2>
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full">
            <FaClock className="text-green-400" />
            <span className="text-green-400 font-medium">{getTimeRemaining()}</span>
          </div>
        </div>
      </div>
      
      {/* Voting Section */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-4">Cast Your Vote</h3>
        
        {!account ? (
          <div className="mb-4">
            <WalletConnectButton onConnect={handleWalletConnect} />
          </div>
        ) : (
          <div className="space-y-3">
            {/* For */}
            <div 
              onClick={() => !hasVoted && handleVote("yes")}
              className={`flex items-center justify-between p-4 rounded-lg bg-gray-800 border ${selectedVote === "yes" ? "border-green-500" : "border-gray-700"} cursor-pointer`}
            >
              <div className="flex items-center">
                <FaCheckCircle className="text-green-400 mr-2" />
                <span className="text-white">For</span>
                <span className="text-green-400 font-bold ml-2">{votingStats.yes}</span>
              </div>
              <span className="text-white">{yesPercentage.toFixed(1)}%</span>
            </div>
            
            {/* Abstain */}
            <div 
              onClick={() => !hasVoted && handleVote("abstain")}
              className={`flex items-center justify-between p-4 rounded-lg bg-gray-800 border ${selectedVote === "abstain" ? "border-gray-500" : "border-gray-700"} cursor-pointer`}
            >
              <div className="flex items-center">
                <FaMinusCircle className="text-gray-400 mr-2" />
                <span className="text-white">Abstain</span>
                <span className="text-gray-400 font-bold ml-2">{votingStats.abstain}</span>
              </div>
              <span className="text-white">{abstainPercentage.toFixed(1)}%</span>
            </div>
            
            {/* Against */}
            <div 
              onClick={() => !hasVoted && handleVote("no")}
              className={`flex items-center justify-between p-4 rounded-lg bg-gray-800 border ${selectedVote === "no" ? "border-red-500" : "border-gray-700"} cursor-pointer`}
            >
              <div className="flex items-center">
                <FaTimesCircle className="text-red-400 mr-2" />
                <span className="text-white">Against</span>
                <span className="text-red-400 font-bold ml-2">{votingStats.no}</span>
              </div>
              <span className="text-white">{noPercentage.toFixed(1)}%</span>
            </div>
          </div>
        )}
        
        {hasVoted && (
          <div className="mt-4 p-3 bg-green-900/30 border border-green-800 rounded-lg">
            <p className="text-green-400 flex items-center gap-2">
              <FaCheckCircle />
              <span>Your vote has been recorded!</span>
            </p>
          </div>
        )}
      </div>
      
      {/* Results Section */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-4">Results</h3>
        
        <div className="space-y-4">
          {/* For */}
          <div className="mb-6">
            <div className="flex justify-between text-white mb-1">
              <span>For</span>
              <span>{yesPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-800 h-1 rounded-full mb-1">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${yesPercentage}%` }}></div>
            </div>
            <div className="text-gray-400 text-sm">{votingStats.yes} TAO</div>
          </div>
          
          {/* Abstain */}
          <div className="mb-6">
            <div className="flex justify-between text-white mb-1">
              <span>Abstain</span>
              <span>{abstainPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-800 h-1 rounded-full mb-1">
              <div className="h-full bg-gray-500 rounded-full" style={{ width: `${abstainPercentage}%` }}></div>
            </div>
            <div className="text-gray-400 text-sm">{votingStats.abstain} TAO</div>
          </div>
          
          {/* Against */}
          <div className="mb-6">
            <div className="flex justify-between text-white mb-1">
              <span>Against</span>
              <span>{noPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-800 h-1 rounded-full mb-1">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${noPercentage}%` }}></div>
            </div>
            <div className="text-gray-400 text-sm">{votingStats.no} TAO</div>
          </div>
          
          <div className="pt-2 border-t border-gray-700 flex justify-between text-white">
            <span>Total Votes</span>
            <div>
              <span className="font-bold text-white">{votingStats.total_votes}</span>
              <span className="text-gray-400 ml-1">TAO</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-4">Timeline</h3>
        
        <div className="relative border-l-2 border-gray-700 pl-4 pb-4">
          {/* Created */}
          <div className="mb-6 relative">
            <div className="absolute -left-[3px] top-0 w-4 h-4 rounded-full bg-green-500"></div>
            <div className="ml-5">
              <p className="font-bold text-white">Created</p>
              <p className="text-gray-400 text-sm">{formatDate(timeline.created.toISOString())}</p>
            </div>
          </div>
          
          {/* Start */}
          <div className="mb-6 relative">
            <div className="absolute -left-[3px] top-0 w-4 h-4 rounded-full bg-green-500"></div>
            <div className="ml-5">
              <p className="font-bold text-white">Start</p>
              <p className="text-gray-400 text-sm">{formatDate(timeline.start.toISOString())}</p>
            </div>
          </div>
          
          {/* End */}
          <div className="relative">
            <div className={`absolute -left-[3px] top-0 w-4 h-4 rounded-full ${hasVotingEnded() ? "bg-green-500" : "bg-gray-500"}`}></div>
            <div className="ml-5">
              <p className="font-bold text-white">End</p>
              <p className="text-gray-400 text-sm">{formatDate(timeline.end.toISOString())}</p>
            </div>
          </div>
          
          {/* Show result if voting has ended */}
          {hasVotingEnded() && (
            <div className="mt-6 relative">
              <div className={`absolute -left-[3px] top-0 w-4 h-4 rounded-full ${didProposalPass() ? "bg-green-500" : "bg-red-500"}`}></div>
              <div className="ml-5">
                <p className="font-bold text-white">{didProposalPass() ? "Passed" : "Failed"}</p>
                <p className="text-gray-400 text-sm">{formatDate(new Date().toISOString())}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotingPanel;