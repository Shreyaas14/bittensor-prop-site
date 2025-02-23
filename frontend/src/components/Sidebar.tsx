import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Proposal } from '@/hooks/useProposals';

interface SidebarProps {
  proposals: Proposal[];
}

const Sidebar: React.FC<SidebarProps> = ({ proposals }) => {
  const navigate = useNavigate();

  return (
    <aside className="w-64 p-4 border-r space-y-4">
      {/* List of Proposals */}
      {proposals.length > 0 ? (
        proposals.map((proposal) => (
          <Card
            key={proposal._id}
            className="mb-4 cursor-pointer hover:bg-gray-100 transition"
            onClick={() => navigate(`/proposals/${proposal._id}`)}
          >
            <CardHeader>
              <CardTitle>{proposal.content.summary}</CardTitle>
            </CardHeader>
            <p className="text-sm text-muted-foreground p-2">
              {proposal.content.abstract}
            </p>
          </Card>
        ))
      ) : (
        <p className="text-gray-500 text-sm">No proposals available.</p>
      )}
    </aside>
  );
};

export default Sidebar;
