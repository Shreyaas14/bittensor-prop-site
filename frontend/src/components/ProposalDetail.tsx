import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProposalDetail } from '@/hooks/useProposalDetail';

const ProposalDetail: React.FC = () => {
  const { proposal, loading, error } = useProposalDetail();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!proposal) return <p>No proposal found</p>;

  return (
    <div className="space-y-4">
      {/* Card 1: Title, Wallet Address, Summary */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle>{proposal.content.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Wallet Address: {proposal.walletAddress}
          </p>
          <p>{proposal.content.summary}</p>
        </CardContent>
      </Card>

      {/* Card 2: Abstract */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Abstract</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{proposal.content.abstract}</p>
        </CardContent>
      </Card>

      {/* Card 3: Full Proposal */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Full Proposal</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{proposal.content.full_proposal}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalDetail;
