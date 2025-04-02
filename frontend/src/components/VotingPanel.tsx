import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useVote } from "@/hooks/useVote";
import { useSocket } from "@/hooks/useSocket";
import WalletConnectButton from "@/components/ui/WalletConnectButton";
import { FaClock, FaCheckCircle, FaMinusCircle, FaTimesCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

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
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col flex-1 bg-background-secondary border-l border-border overflow-hidden"
    >
      {/* Header */}
      <motion.div 
        className="p-4 border-b border-border sticky top-0 z-10 bg-background-secondary"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-header-sm font-medium text-white">Cast Vote</h2>
          <motion.div 
            className="flex items-center gap-2 bg-background px-3 py-1 rounded-full"
            animate={{ 
              scale: [1, 1.03, 1],
              backgroundColor: ["rgba(12, 12, 12, 0.8)", "rgba(0, 219, 188, 0.1)", "rgba(12, 12, 12, 0.8)"]
            }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          >
            <FaClock className="text-teal" size={12} />
            <span className="text-teal text-label-sm">{getTimeRemaining()}</span>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Voting Section - Add scrollable container */}
      <div className="flex-1 overflow-y-auto h-full">
        <div className="p-4">
          {!account ? (
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-text-secondary mb-4">Connect your wallet to cast your vote on this proposal.</p>
              <WalletConnectButton onConnect={handleWalletConnect} />
            </motion.div>
          ) : (
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {/* Connected wallet info */}
              <motion.div 
                className="p-3 rounded-lg bg-card border border-border mb-6"
                whileHover={{ 
                  boxShadow: "0 0 8px rgba(0, 219, 188, 0.2)",
                  borderColor: "rgba(0, 219, 188, 0.5)"
                }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-label-md text-text-secondary">Connected Wallet</span>
                  {hasVoted && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-label-xs text-white"
                    >
                      Voted
                    </motion.span>
                  )}
                </div>
                <div className="font-mono text-label-md text-white truncate">
                  {account.substring(0, 8)}...{account.substring(account.length - 6)}
                </div>
                <div className="mt-2 flex items-baseline">
                  <span className="text-label-lg font-medium text-white">{taoBalance}</span>
                  <span className="text-label-sm text-text-secondary ml-1">τ</span>
                </div>
              </motion.div>
              
              {/* For */}
              <motion.button 
                onClick={() => !hasVoted && isVotingActive && handleVote("yes")}
                disabled={hasVoted || !isVotingActive}
                whileHover={!hasVoted && isVotingActive ? { scale: 1.02, boxShadow: "0 0 10px rgba(0, 219, 188, 0.3)" } : {}}
                whileTap={!hasVoted && isVotingActive ? { scale: 0.98 } : {}}
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
                  <motion.span 
                    className="text-label-md text-teal font-medium mr-1"
                    animate={selectedVote === "yes" ? { 
                      scale: [1, 1.1, 1],
                    } : {}}
                    transition={{ duration: 1, repeat: selectedVote === "yes" ? 1 : 0 }}
                  >
                    {votingStats.yes}
                  </motion.span>
                  <span className="text-label-sm text-teal">({yesPercentage.toFixed(1)}%)</span>
                </div>
              </motion.button>
              
              {/* Against */}
              <motion.button 
                onClick={() => !hasVoted && isVotingActive && handleVote("no")}
                disabled={hasVoted || !isVotingActive}
                whileHover={!hasVoted && isVotingActive ? { scale: 1.02, boxShadow: "0 0 10px rgba(255, 139, 37, 0.3)" } : {}}
                whileTap={!hasVoted && isVotingActive ? { scale: 0.98 } : {}}
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
                  <motion.span 
                    className="text-label-md text-gradient-orange font-medium mr-1"
                    animate={selectedVote === "no" ? { 
                      scale: [1, 1.1, 1],
                    } : {}}
                    transition={{ duration: 1, repeat: selectedVote === "no" ? 1 : 0 }}
                  >
                    {votingStats.no}
                  </motion.span>
                  <span className="text-label-sm text-gradient-orange">({noPercentage.toFixed(1)}%)</span>
                </div>
              </motion.button>
              
              {/* Abstain */}
              <motion.button 
                onClick={() => !hasVoted && isVotingActive && handleVote("abstain")}
                disabled={hasVoted || !isVotingActive}
                whileHover={!hasVoted && isVotingActive ? { scale: 1.02, boxShadow: "0 0 10px rgba(170, 170, 170, 0.2)" } : {}}
                whileTap={!hasVoted && isVotingActive ? { scale: 0.98 } : {}}
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
                  <motion.span 
                    className="text-label-md text-text-secondary font-medium mr-1"
                    animate={selectedVote === "abstain" ? { 
                      scale: [1, 1.1, 1],
                    } : {}}
                    transition={{ duration: 1, repeat: selectedVote === "abstain" ? 1 : 0 }}
                  >
                    {votingStats.abstain}
                  </motion.span>
                  <span className="text-label-sm text-text-secondary">({abstainPercentage.toFixed(1)}%)</span>
                </div>
              </motion.button>
            </motion.div>
          )}
          
          {hasVoted && (
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mt-4"
              >
                <motion.p 
                  className="text-white flex items-center gap-2"
                  animate={{ 
                    color: ["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0.8)"] 
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
                    transition={{ duration: 1.5, repeat: 1 }}
                  >
                    <FaCheckCircle className="text-white" size={14} />
                  </motion.span>
                  <span className="text-label-md">Your vote has been recorded!</span>
                </motion.p>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        
        {/* Results Section */}
        <motion.div 
          className="p-4 border-t border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-label-lg font-medium text-white mb-4">Results</h3>
          
          <div className="space-y-4">
            {/* For */}
            <div className="mb-4">
              <div className="flex justify-between text-label-md mb-1">
                <span className="text-text-secondary">For</span>
                <motion.span 
                  className="text-teal"
                  animate={selectedVote === "yes" ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: selectedVote === "yes" ? 1 : 0 }}
                >
                  {yesPercentage.toFixed(1)}%
                </motion.span>
              </div>
              <motion.div className="relative h-1 w-full overflow-hidden rounded-full bg-background mb-1">
                <motion.div 
                  className="h-full bg-teal" 
                  initial={{ width: 0 }}
                  animate={{ width: `${yesPercentage}%` }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                ></motion.div>
              </motion.div>
              <div className="text-label-sm text-text-secondary">{votingStats.yes} τ</div>
            </div>
            
            {/* Against */}
            <div className="mb-4">
              <div className="flex justify-between text-label-md mb-1">
                <span className="text-text-secondary">Against</span>
                <motion.span 
                  className="text-gradient-orange"
                  animate={selectedVote === "no" ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: selectedVote === "no" ? 1 : 0 }}
                >
                  {noPercentage.toFixed(1)}%
                </motion.span>
              </div>
              <motion.div className="relative h-1 w-full overflow-hidden rounded-full bg-background mb-1">
                <motion.div 
                  className="h-full bg-gradient-orange" 
                  initial={{ width: 0 }}
                  animate={{ width: `${noPercentage}%` }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                ></motion.div>
              </motion.div>
              <div className="text-label-sm text-text-secondary">{votingStats.no} τ</div>
            </div>
            
            {/* Abstain */}
            <div className="mb-4">
              <div className="flex justify-between text-label-md mb-1">
                <span className="text-text-secondary">Abstain</span>
                <motion.span 
                  className="text-text-secondary"
                  animate={selectedVote === "abstain" ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: selectedVote === "abstain" ? 1 : 0 }}
                >
                  {abstainPercentage.toFixed(1)}%
                </motion.span>
              </div>
              <motion.div className="relative h-1 w-full overflow-hidden rounded-full bg-background mb-1">
                <motion.div 
                  className="h-full bg-text-secondary" 
                  initial={{ width: 0 }}
                  animate={{ width: `${abstainPercentage}%` }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                ></motion.div>
              </motion.div>
              <div className="text-label-sm text-text-secondary">{votingStats.abstain} τ</div>
            </div>
            
            <motion.div 
              className="pt-2 border-t border-border flex justify-between text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <span className="text-label-md">Total Votes</span>
              <div>
                <motion.span 
                  className="font-medium"
                  animate={{ 
                    scale: hasVoted ? [1, 1.05, 1] : 1
                  }}
                  transition={{ duration: 1, delay: 1, repeat: hasVoted ? 1 : 0 }}
                >
                  {votingStats.total_votes}
                </motion.span>
                <span className="text-text-secondary ml-1">τ</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Timeline */}
        <motion.div 
          className="p-4 border-t border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-label-lg font-medium text-white mb-4">Timeline</h3>
          
          <div className="relative border-l-2 border-border pl-4 pb-4">
            {/* Created */}
            <motion.div 
              className="mb-6 relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div 
                className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-white"
                animate={{ 
                  boxShadow: ["0 0 0px rgba(255, 255, 255, 0)", "0 0 5px rgba(255, 255, 255, 0.7)", "0 0 0px rgba(255, 255, 255, 0)"]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              ></motion.div>
              <div className="ml-4">
                <p className="text-label-md font-medium text-white">Created</p>
                <p className="text-label-sm text-text-secondary">{formatDate(timeline.created)}</p>
              </div>
            </motion.div>
            
            {/* Voting Start */}
            <motion.div 
              className="mb-6 relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              <motion.div 
                className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-white"
                animate={{ 
                  boxShadow: ["0 0 0px rgba(255, 255, 255, 0)", "0 0 5px rgba(255, 255, 255, 0.7)", "0 0 0px rgba(255, 255, 255, 0)"]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 0.7 }}
              ></motion.div>
              <div className="ml-4">
                <p className="text-label-md font-medium text-white">Voting Start</p>
                <p className="text-label-sm text-text-secondary">{formatDate(timeline.start)}</p>
              </div>
            </motion.div>
            
            {/* Voting End */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
            >
              <motion.div 
                className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-white ${hasVotingEnded() ? '' : 'opacity-70'}`}
                animate={hasVotingEnded() ? { 
                  boxShadow: ["0 0 0px rgba(255, 255, 255, 0)", "0 0 5px rgba(255, 255, 255, 0.7)", "0 0 0px rgba(255, 255, 255, 0)"]
                } : {}}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 1.4 }}
              ></motion.div>
              <div className="ml-4">
                <p className="text-label-md font-medium text-white">Voting End</p>
                <p className="text-label-sm text-text-secondary">{formatDate(timeline.end)}</p>
              </div>
            </motion.div>
            
            {/* Result (if voting has ended) */}
            {hasVotingEnded() && (
              <motion.div 
                className="mt-6 relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <motion.div 
                  className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-white"
                  animate={{ 
                    boxShadow: ["0 0 0px rgba(255, 255, 255, 0)", "0 0 8px rgba(255, 255, 255, 0.9)", "0 0 0px rgba(255, 255, 255, 0)"],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                ></motion.div>
                <div className="ml-4">
                  <motion.p
                    className={`text-label-md font-medium ${didProposalPass() ? "text-white" : "text-gradient-orange"}`}
                    animate={{ 
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 2, repeat: 2, repeatType: "reverse" }}
                  >
                    {didProposalPass() ? "Passed" : "Failed"}
                  </motion.p>
                  <p className="text-label-sm text-text-secondary">{formatDate(new Date())}</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default VotingPanel;