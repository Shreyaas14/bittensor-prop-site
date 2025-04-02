import React from 'react';
import { useProposalDetail } from '@/hooks/useProposalDetail';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

// Define interfaces for your proposal data
interface ProposalContent {
  summary: string;
  abstract?: string;
  details?: string;
  // Add other content properties as needed
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
  // Add other proposal properties as needed
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
        return "bg-teal";
      case "negative":
        return "bg-gradient-orange";
      default:
        return "bg-text-secondary";
    }
  };

  return (
    <div className={`relative h-1 w-full overflow-hidden rounded-full bg-background-secondary ${className}`}>
      <div
        className={`h-full transition-all ${getIndicatorColor()}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

const ProposalDetail: React.FC = () => {
  const { proposal, loading, error } = useProposalDetail();

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

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col items-center p-8">
          <h3 className="text-header-md font-medium text-white mb-2">Error Loading Proposal</h3>
          <p className="text-text-secondary mb-6 text-center">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-teal hover:opacity-90 text-black font-medium">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col items-center p-8">
          <h3 className="text-header-md font-medium text-white mb-2">No Proposal Selected</h3>
          <p className="text-text-secondary mb-6 text-center">
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

  // Voting percentages
  const totalVotes = proposal.voting_stats.total_votes || 1; // Avoid division by zero
  const yesPercentage = (proposal.voting_stats.yes / totalVotes) * 100;
  const noPercentage = (proposal.voting_stats.no / totalVotes) * 100;
  const abstainPercentage = (proposal.voting_stats.abstain / totalVotes) * 100;

  // Get content from proposal
  const proposalAbstract = proposal.content?.abstract || '';
  const proposalDetails = proposal.content?.details && typeof proposal.content.details === 'string'
    ? proposal.content.details
    : '';

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Simple Header - This will appear at the top of the main content area */}
      <div className="mb-8">
        <h1 className="text-header-lg font-medium text-white mb-2">Governance Proposals</h1>
      </div>

      {/* Proposal Content - Only shown when a proposal is selected */}
      {proposal && (
        <div className="w-full">
          {/* Proposal Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 text-text-secondary text-label-md mb-3">
              <span>Proposal #{proposal._id.substring(0, 6)}</span>
              <span className="h-1 w-1 rounded-full bg-border"></span>
              <span>Created {createdDate}</span>
              <span className="h-1 w-1 rounded-full bg-border"></span>
              <span className="bg-white/10 text-white px-2 py-0.5 rounded">Active</span>
            </div>
            
            <h1 className="text-header-lg font-medium mb-8 text-white leading-tight">
              {proposal.content.summary}
            </h1>

            {/* Voting Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-5 rounded-lg bg-card border border-border">
                <span className="text-white text-label-md mb-2">Yes</span>
                <div className="flex items-baseline">
                  <span className="text-header-md font-medium text-white mr-2">{proposal.voting_stats.yes}</span>
                  <span className="text-label-md text-white">({yesPercentage.toFixed(1)}%)</span>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-card border border-border">
                <span className="text-white text-label-md mb-2">No</span>
                <div className="flex items-baseline">
                  <span className="text-header-md font-medium text-white mr-2">{proposal.voting_stats.no}</span>
                  <span className="text-label-md text-white">({noPercentage.toFixed(1)}%)</span>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-card border border-border">
                <span className="text-text-secondary text-label-md mb-2">Abstain</span>
                <div className="flex items-baseline">
                  <span className="text-header-md font-medium text-text-secondary mr-2">{proposal.voting_stats.abstain}</span>
                  <span className="text-label-md text-text-secondary">({abstainPercentage.toFixed(1)}%)</span>
                </div>
              </div>
            </div>

            {/* Proposal Content */}
            <motion.div 
              className="mb-10"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-header-sm font-medium mb-4 text-white">Abstract</h2>
              <div className="text-text-secondary prose prose-invert max-w-none leading-relaxed p-4">
                {proposalAbstract.split('\n').map((para, idx) => (
                  para.trim() ? <p key={idx} className="mb-4">{para}</p> : <br key={idx} />
                ))}
              </div>
            </motion.div>

            {proposalDetails && (
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-10"
              >
                <h2 className="text-header-sm font-medium mb-4 text-white">Details</h2>
                <div className="text-text-secondary prose prose-invert max-w-none leading-relaxed p-4 bg-card border border-border rounded-lg">
                  {proposalDetails.split('\n').map((para: string, idx: number) => (
                    para.trim() ? <p key={idx} className="mb-4">{para}</p> : <br key={idx} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Proposal Metadata */}
            <motion.div 
              className="mb-6 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-header-sm font-medium mb-6 text-white">Proposal Metadata</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-4">
                <div>
                  <p className="text-text-secondary text-label-md mb-1">Created</p>
                  <p className="text-white">{createdDate}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-label-md mb-1">Proposal ID</p>
                  <p className="text-white font-mono text-sm truncate">{proposal._id}</p>
                </div>
                {proposal.walletAddress && (
                  <div>
                    <p className="text-text-secondary text-label-md mb-1">Proposer</p>
                    <p className="text-white font-mono text-sm truncate">{proposal.walletAddress}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
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
      )}

      {/* Error state */}
      {error && (
        <div className="w-full max-w-md flex flex-col items-center p-8">
          <h3 className="text-header-md font-medium text-white mb-2">Error Loading Proposal</h3>
          <p className="text-text-secondary mb-6 text-center">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-teal hover:opacity-90 text-black font-medium">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProposalDetail;
