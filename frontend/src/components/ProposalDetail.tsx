import React from 'react';
import { useProposalDetail } from '@/hooks/useProposalDetail';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const ProposalDetail: React.FC = () => {
  const { proposal, loading, error } = useProposalDetail();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse flex flex-col space-y-4 w-full max-w-2xl">
          <div className="h-10 bg-background-secondary rounded-md w-3/4"></div>
          <div className="h-24 bg-background-secondary rounded-md w-full"></div>
          <div className="h-32 bg-background-secondary rounded-md w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-chart-negative mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-header-sm font-medium mb-2">Error Loading Proposal</h3>
            <p className="text-text-secondary mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-text-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-header-sm font-medium mb-2">No Proposal Found</h3>
            <p className="text-text-secondary mb-4">The proposal you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format the date if available
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get created date or use a fallback
  const createdDate = formatDate(proposal.created_at || new Date().toISOString());

  // Calculate voting percentages
  const totalVotes = proposal.voting_stats.total_votes || 1; // Avoid division by zero
  const yesPercentage = (proposal.voting_stats.yes / totalVotes) * 100;
  const noPercentage = (proposal.voting_stats.no / totalVotes) * 100;
  const abstainPercentage = (proposal.voting_stats.abstain / totalVotes) * 100;
  
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-text-secondary text-label-md mb-2">
          <span>Proposal #{proposal._id.substring(0, 6)}</span>
          <span className="h-1 w-1 rounded-full bg-border"></span>
          <span>Created {createdDate}</span>
          <span className="h-1 w-1 rounded-full bg-border"></span>
          <span className="bg-teal/10 text-teal px-2 py-0.5 rounded">Active</span>
        </div>
        
        <h1 className="text-display-sm font-medium mb-3 text-white">{proposal.content.summary}</h1>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col p-4 rounded-lg bg-card border border-border">
            <span className="text-text-secondary text-label-md mb-1">Yes</span>
            <div className="flex items-baseline">
              <span className="text-header-md font-medium text-teal mr-1">{proposal.voting_stats.yes}</span>
              <span className="text-label-md text-teal">({yesPercentage.toFixed(1)}%)</span>
            </div>
          </div>
          
          <div className="flex flex-col p-4 rounded-lg bg-card border border-border">
            <span className="text-text-secondary text-label-md mb-1">No</span>
            <div className="flex items-baseline">
              <span className="text-header-md font-medium text-gradient-orange mr-1">{proposal.voting_stats.no}</span>
              <span className="text-label-md text-gradient-orange">({noPercentage.toFixed(1)}%)</span>
            </div>
          </div>
          
          <div className="flex flex-col p-4 rounded-lg bg-card border border-border">
            <span className="text-text-secondary text-label-md mb-1">Abstain</span>
            <div className="flex items-baseline">
              <span className="text-header-md font-medium text-text-secondary mr-1">{proposal.voting_stats.abstain}</span>
              <span className="text-label-md text-text-secondary">({abstainPercentage.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
        
        {/* Progress bars */}
        <div className="mb-8 space-y-2">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-teal">Yes</span>
              <span className="text-teal">{yesPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={yesPercentage} variant="positive" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gradient-orange">No</span>
              <span className="text-gradient-orange">{noPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={noPercentage} variant="negative" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Abstain</span>
              <span className="text-text-secondary">{abstainPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={abstainPercentage} className="bg-background-secondary">
              <div 
                className="h-full bg-text-secondary" 
                style={{ width: `${abstainPercentage}%` }}
              />
            </Progress>
          </div>
          
          <div className="pt-2 flex justify-between items-center text-sm">
            <span className="text-text-secondary">Total Votes</span>
            <span className="text-white font-medium">{proposal.voting_stats.total_votes} τ</span>
          </div>
        </div>
      </div>
      
      {/* Proposal content */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-header-sm font-medium mb-4">Abstract</h2>
          <p className="text-text-secondary mb-6">{proposal.content.abstract}</p>
          
          {proposal.content.details && (
            <>
              <h2 className="text-header-sm font-medium mb-4">Details</h2>
              <p className="text-text-secondary whitespace-pre-line">{proposal.content.details}</p>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Metadata */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-header-sm font-medium mb-4">Proposal Metadata</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-text-secondary text-label-md mb-1">Created</p>
              <p className="text-white">{createdDate}</p>
            </div>
            
            <div>
              <p className="text-text-secondary text-label-md mb-1">Proposal ID</p>
              <p className="text-white font-mono text-sm">{proposal._id}</p>
            </div>
            
            <div>
              <p className="text-text-secondary text-label-md mb-1">Status</p>
              <p className="text-teal">Active</p>
            </div>
            
            <div>
              <p className="text-text-secondary text-label-md mb-1">Total Votes</p>
              <p className="text-white">{proposal.voting_stats.total_votes} τ</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalDetail;