// App.tsx
import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useMatch,
} from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import ProposalDetail from '@/components/ProposalDetail';
import ProposalCreation from '@/components/ProposalCreation';
import VotingPanel from '@/components/VotingPanel';
import { useProposals, Proposal } from '@/hooks/useProposals';

const AppContent: React.FC = () => {
  // Now we also get addProposal from our hook.
  const { proposals, loading, error } = useProposals();

  // Use react-router's useMatch to capture the currently selected proposal id.
  const match = useMatch('/proposals/:id');
  const selectedProposalId = match?.params.id;

  // Store the currently selected proposal in local state.
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    if (selectedProposalId && proposals.length) {
      const found = proposals.find((p) => p._id === selectedProposalId) || null;
      setSelectedProposal(found);
    } else {
      setSelectedProposal(null);
    }
  }, [selectedProposalId, proposals]);

  if (loading) return <p>Loading proposals...</p>;
  if (error) return <p>Error: {error}</p>;

  // Dummy voting dates; replace these with real dates if available.
  const dummyDates = {
    votingCreatedAt: new Date().toISOString(),
    votingStart: new Date().toISOString(),
    votingEnd: new Date(Date.now() + 86400000).toISOString(), // +1 day
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar shows list of proposals */}
      <Sidebar proposals={proposals} />
      <main className="flex-1 p-4">
        {/* Navigation button to go to the Create Proposal page */}
        <div className="mb-4">
          <Link to="/create">
            <button className="px-4 py-2 bg-black text-white rounded">
              Create Proposal
            </button>
          </Link>
        </div>
        <Routes>
          <Route path="/" element={<p>Select a proposal from the sidebar.</p>} />
          <Route path="/proposals/:id" element={<ProposalDetail />} />
          <Route path="/create" element={<ProposalCreation />} />
        </Routes>
      </main>
      {/* Voting panel: shows voting info for the selected proposal */}
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
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
