// App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useMatch, Link } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import ProposalDetail from '@/components/ProposalDetail';
import VotingPanel from '@/components/VotingPanel';
import { useProposals, Proposal } from '@/hooks/useProposals';
import { FaHome, FaChartLine, FaFileAlt, FaUsers, FaGlobe, FaExclamationTriangle } from 'react-icons/fa';

// Import the global styles
import '@/styles/globals.css';

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
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-12 w-12 border-4 border-teal border-t-transparent rounded-full mb-4"></div>
          <p className="text-white text-label-lg">Loading governance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card border border-border rounded-lg p-6 max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-orange/10 flex items-center justify-center mb-4">
              <FaExclamationTriangle className="text-gradient-orange text-2xl" />
            </div>
            <h2 className="text-header-md font-medium text-white mb-2">Error Loading Data</h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-teal text-black font-medium py-2 px-4 rounded-lg hover:opacity-90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dummy dates for voting (replace with real dates if available)
  const dummyDates = {
    votingCreatedAt: new Date().toISOString(),
    votingStart: new Date().toISOString(),
    votingEnd: new Date(Date.now() + 86400000).toISOString(), // +1 day
  };
  
  return (
    <div className="flex flex-col h-screen bg-background text-white">
      {/* Header */}
      <header className="bg-background-secondary border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/bittensor-logo.svg" alt="Bittensor" className="h-6 mr-3" />
            <h1 className="text-header-sm font-medium">taostats</h1>
          </div>
          
          {/* Main Navigation */}
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link to="/" className="text-label-md text-text-secondary hover:text-white flex items-center">
                  <FaHome className="mr-1.5" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/stats" className="text-label-md text-text-secondary hover:text-white flex items-center">
                  <FaChartLine className="mr-1.5" />
                  <span>Stats</span>
                </Link>
              </li>
              <li>
                <Link to="/proposals" className="text-label-md text-teal flex items-center">
                  <FaFileAlt className="mr-1.5" />
                  <span>Governance</span>
                </Link>
              </li>
              <li>
                <Link to="/validators" className="text-label-md text-text-secondary hover:text-white flex items-center">
                  <FaUsers className="mr-1.5" />
                  <span>Validators</span>
                </Link>
              </li>
              <li>
                <Link to="/explorer" className="text-label-md text-text-secondary hover:text-white flex items-center">
                  <FaGlobe className="mr-1.5" />
                  <span>Explorer</span>
                </Link>
              </li>
            </ul>
          </nav>
          
          <div className="flex items-center space-x-4">
            <div className="text-label-md px-3 py-1 rounded-full border border-border bg-background">
              <span className="text-text-secondary">τ</span>
              <span className="ml-1 text-white">$250.72</span>
              <span className="ml-1 text-gradient-orange">-7.21%</span>
            </div>
            <button className="text-label-md px-3 py-1 rounded-full border border-teal text-teal hover:bg-teal/10">
              Connect Wallet
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar proposals={proposals} />
        
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h2 className="text-header-md font-medium mb-2">Welcome to Bittensor Governance</h2>
                  <p className="text-text-secondary">Select a proposal from the sidebar to view details and vote</p>
                </div>
              </div>
            } />
            <Route path="/proposals/:id" element={<ProposalDetail />} />
          </Routes>
        </main>
        
        <aside className="w-80 h-full overflow-hidden border-l border-border">
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
            <div className="flex items-center justify-center h-full bg-background-secondary">
              <div className="text-center p-6">
                <FaFileAlt className="text-4xl text-text-secondary mb-4 mx-auto" />
                <p className="text-text-secondary">No proposal selected for voting.</p>
              </div>
            </div>
          )}
        </aside>
      </div>
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