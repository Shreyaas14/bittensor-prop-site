import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Proposal } from '@/hooks/useProposals';

interface SidebarProps {
  proposals: Proposal[];
}

const Sidebar: React.FC<SidebarProps> = ({ proposals }) => {
  console.log('🔄 Sidebar - Component rendering');
  console.log('📋 Sidebar - Received proposals:', proposals.length);
  
  const navigate = useNavigate();

  return (
    <aside className="w-64 h-full bg-background-secondary border-r border-border overflow-auto">
      <div className="p-4">
        <div className="flex items-center mb-6">
          <img src="/bittensor-logo.svg" alt="Bittensor" className="h-6 mr-2" />
          <h1 className="text-header-sm font-medium text-white">Governance</h1>
        </div>
        
        <div className="mb-4">
          <h2 className="text-label-md text-text-secondary uppercase tracking-wider mb-2">Proposals</h2>
        </div>
        
        {/* List of Proposals */}
        <div className="space-y-2">
          {proposals.length > 0 ? (
            proposals.map((proposal) => {
              console.log('📝 Sidebar - Rendering proposal:', proposal._id);
              return (
                <button
                  key={proposal._id}
                  className="w-full text-left p-3 rounded-md transition-colors cursor-pointer hover:bg-card group"
                  onClick={() => navigate(`/proposals/${proposal._id}`)}
                >
                  <div className="flex flex-col">
                    <span className="text-label-lg font-medium text-white group-hover:text-teal truncate">
                      {proposal.content.summary}
                    </span>
                    <span className="text-sm text-text-secondary mt-1 truncate">
                      {proposal.content.abstract.substring(0, 50)}...
                    </span>
                    
                    {/* Status & Stats */}
                    <div className="flex items-center mt-2 text-label-xs text-text-secondary">
                      <span className="inline-block w-2 h-2 rounded-full bg-teal mr-1.5"></span>
                      <span>Active</span>
                      <span className="mx-2">•</span>
                      <span>{proposal.voting_stats.total_votes} votes</span>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-text-secondary text-label-md p-3 bg-card rounded-md">
              No proposals available.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;