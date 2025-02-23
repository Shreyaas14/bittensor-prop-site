import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProposalDetail } from '@/hooks/useProposalDetail';

const ProposalDetail: React.FC = () => {
  const { proposal, loading, error } = useProposalDetail();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!proposal) return <p>No proposal found</p>;

  return (
    <Card className="flex-1 p-4">
      <CardHeader>
        <CardTitle>{proposal.content.summary}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{proposal.content.abstract}</p>
        {/* additional voting details here */}
      </CardContent>
    </Card>
  );
};

export default ProposalDetail;
