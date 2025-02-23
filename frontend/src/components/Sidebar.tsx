// src/components/Sidebar.tsx
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
    <aside className="w-64 p-4 border-r">
      {proposals.map((proposal) => (
        <Card
          key={proposal._id}
          className="mb-4 cursor-pointer"
          onClick={() => navigate(`/proposals/${proposal._id}`)}
        >
          <CardHeader>
            <CardTitle>{proposal.content.summary}</CardTitle>
          </CardHeader>
          <p className="text-sm text-muted-foreground">{proposal.content.abstract}</p>
        </Card>
      ))}
    </aside>
  );
};

export default Sidebar;
