import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useVote } from "@/hooks/useVote";
import { useSocket } from "@/hooks/useSocket";
import WalletConnectButton from "@/components/ui/WalletConnectButton";
import { FaClock, FaCheckCircle, FaMinusCircle, FaTimesCircle, FaLock, FaCheck } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/contexts/AppContext";

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
  dates: {
    votingCreatedAt: string;
    votingStart: string;
    votingEnd: string;
  };
  isVotingClosed: boolean;
  endDateFormatted: string;
}

const VotingPanel: React.FC<VotingPanelProps> = ({ proposalId, votingStats: initialVotingStats, dates, isVotingClosed, endDateFormatted }) => {
  const { vote, loading, error } = useVote(proposalId);
  const socket = useSocket();
  const { walletAddress, taoBalance } = useAppContext();
  const [votingStats, setVotingStats] = useState<VotingStats>(initialVotingStats);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [selectedVote, setSelectedVote] = useState<"yes" | "no" | "abstain" | null>(null);
  const [showWalletAlert, setShowWalletAlert] = useState<boolean>(false);
  
  // Calculate the timeline directly using the dates prop
  const timeline = {
    created: new Date(dates.votingCreatedAt),
    start: new Date(dates.votingStart),
    end: new Date(dates.votingEnd)
  };

  // keep a "now" that ticks every minute
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(iv);
  }, []);

  // format a delta‐ms into "Xd Yh Zm"
  const formatTimeRemaining = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const days    = Math.floor(totalSec / 86400);
    const hours   = Math.floor((totalSec % 86400) / 3600);
    const mins    = Math.floor((totalSec % 3600) / 60);
    const parts: string[] = [];
    if (days)  parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    parts.push(`${mins}m`);
    return parts.join(" ");
  };

  // decide what to show in the header badge
  const isBeforeStart = now < timeline.start;
  const isActive      = now >= timeline.start && now <= timeline.end;
  const isEnded       = now > timeline.end;

  const getHeaderLabel = () => {
    if (isBeforeStart) {
      return `Starts in ${formatTimeRemaining(timeline.start.getTime() - now.getTime())}`;
    }
    if (isActive) {
      return `Ends in ${formatTimeRemaining(timeline.end.getTime() - now.getTime())}`;
    }
    return `Voting ended on ${endDateFormatted}`;
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
    if (!walletAddress) {
      setShowWalletAlert(true);
      return;
    }
    
    if (isVotingClosed) {
      return;
    }
    
    if (hasVoted) return;
    
    // Special case for hardcoded wallet address - allow voting without TAO
    const hardcodedWallet = "5EefNBdLJjKWd2LrX8EzrucPHVBd4FyNmvY925NsQQQJzgC4";
    
    if (taoBalance <= 0 && walletAddress !== hardcodedWallet) {
      alert("You need TAO tokens to vote. Your current balance is 0.");
      return;
    }

    // Set a default vote weight of 1 if this is the hardcoded wallet with 0 balance
    const voteWeight = (walletAddress === hardcodedWallet && taoBalance <= 0) ? 1 : taoBalance;

    const result = await vote(voteType, walletAddress, voteWeight);
    if (result) {
      // Update local state
      setSelectedVote(voteType);
      setHasVoted(true);
      
      // Save to localStorage
      const votedProposals = JSON.parse(localStorage.getItem("votedProposals") || "{}");
      votedProposals[proposalId] = true;
      votedProposals[proposalId + "_type"] = voteType;
      votedProposals[proposalId + "_weight"] = voteWeight;
      localStorage.setItem("votedProposals", JSON.stringify(votedProposals));
      
      // Update voting stats locally to provide immediate feedback
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
  const isVotingActive = !isVotingClosed;

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
  const hasVotingEnded = () => isVotingClosed;

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
    // We don't need this anymore as we're using the global context
    // setAccount(address);
    // setTaoBalance(balance);
  };

  return (
    <motion.div 
      className="w-full h-full bg-[#141414] rounded-2xl overflow-hidden shadow-lg font-['TWK_Everett']"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Wallet Connect Alert Modal */}
      <AnimatePresence>
        {showWalletAlert && (
          <motion.div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWalletAlert(false)}
          >
            <motion.div 
              className="bg-[#1A1A1A] rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-800"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00DBBC]">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white">Connect Wallet</h3>
                <button 
                  className="ml-auto text-gray-400 hover:text-white"
                  onClick={() => setShowWalletAlert(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <p className="text-gray-300 mb-6">Please connect your wallet to cast a vote on this proposal.</p>
              <div className="flex flex-col gap-4">
                {/* WalletConnectButton with better styling */}
                <div className="w-full">
                  <WalletConnectButton 
                    onConnect={(address, balance) => {
                      // Close the modal when wallet is connected
                      setShowWalletAlert(false);
                    }} 
                  />
                </div>
                
                <motion.button
                  className="w-full py-3 px-4 bg-[#1E1E1E] text-gray-300 rounded-xl font-medium text-sm border border-gray-700 hover:text-white hover:border-gray-500 transition-colors duration-200"
                  whileHover={{ scale: 1.02, backgroundColor: "#252525" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowWalletAlert(false)}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full">
        <div className="p-6">
          <h2 className="text-xl font-medium text-white mb-6">Cast Your Vote</h2>
        
          {/* Voting Options */}
          {isVotingActive ? (
            <div className="space-y-4 mb-6">
              <motion.button
                className={`w-full p-4 rounded-xl text-left flex items-center justify-between transition-all duration-200 ${
                  selectedVote === "yes" 
                    ? "bg-[#00DBBC]/10 border border-[#00DBBC] text-[#00DBBC]" 
                    : "bg-[#1A1A1A] text-white hover:border-[#00DBBC]/50 hover:bg-[#00DBBC]/5"
                }`}
                onClick={() => setSelectedVote("yes")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={hasVotingEnded() || hasVoted}
              >
                <span className="flex items-center">
                  <motion.span 
                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedVote === "yes" ? "border-[#00DBBC]" : "border-gray-600"
                    }`}
                  >
                    {selectedVote === "yes" && (
                      <motion.div 
                        className="w-2.5 h-2.5 rounded-full bg-[#00DBBC]"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.span>
                  Yes
                </span>
                {selectedVote === "yes" && (
                  <motion.svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </motion.svg>
                )}
              </motion.button>
              
              <motion.button
                className={`w-full p-4 rounded-xl text-left flex items-center justify-between transition-all duration-200 ${
                  selectedVote === "no" 
                    ? "bg-[#EB5347]/10 border border-[#EB5347] text-[#EB5347]" 
                    : "bg-[#1A1A1A] text-white hover:border-[#EB5347]/50 hover:bg-[#EB5347]/5"
                }`}
                onClick={() => setSelectedVote("no")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={hasVotingEnded() || hasVoted}
              >
                <span className="flex items-center">
                  <motion.span 
                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedVote === "no" ? "border-[#EB5347]" : "border-gray-600"
                    }`}
                  >
                    {selectedVote === "no" && (
                      <motion.div 
                        className="w-2.5 h-2.5 rounded-full bg-[#EB5347]"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.span>
                  No
                </span>
                {selectedVote === "no" && (
                  <motion.svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </motion.svg>
                )}
              </motion.button>
              
              <motion.button
                className={`w-full p-4 rounded-xl text-left flex items-center justify-between transition-all duration-200 ${
                  selectedVote === "abstain" 
                    ? "bg-white/10 border border-white text-white" 
                    : "bg-[#1A1A1A] text-white hover:border-white/50 hover:bg-white/5"
                }`}
                onClick={() => setSelectedVote("abstain")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={hasVotingEnded() || hasVoted}
              >
                <span className="flex items-center">
                  <motion.span 
                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedVote === "abstain" ? "border-white" : "border-gray-600"
                    }`}
                  >
                    {selectedVote === "abstain" && (
                      <motion.div 
                        className="w-2.5 h-2.5 rounded-full bg-white"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.span>
                  Abstain
                </span>
                {selectedVote === "abstain" && (
                  <motion.svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </motion.svg>
                )}
              </motion.button>
            </div>
          ) : (
            <p className="mt-4 text-center text-white/50 italic">
              Voting has closed — here are the results.
            </p>
          )}
          
          <motion.button
            className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
              !selectedVote || hasVoted || hasVotingEnded()
                ? "bg-[#1A1A1A] text-gray-500 cursor-not-allowed"
                : selectedVote === "yes"
                ? "bg-[#00DBBC] text-black hover:bg-[#00DBBC]/90"
                : selectedVote === "no"
                ? "bg-[#EB5347] text-white hover:bg-[#EB5347]/90"
                : "bg-white text-black hover:bg-white/90"
            }`}
            onClick={() => handleVote(selectedVote!)}
            whileHover={!hasVoted && selectedVote && !hasVotingEnded() ? { scale: 1.02 } : {}}
            whileTap={!hasVoted && selectedVote && !hasVotingEnded() ? { scale: 0.98 } : {}}
            disabled={!selectedVote || hasVoted || hasVotingEnded()}
          >
            {hasVoted ? "Vote Cast" : hasVotingEnded() ? "Voting Ended" : "Cast Vote"}
          </motion.button>
          
          {hasVoted && (
            <motion.div 
              className="mt-3 text-center text-gray-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              You voted {selectedVote === "yes" ? "Yes" : selectedVote === "no" ? "No" : "Abstain"}
            </motion.div>
          )}
        </div>

        {/* Results Section */}
        <motion.div 
          className="p-6 bg-[#141414] mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-medium text-white mb-5">Results</h3>
          
          <div className="space-y-5">
            {/* For */}
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">For</span>
                <motion.span 
                  className="text-[#00DBBC]"
                  animate={selectedVote === "yes" ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: selectedVote === "yes" ? 1 : 0 }}
                >
                  {yesPercentage.toFixed(1)}%
                </motion.span>
              </div>
              <motion.div className="relative h-[3px] w-full overflow-hidden rounded-full bg-[#1A1A1A] mb-1">
                <motion.div 
                  className="h-full bg-[#00DBBC]" 
                  initial={{ width: 0 }}
                  animate={{ width: `${yesPercentage}%` }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                ></motion.div>
              </motion.div>
              <div className="text-xs text-gray-400">{votingStats.yes} τ</div>
            </div>
            
            {/* Against */}
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Against</span>
                <motion.span 
                  className="text-[#EB5347]"
                  animate={selectedVote === "no" ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: selectedVote === "no" ? 1 : 0 }}
                >
                  {noPercentage.toFixed(1)}%
                </motion.span>
              </div>
              <motion.div className="relative h-[3px] w-full overflow-hidden rounded-full bg-[#1A1A1A] mb-1">
                <motion.div 
                  className="h-full bg-[#EB5347]" 
                  initial={{ width: 0 }}
                  animate={{ width: `${noPercentage}%` }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                ></motion.div>
              </motion.div>
              <div className="text-xs text-gray-400">{votingStats.no} τ</div>
            </div>
            
            {/* Abstain */}
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Abstain</span>
                <motion.span 
                  className="text-white"
                  animate={selectedVote === "abstain" ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: selectedVote === "abstain" ? 1 : 0 }}
                >
                  {abstainPercentage.toFixed(1)}%
                </motion.span>
              </div>
              <motion.div className="relative h-[3px] w-full overflow-hidden rounded-full bg-[#1A1A1A] mb-1">
                <motion.div 
                  className="h-full bg-white" 
                  initial={{ width: 0 }}
                  animate={{ width: `${abstainPercentage}%` }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                ></motion.div>
              </motion.div>
              <div className="text-xs text-gray-400">{votingStats.abstain} τ</div>
            </div>
            
            <motion.div 
              className="pt-3 flex justify-between text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <span className="text-sm">Total Votes</span>
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
                <span className="text-gray-400 ml-1">τ</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Timeline */}
        <motion.div 
          className="p-6 bg-[#141414]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-lg font-medium text-white mb-5">Timeline</h3>
          
          <div className="relative border-l border-[rgba(255,255,255,0.1)] pl-4 pb-4">
            {/* Created */}
            <motion.div 
              className="mb-8 relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div 
                className="absolute -left-[3px] top-0 w-[5px] h-[5px] rounded-full bg-white"
                animate={
                  isBeforeStart
                    ? {
                        boxShadow: [
                          "0 0 0px rgba(255,255,255,0)",
                          "0 0 5px rgba(255,255,255,0.7)",
                          "0 0 0px rgba(255,255,255,0)",
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: isBeforeStart ? Infinity : 0,
                  repeatType: "reverse",
                }}
              ></motion.div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white">Created</p>
                <p className="text-xs text-gray-400">{formatDate(timeline.created)}</p>
              </div>
            </motion.div>
            
            {/* Voting Start */}
            <motion.div 
              className="mb-8 relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              <motion.div 
                className={`absolute -left-[3px] top-0 w-[5px] h-[5px] rounded-full ${
                  isBeforeStart
                    ? "bg-white/50"
                    : isActive
                    ? "bg-[#00DBBC]"
                    : "bg-white"
                }`}
                animate={
                  isActive
                    ? {
                        boxShadow: [
                          "0 0 0px rgba(0,219,188,0)",
                          "0 0 5px rgba(0,219,188,0.7)",
                          "0 0 0px rgba(0,219,188,0)",
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: isActive ? Infinity : 0,
                  repeatType: "reverse",
                  delay: 0.7,
                }}
              ></motion.div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white">Voting Start</p>
                <p className="text-xs text-gray-400">{formatDate(timeline.start)}</p>
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
                className={`absolute -left-[3px] top-0 w-[5px] h-[5px] rounded-full ${
                  isActive
                    ? "bg-white/50"
                    : isEnded
                    ? "bg-white"
                    : "bg-white/50"
                }`}
                animate={
                  isEnded
                    ? {
                        boxShadow: [
                          "0 0 0px rgba(255,255,255,0)",
                          "0 0 5px rgba(255,255,255,0.7)",
                          "0 0 0px rgba(255,255,255,0)",
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: isEnded ? Infinity : 0,
                  repeatType: "reverse",
                  delay: 1.4,
                }}
              ></motion.div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white">Voting End</p>
                <p className="text-xs text-gray-400">{formatDate(timeline.end)}</p>
              </div>
            </motion.div>
            
            {/* Result (if voting has ended) */}
            {isEnded && (
              <motion.div 
                className="mt-8 relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <motion.div 
                  className={`absolute -left-[3px] top-0 w-[5px] h-[5px] rounded-full ${
                    didProposalPass() ? "bg-[#00DBBC]" : "bg-[#EB5347]"
                  }`}
                  animate={{
                    boxShadow: didProposalPass()
                      ? [
                          "0 0 0px rgba(0,219,188,0)",
                          "0 0 8px rgba(0,219,188,0.9)",
                          "0 0 0px rgba(0,219,188,0)",
                        ]
                      : [
                          "0 0 0px rgba(235,83,71,0)",
                          "0 0 8px rgba(235,83,71,0.9)",
                          "0 0 0px rgba(235,83,71,0)",
                        ],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                ></motion.div>
                <div className="ml-4">
                  <motion.p
                    className={`text-sm font-medium ${
                      didProposalPass() ? "text-[#00DBBC]" : "text-[#EB5347]"
                    }`}
                    animate={{ 
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 2, repeat: 2, repeatType: "reverse" }}
                  >
                    {didProposalPass() ? "Passed" : "Failed"}
                  </motion.p>
                  <p className="text-xs text-gray-400">{formatDate(new Date())}</p>
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