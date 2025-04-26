import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useMatch } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import ProposalDetail from '@/components/ProposalDetail';
import ProposalCreation from '@/components/ProposalCreation';
import VotingPanel from '@/components/VotingPanel';
import { useProposals } from '@/hooks/useProposals';
import { FaFileAlt, FaExclamationTriangle } from 'react-icons/fa';
import DemoPage from '@/pages/DemoPage';
import HomePage from '@/pages/HomePage';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SubnetForkingPage from '@/pages/SubnetForkingPage';
import '@/styles/globals.css';
import { AppContextProvider } from './contexts/AppContext'; 

// Global Layout for pages to ensure proper structure
const PageLayout: React.FC<{ children: React.ReactNode, showFooter?: boolean }> = ({ children, showFooter = true }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#141414]">
      <Navbar />
      <div className="flex-grow flex flex-col bg-[#141414]">
        {children}
      </div>
      {showFooter && <Footer />}
    </div>
  );
};

// Sidebar layout for pages with sidebar
const SidebarLayout: React.FC<{ 
  sidebar: React.ReactNode; 
  main: React.ReactNode;
  rightPanel?: React.ReactNode;
}> = ({ sidebar, main, rightPanel }) => {
  return (
    <div className="flex flex-1 h-full min-h-[calc(100vh-9rem)] bg-[#141414]">
      {sidebar}
      <main className="flex-1 overflow-auto p-0 bg-[#141414]">{main}</main>
      {rightPanel ? (
        <aside className="w-80 border-l border-[#222] flex flex-col bg-[#141414] overflow-y-auto">
          {rightPanel}
        </aside>
      ) : (
        <aside className="w-0 lg:w-80 transition-all duration-300 border-l border-[#222] bg-[#141414] overflow-y-auto"></aside>
      )}
    </div>
  );
};

const AppContent: React.FC<{ onWalletConnect: (address: string | null, taoBalance: number) => void }> = ({ onWalletConnect }) => {
  const location = useLocation();
  const { proposals, loading, error } = useProposals();
  const match = useMatch('/proposals/:id');
  const selectedProposalId = match?.params.id;

  // Show loading state
  if (loading) {
    return (
      <PageLayout showFooter={false}>
        <div className="flex-grow flex items-center justify-center">
          <motion.div 
            className="flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="animate-spin h-12 w-12 border-4 border-teal border-t-transparent rounded-full mb-4"></div>
            <p className="text-white text-lg">Loading governance data...</p>
          </motion.div>
        </div>
      </PageLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <PageLayout showFooter={false}>
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="bg-[#171717] border border-[#333] rounded-lg p-6 max-w-md">
            <div className="flex flex-col items-center text-center">
              <FaExclamationTriangle className="text-gradient-orange text-4xl mb-4" />
              <h2 className="text-xl font-medium text-white mb-2">Error Loading Data</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-teal text-black font-medium py-2 px-4 rounded-lg"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const selectedProposal = proposals.find(p => p._id === selectedProposalId);
  const dummyDates = {
    votingCreatedAt: new Date().toISOString(),
    votingStart: new Date().toISOString(),
    votingEnd: new Date(Date.now() + 86400000).toISOString(),
  };

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Home Page */}
        <Route path="/" element={<PageLayout showFooter={false}><HomePage /></PageLayout>} />
        
        {/* Proposal Creation */}
        <Route path="/proposals/create" element={
          <PageLayout>
            <div className="pt-4">
              <ProposalCreation />
            </div>
          </PageLayout>
        } />
        
        {/* Proposals Overview */}
        <Route path="/proposals" element={
          <PageLayout>
            <SidebarLayout 
              sidebar={<Sidebar proposals={proposals} />}
              main={
                <div className="flex flex-col h-full">
                  <div className="p-6 sm:p-8 border-b border-white/10 bg-[#141414] sticky top-0 z-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h1 className="text-3xl sm:text-4xl text-white font-everett font-medium mb-2">Governance Proposals</h1>
                        <p className="text-gray-400 text-sm sm:text-base">Select a proposal from the sidebar to view details and vote.</p>
                      </div>
                      <button 
                        onClick={() => window.location.href = "/proposals/create"}
                        className="flex items-center gap-2 px-4 py-2 bg-[#141414] text-white font-medium rounded-md border border-white/20 hover:bg-[#141414]/80 transition-all duration-200 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] whitespace-nowrap"
                      >
                        <span>+</span> Create Proposal
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-8 flex items-center justify-center bg-[#141414]">
                    <div className="flex flex-col items-center justify-center max-w-md text-center">
                      <svg
                        className="w-16 h-16 mb-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-gray-400">Select a proposal from the sidebar to view its details</p>
                    </div>
                  </div>
                </div>
              }
            />
          </PageLayout>
        } />
        
        {/* Proposal Detail */}
        <Route path="/proposals/:id" element={
          <PageLayout>
            <SidebarLayout 
              sidebar={<Sidebar proposals={proposals} />}
              main={<ProposalDetail />}
              rightPanel={
                selectedProposal && (
                  <VotingPanel
                    proposalId={selectedProposal._id}
                    votingStats={{
                      yes: selectedProposal.voting_stats.yes,
                      no: selectedProposal.voting_stats.no,
                      abstain: selectedProposal.voting_stats.abstain,
                      total_votes: selectedProposal.voting_stats.total_votes,
                    }}
                    dates={dummyDates}
                    isVotingClosed={false}
                    endDateFormatted={dummyDates.votingEnd}
                  />
                )
              }
            />
          </PageLayout>
        } />
        
        {/* Demo Page */}
        <Route path="/demo" element={
          <PageLayout>
            <div className="flex-grow">
              <DemoPage />
            </div>
          </PageLayout>
        } />
        
        {/* New Subnet Forking Page Route */}
        <Route path="/subnet-forking" element={
          <PageLayout>
            <div className="flex-grow">
              <SubnetForkingPage />
            </div>
          </PageLayout>
        } />
        
        {/* Whitepaper Page */}
        <Route path="/whitepaper" element={
          <PageLayout>
            <div className="flex-grow flex items-center justify-center p-6">
              <div className="text-center">
                <h1 className="text-3xl font-medium mb-4 text-white">Whitepaper</h1>
                <p className="text-gray-400">Detailed project information will be published here.</p>
              </div>
            </div>
          </PageLayout>
        } />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [taoBalance, setTaoBalance] = useState<number>(0);
  
  // Handle wallet connection globally
  const handleWalletConnect = (address: string | null, balance: number) => {
    setWalletAddress(address);
    setTaoBalance(balance);
    
    // Store in localStorage for persistence
    if (address) {
      localStorage.setItem("walletAddress", address);
      localStorage.setItem("taoBalance", balance.toString());
    } else {
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("taoBalance");
    }
  };
  
  // On initial load, check for saved wallet
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress");
    const savedBalance = localStorage.getItem("taoBalance");
    
    if (savedAddress) {
      setWalletAddress(savedAddress);
      setTaoBalance(parseFloat(savedBalance || "0"));
    }
  }, []);

  useEffect(() => {
    // Apply #141414 background to both body and html elements for consistent appearance
    document.body.style.backgroundColor = '#141414';
    document.documentElement.style.backgroundColor = '#141414';
    
    // Also add a class to ensure styling is consistent
    document.body.classList.add('bg-[#141414]');
    
    return () => {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
      document.body.classList.remove('bg-[#141414]');
    };
  }, []);

  return (
    <Router>
      <AppContextProvider value={{ walletAddress, taoBalance, setWalletAddress, setTaoBalance }}>
        <AppContent onWalletConnect={handleWalletConnect} />
      </AppContextProvider>
    </Router>
  );
};

export default App;