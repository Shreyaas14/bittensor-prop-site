// src/components/Sidebar.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Proposal } from '@/hooks/useProposals';
import { useSocket } from '@/hooks/useSocket';

interface SidebarProps {
  proposals: Proposal[];
}

const Sidebar: React.FC<SidebarProps> = ({ proposals }) => {
  const navigate = useNavigate();
  const socket = useSocket();
  const [localProposals, setLocalProposals] = useState<Proposal[]>(proposals);

  useEffect(() => {
    setLocalProposals(proposals);
  }, [proposals]);

  useEffect(() => {
    if (!socket) return;
    const handleProposalCreated = (newProposal: Proposal) => {
      setLocalProposals((prev) => [...prev, newProposal]);
    };
    socket.on('proposalCreated', handleProposalCreated);
    return () => {
      socket.off('proposalCreated', handleProposalCreated);
    };
  }, [socket]);

  return (
    <aside className="w-64 p-4 border-r max-h-screen overflow-y-auto">
      {localProposals.map((proposal) => (
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
