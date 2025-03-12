import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useVote } from '@/hooks/useVote';
import { useSocket } from '@/hooks/useSocket';
import { hasVotedForProposal, markProposalAsVoted } from '@/utils/voteHelpers'; // your helper functions
// Change from named import to default import
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
  const timeline = {
    created: new Date(dates.votingCreatedAt),
    start: new Date(dates.votingStart),
    end: new Date(dates.votingEnd)
  };

  // On mount or when proposalId changes, read from localStorage
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
    socket.on('voteUpdate', handleVoteUpdate);
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
  const isVotingActive = new Date() < timeline.end;

  // Time remaining calculation
  const getTimeRemaining = () => {
    const now = new Date();
    const end = timeline.end;
    
    if (now > end) return "Voting ended";
    
    const diffMs = end.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    return `${diffHrs}h remaining`;
  };

  // Check if voting has ended
  const hasVotingEnded = () => {
    const now = new Date();
    return now > timeline.end;
  };

  // Determine if proposal passed
  const didProposalPass = () => {
    // Assuming a proposal passes if "yes" votes are more than "no" votes
    return votingStats.yes > votingStats.no;
  };

  // Format date to 
  const formatDate = (date: Date) => {
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
    <div className="h-full w-80 flex flex-col bg-background-secondary border-l border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <h2 className="text-header-sm font-medium text-white">Cast Vote</h2>
          <div className="flex items-center gap-2 bg-background px-3 py-1 rounded-full">
            <FaClock className="text-teal" size={12} />
            <span className="text-teal text-label-sm">{getTimeRemaining()}</span>
          </div>
        </div>
      </div>
      
      {/* Voting Section */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {!account ? (
            <div className="mb-6">
              <p className="text-text-secondary mb-4">Connect your wallet to cast your vote on this proposal.</p>
              <WalletConnectButton onConnect={handleWalletConnect} />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Connected wallet info */}
              <div className="p-3 rounded-lg bg-card border border-border mb-6">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-label-md text-text-secondary">Connected Wallet</span>
                  {hasVoted && <span className="text-label-xs text-teal bg-teal/10 px-2 py-0.5 rounded">Voted</span>}
                </div>
                <div className="font-mono text-label-md text-white truncate">
                  {account.substring(0, 8)}...{account.substring(account.length - 6)}
                </div>
                <div className="mt-2 flex items-baseline">
                  <span className="text-label-lg font-medium text-white">{taoBalance}</span>
                  <span className="text-label-sm text-text-secondary ml-1">τ</span>
                </div>
              </div>
              
              {/* For */}
              <button 
                onClick={() => !hasVoted && isVotingActive && handleVote("yes")}
                disabled={hasVoted || !isVotingActive}
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors
                  ${selectedVote === "yes" 
                    ? "bg-card border-teal" 
                    : "bg-card border-border hover:border-teal"}
                  ${(hasVoted && selectedVote !== "yes") || !isVotingActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center">
                  <FaCheckCircle className="text-teal mr-2" size={16} />
                  <span className="text-white">For</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-label-md text-teal font-medium mr-1">{votingStats.yes}</span>
                  <span className="text-label-sm text-teal">({yesPercentage.toFixed(1)}%)</span>
                </div>
              </button>
              
              {/* Against */}
              <button 
                onClick={() => !hasVoted && isVotingActive && handleVote("no")}
                disabled={hasVoted || !isVotingActive}
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors
                  ${selectedVote === "no" 
                    ? "bg-card border-gradient-orange" 
                    : "bg-card border-border hover:border-gradient-orange"}
                  ${(hasVoted && selectedVote !== "no") || !isVotingActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center">
                  <FaTimesCircle className="text-gradient-orange mr-2" size={16} />
                  <span className="text-white">Against</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-label-md text-gradient-orange font-medium mr-1">{votingStats.no}</span>
                  <span className="text-label-sm text-gradient-orange">({noPercentage.toFixed(1)}%)</span>
                </div>
              </button>
              
              {/* Abstain */}
              <button 
                onClick={() => !hasVoted && isVotingActive && handleVote("abstain")}
                disabled={hasVoted || !isVotingActive}
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors
                  ${selectedVote === "abstain" 
                    ? "bg-card border-text-secondary" 
                    : "bg-card border-border hover:border-text-secondary"}
                  ${(hasVoted && selectedVote !== "abstain") || !isVotingActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center">
                  <FaMinusCircle className="text-text-secondary mr-2" size={16} />
                  <span className="text-white">Abstain</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-label-md text-text-secondary font-medium mr-1">{votingStats.abstain}</span>
                  <span className="text-label-sm text-text-secondary">({abstainPercentage.toFixed(1)}%)</span>
                </div>
              </button>
            </div>
          )}
          
          {hasVoted && (
            <div className="mt-4 p-3 bg-teal/10 border border-teal/30 rounded-lg">
              <p className="text-teal flex items-center gap-2">
                <FaCheckCircle size={14} />
                <span className="text-label-md">Your vote has been recorded!</span>
              </p>
            </div>
          )}
        </div>
        
        {/* Results Section */}
        <div className="p-4 border-t border-border">
          <h3 className="text-label-lg font-medium text-white mb-4">Results</h3>
          
          <div className="space-y-4">
            {/* For */}
            <div className="mb-4">
              <div className="flex justify-between text-label-md mb-1">
                <span className="text-text-secondary">For</span>
                <span className="text-teal">{yesPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={yesPercentage} variant="positive" className="mb-1" />
              <div className="text-label-sm text-text-secondary">{votingStats.yes} τ</div>
            </div>
            
            {/* Against */}
            <div className="mb-4">
              <div className="flex justify-between text-label-md mb-1">
                <span className="text-text-secondary">Against</span>
                <span className="text-gradient-orange">{noPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={noPercentage} variant="negative" className="mb-1" />
              <div className="text-label-sm text-text-secondary">{votingStats.no} τ</div>
            </div>
            
            {/* Abstain */}
            <div className="mb-4">
              <div className="flex justify-between text-label-md mb-1">
                <span className="text-text-secondary">Abstain</span>
                <span className="text-text-secondary">{abstainPercentage.toFixed(1)}%</span>
              </div>
              <div className="relative h-1 w-full overflow-hidden rounded-full bg-background mb-1">
                <div className="h-full bg-text-secondary" style={{ width: `${abstainPercentage}%` }}></div>
              </div>
              <div className="text-label-sm text-text-secondary">{votingStats.abstain} τ</div>
            </div>
            
            <div className="pt-2 border-t border-border flex justify-between text-white">
              <span className="text-label-md">Total Votes</span>
              <div>
                <span className="font-medium">{votingStats.total_votes}</span>
                <span className="text-text-secondary ml-1">τ</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="p-4 border-t border-border">
          <h3 className="text-label-lg font-medium text-white mb-4">Timeline</h3>
          
          <div className="relative border-l-2 border-border pl-4 pb-4">
            {/* Created */}
            <div className="mb-6 relative">
              <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-teal"></div>
              <div className="ml-4">
                <p className="text-label-md font-medium text-white">Created</p>
                <p className="text-label-sm text-text-secondary">{formatDate(timeline.created)}</p>
              </div>
            </div>
            
            {/* Voting Start */}
            <div className="mb-6 relative">
              <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-teal"></div>
              <div className="ml-4">
                <p className="text-label-md font-medium text-white">Voting Start</p>
                <p className="text-label-sm text-text-secondary">{formatDate(timeline.start)}</p>
              </div>
            </div>
            
            {/* Voting End */}
            <div className="relative">
              <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${hasVotingEnded() ? "bg-teal" : "bg-border"}`}></div>
              <div className="ml-4">
                <p className="text-label-md font-medium text-white">Voting End</p>
                <p className="text-label-sm text-text-secondary">{formatDate(timeline.end)}</p>
              </div>
            </div>
            
            {/* Result (if voting has ended) */}
            {hasVotingEnded() && (
              <div className="mt-6 relative">
                <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${didProposalPass() ? "bg-teal" : "bg-gradient-orange"}`}></div>
                <div className="ml-4">
                  <p className={`text-label-md font-medium ${didProposalPass() ? "text-teal" : "text-gradient-orange"}`}>
                    {didProposalPass() ? "Passed" : "Failed"}
                  </p>
                  <p className="text-label-sm text-text-secondary">{formatDate(new Date())}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingPanel;