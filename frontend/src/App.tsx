// App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useMatch } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import ProposalDetail from '@/components/ProposalDetail';
//import CreateProposal from '@/components/CreateProposal'; to be done
import VotingPanel from '@/components/VotingPanel';
import { useProposals, Proposal } from '@/hooks/useProposals';

const AppContent: React.FC = () => {
  console.log('🔄 AppContent - Component rendering');
  // Fetch proposals for the sidebar
  const { proposals, loading, error } = useProposals();
  
  console.log('📋 AppContent - Proposals state:', { 
    loading, 
    error, 
    proposalsCount: proposals?.length || 0 
  });

  // useMatch to extract proposal ID from URL if one is selected
  const match = useMatch('/proposals/:id');
  const selectedProposalId = match?.params.id;
  console.log('🔗 AppContent - Selected proposal ID from URL:', selectedProposalId);

  // Local state to hold the currently selected proposal details
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  // When the selected proposal ID changes, find it from the fetched proposals.
  // (Alternatively, you could fetch the details separately if you need more data.)
  useEffect(() => {
    console.log('🔍 AppContent - Looking for proposal with ID:', selectedProposalId);
    if (selectedProposalId && proposals.length) {
      const found = proposals.find((p) => p._id === selectedProposalId) || null;
      console.log('🔍 AppContent - Found proposal:', found ? 'Yes' : 'No');
      setSelectedProposal(found);
    } else {
      setSelectedProposal(null);
    }
  }, [selectedProposalId, proposals]);

  if (loading) {
    console.log('⏳ AppContent - Showing loading state');
    return <p>Loading proposals...</p>;
  }
  if (error) {
    console.log('AppContent - Showing error state:', error);
    return <p>Error: {error}</p>;
  }

  // Dummy dates for voting (replace with real dates if available)
  const dummyDates = {
    votingCreatedAt: new Date().toISOString(),
    votingStart: new Date().toISOString(),
    votingEnd: new Date(Date.now() + 86400000).toISOString(), // +1 day
  };

  console.log('AppContent - Rendering main UI with proposals:', proposals.length);
  
  return (
    <div className="flex h-screen">
      <Sidebar proposals={proposals} />
      <main className="flex-1 p-4">
        <Routes>
          <Route path="/" element={<p>Select a proposal from the sidebar.</p>} />
          <Route path="/proposals/:id" element={<ProposalDetail />} />
        </Routes>
      </main>
      <aside className="w-80 order-last">
        {selectedProposal ? (
          <VotingPanel
            proposalId={selectedProposal._id}
            votingStats={{
              yes: selectedProposal.voting_stats.yes,
              no: selectedProposal.voting_stats.no,
              abstain: selectedProposal.voting_stats.abstain,
              total_votes: selectedProposal.voting_stats.total_votes,
            }}
            dates={dummyDates}
          />
        ) : (
          <p>No proposal selected for voting.</p>
        )}
      </aside>
    </div>
  );
};

const App: React.FC = () => {
  console.log('🚀 App - Main component rendering');
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;