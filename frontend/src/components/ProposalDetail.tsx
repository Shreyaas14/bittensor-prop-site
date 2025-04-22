import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProposal } from '@/api/api';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import CommentSection from '@/components/CommentSection';
import { useAppContext } from '@/contexts/AppContext';

// Define interfaces for your proposal data
interface ProposalContent {
  title?: string;
  summary?: string;
  abstract?: string;
  details?: string;
  full_proposal?: string;
}

interface VotingStats {
  yes: number;
  no: number;
  abstain: number;
  total_votes: number;
}

interface Proposal {
  _id: string;
  content: ProposalContent;
  voting_stats: VotingStats;
  created_at?: string;
  walletAddress?: string;
  proposal_creator?: string;
}

// Custom Progress component
const Progress: React.FC<{ value: number; variant?: "default" | "positive" | "negative"; className?: string }> = ({
  value = 0,
  variant = "default",
  className,
}) => {
  const getIndicatorColor = () => {
    switch (variant) {
      case "positive":
        return "bg-gradient-to-r from-[#00DBBC] to-[#00DBBC]/80";
      case "negative":
        return "bg-gradient-to-r from-[#EB5347] to-[#EB5347]/80";
      default:
        return "bg-gradient-to-r from-[#FFFFFF] to-[#FFFFFF]/80";
    }
  };

  return (
    <div className={`relative h-[3px] w-full overflow-hidden rounded-full bg-[#2a2a2a] ${className}`}>
      <div
        className={`h-full transition-all duration-500 ease-out ${getIndicatorColor()}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

const ProposalDetail: React.FC = () => {
  const { id } = useParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  // Get the wallet address from the global context
  const { walletAddress } = useAppContext();

  useEffect(() => {
    const fetchProposal = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        // Use the fixed getProposal function
        const data = await getProposal(id);
        console.log("Fetched proposal data:", data); // Debug log
        setProposal(data);
        setError(null);
        setAccount(data.walletAddress || data.proposal_creator || "");
      } catch (err) {
        console.error('Error fetching proposal:', err);
        setError('Failed to load proposal details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="animate-pulse flex flex-col space-y-6 w-full">
          <div className="h-8 bg-background-secondary rounded-md w-3/4"></div>
          <div className="h-32 bg-background-secondary rounded-md w-full"></div>
          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="h-24 bg-background-secondary rounded-md"></div>
            <div className="h-24 bg-background-secondary rounded-md"></div>
            <div className="h-24 bg-background-secondary rounded-md"></div>
          </div>
          <div className="h-64 bg-background-secondary rounded-md w-full"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col items-center p-8">
          <h3 className="text-[24px] leading-[29px] tracking-[-0.03em] font-medium text-white mb-2">Error Loading Proposal</h3>
          <p className="text-[16px] leading-[20px] tracking-[-0.01em] text-text-secondary mb-6 text-center">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-teal hover:opacity-90 text-black font-medium text-[16px] leading-[18px] tracking-[-0.04em]">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // No proposal selected state
  if (!proposal) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col items-center p-8">
          <h3 className="text-[24px] leading-[29px] tracking-[-0.03em] font-medium text-white mb-2">No Proposal Selected</h3>
          <p className="text-[16px] leading-[20px] tracking-[-0.01em] text-text-secondary mb-6 text-center">
            Please select a proposal from the sidebar to view details.
          </p>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get created date
  const createdDate = formatDate(proposal.created_at || new Date().toISOString());

  // Safe access to voting stats
  const votingStats = proposal.voting_stats || { yes: 0, no: 0, abstain: 0, total_votes: 0 };
  const totalVotes = votingStats.total_votes || 1; // Avoid division by zero
  
  // Calculate percentages with safe values
  const yesPercentage = (votingStats.yes / totalVotes) * 100;
  const noPercentage = (votingStats.no / totalVotes) * 100;
  const abstainPercentage = (votingStats.abstain / totalVotes) * 100;

  // Get the actual title from the proposal content
  const proposalTitle = proposal.content?.title || '';
  const proposalSummary = proposal.content?.summary || '';
  const proposalAbstract = proposal.content?.abstract || '';
  const proposalDetails = proposal.content?.details || proposal.content?.full_proposal || '';
  
  // Rename this variable to avoid conflict with the context walletAddress
  const proposerAddress = proposal.walletAddress || proposal.proposal_creator || "";
  
  // Only try to format the address if it exists and is a non-empty string
  let shortWalletAddress = "Unknown";
  if (proposerAddress && typeof proposerAddress === 'string' && proposerAddress.trim().length > 0) {
    if (proposerAddress.length > 10) {
      shortWalletAddress = `${proposerAddress.substring(0, 6)}...${proposerAddress.substring(proposerAddress.length - 4)}`;
    } else {
      shortWalletAddress = proposerAddress;
    }
  }

  return (
    <div className="flex-1 p-8 md:p-12 overflow-auto bg-[#141414] font-['TWK_Everett']">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {/* Header Section - Keep title, remove duplicate summary below */}
        <div className="mb-16">
          <motion.h1 
            className="text-[48px] leading-[60px] tracking-[-0.06em] font-medium text-white mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {proposalSummary}
          </motion.h1>
          
          <motion.div 
            className="flex items-center space-x-4 text-[11px] leading-[16px] tracking-[-0.03em] text-white/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{createdDate}</span>
            </div>
            
            {proposerAddress && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-mono">{shortWalletAddress}</span>
              </div>
            )}
          </motion.div>
        </div>
        
        {/* Voting Stats Section with improved cards and animations */}
        <div className="mb-16">
          <motion.h2 
            className="text-[24px] leading-[29px] tracking-[-0.03em] font-medium text-white mb-8 flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <svg className="w-5 h-5 mr-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Voting Results
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              className="p-6 rounded-2xl bg-gradient-to-b from-[#1c1c1c] to-[#181818] border border-[rgba(255,255,255,0.06)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ 
                y: -5,
                boxShadow: "0 14px 40px rgba(0,219,188,0.15)",
                borderColor: "rgba(0,219,188,0.2)"
              }}
            >
              <div className="flex items-center mb-3">
                <div className="w-2 h-2 rounded-full bg-[#00DBBC] mr-2"></div>
                <span className="text-[11px] leading-[16px] tracking-[-0.03em] text-white/70">Yes</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-[40px] leading-[48px] tracking-[-0.06em] font-medium text-[#00DBBC] mr-2">{votingStats.yes}</span>
                <span className="text-[11px] leading-[16px] tracking-[-0.03em] text-white/70">({yesPercentage.toFixed(1)}%)</span>
              </div>
              <Progress value={yesPercentage} variant="positive" className="mt-5 h-1" />
            </motion.div>
            
            <motion.div 
              className="p-6 rounded-2xl bg-gradient-to-b from-[#1c1c1c] to-[#181818] border border-[rgba(255,255,255,0.06)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ 
                y: -5,
                boxShadow: "0 14px 40px rgba(235,83,71,0.15)",
                borderColor: "rgba(235,83,71,0.2)"
              }}
            >
              <div className="flex items-center mb-3">
                <div className="w-2 h-2 rounded-full bg-[#EB5347] mr-2"></div>
                <span className="text-[11px] leading-[16px] tracking-[-0.03em] text-white/70">No</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-[40px] leading-[48px] tracking-[-0.06em] font-medium text-[#EB5347] mr-2">{votingStats.no}</span>
                <span className="text-[11px] leading-[16px] tracking-[-0.03em] text-white/70">({noPercentage.toFixed(1)}%)</span>
              </div>
              <Progress value={noPercentage} variant="negative" className="mt-5 h-1" />
            </motion.div>
            
            <motion.div 
              className="p-6 rounded-2xl bg-gradient-to-b from-[#1c1c1c] to-[#181818] border border-[rgba(255,255,255,0.06)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ 
                y: -5,
                boxShadow: "0 14px 40px rgba(255,255,255,0.1)",
                borderColor: "rgba(255,255,255,0.15)"
              }}
            >
              <div className="flex items-center mb-3">
                <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                <span className="text-[11px] leading-[16px] tracking-[-0.03em] text-white/70">Abstain</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-[40px] leading-[48px] tracking-[-0.06em] font-medium text-white mr-2">{votingStats.abstain}</span>
                <span className="text-[11px] leading-[16px] tracking-[-0.03em] text-white/70">({abstainPercentage.toFixed(1)}%)</span>
              </div>
              <Progress value={abstainPercentage} className="mt-5 h-1" />
            </motion.div>
          </div>
        </div>
        
        {/* Abstract Section with improved styling */}
        {proposalAbstract && (
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center mb-8">
              <div className="w-1 h-6 bg-gradient-to-b from-white to-white/30 rounded-full mr-4"></div>
              <h2 className="text-[24px] leading-[29px] tracking-[-0.03em] font-medium text-white">Abstract</h2>
            </div>
            
            <div className="px-8 py-10 rounded-2xl bg-gradient-to-b from-[#1c1c1c] to-[#181818] border border-[rgba(255,255,255,0.06)] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <div className="prose prose-invert max-w-none">
                {proposalAbstract.split('\n').map((para, idx) => (
                  para.trim() ? 
                    <p key={idx} className="mb-5 text-[16px] leading-[24px] tracking-[-0.01em] text-white/80 last:mb-0">
                      {para}
                    </p> : 
                    <br key={idx} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Proposal Details Section with improved styling */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="flex items-center mb-8">
            <div className="w-1 h-6 bg-gradient-to-b from-white to-white/30 rounded-full mr-4"></div>
            <h2 className="text-[24px] leading-[29px] tracking-[-0.03em] font-medium text-white">Proposal Details</h2>
          </div>
          
          <div className="px-8 py-10 rounded-2xl bg-gradient-to-b from-[#1c1c1c] to-[#181818] border border-[rgba(255,255,255,0.06)] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="prose prose-invert max-w-none">
              <div className="overflow-auto p-6 bg-[#141414]/80 rounded-xl border border-[rgba(255,255,255,0.04)] text-white/80 whitespace-pre-wrap">
                {proposalDetails.split('\n').map((para, idx) => (
                  para.trim() ? 
                    <p key={idx} className="mb-5 text-[16px] leading-[24px] tracking-[-0.01em] last:mb-0">
                      {para}
                    </p> : 
                    <br key={idx} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Metadata Section with improved styling */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <div className="flex items-center mb-8">
            <div className="w-1 h-6 bg-gradient-to-b from-white to-white/30 rounded-full mr-4"></div>
            <h2 className="text-[24px] leading-[29px] tracking-[-0.03em] font-medium text-white">Proposal Metadata</h2>
          </div>
          
          <div className="px-8 py-10 rounded-2xl bg-gradient-to-b from-[#1c1c1c] to-[#181818] border border-[rgba(255,255,255,0.06)] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div>
                <div className="flex items-center mb-3">
                  <svg className="w-3 h-3 mr-2 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[11px] leading-[16px] tracking-[-0.03em] text-white/50">Created</p>
                </div>
                <p className="text-[16px] leading-[20px] tracking-[-0.01em] text-white pl-5">{createdDate}</p>
              </div>
              
              <div>
                <div className="flex items-center mb-3">
                  <svg className="w-3 h-3 mr-2 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  <p className="text-[11px] leading-[16px] tracking-[-0.03em] text-white/50">Proposal ID</p>
                </div>
                <p className="text-[16px] leading-[21px] tracking-[-0.03em] text-white font-mono truncate pl-5">{proposal._id}</p>
              </div>
              
              {proposerAddress && (
                <div>
                  <div className="flex items-center mb-3">
                    <svg className="w-3 h-3 mr-2 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-[11px] leading-[16px] tracking-[-0.03em] text-white/50">Proposer</p>
                  </div>
                  <p className="text-[16px] leading-[21px] tracking-[-0.03em] text-white font-mono truncate pl-5">{shortWalletAddress}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* Comment Section - Preserved as requested */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <div className="flex items-center mb-8">
            <div className="w-1 h-6 bg-gradient-to-b from-white to-white/30 rounded-full mr-4"></div>
            <h2 className="text-[24px] leading-[29px] tracking-[-0.03em] font-medium text-white">Discussion</h2>
          </div>
          
          <div className="rounded-2xl bg-gradient-to-b from-[#1c1c1c] to-[#181818] border border-[rgba(255,255,255,0.06)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
            <CommentSection proposalId={proposal._id} walletAddress={walletAddress} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProposalDetail;
