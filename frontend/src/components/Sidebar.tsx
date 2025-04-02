import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Proposal } from '@/hooks/useProposals';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  proposals: Proposal[];
}

const Sidebar: React.FC<SidebarProps> = ({ proposals }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Helper to check if a proposal is currently selected
  const isSelected = (id: string) => {
    return location.pathname === `/proposals/${id}`;
  };

  return (
    <motion.aside 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="w-64 h-full flex flex-col bg-[#141414] border-r border-border"
    >
      <div className="p-4 flex-1 overflow-auto">
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-label-sm text-text-secondary uppercase tracking-wider mb-4 px-1"
        >
          PROPOSALS
        </motion.h2>
        
        {/* List of Proposals */}
        <AnimatePresence>
          <div className="space-y-2">
            {proposals.length > 0 ? (
              proposals.map((proposal, index) => {
                const active = isSelected(proposal._id);
                return (
                  <motion.button
                    key={proposal._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.1 * index,
                      type: "spring",
                      stiffness: 300,
                      damping: 24
                    }}
                    whileHover={{ scale: 1.02, backgroundColor: active ? 'transparent' : 'rgba(39, 39, 39, 0.5)' }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full text-left p-3 rounded-md transition-all cursor-pointer ${
                      active 
                        ? "bg-transparent border border-white" 
                        : "hover:bg-card border border-transparent"
                    }`}
                    onClick={() => navigate(`/proposals/${proposal._id}`)}
                  >
                    <div className="flex flex-col">
                      <span className={`font-medium truncate ${active ? "text-white" : "text-text-secondary group-hover:text-white"}`}>
                        {proposal.content.summary}
                      </span>
                      <span className="text-sm text-text-secondary mt-1 truncate">
                        {proposal.content.abstract.substring(0, 50)}...
                      </span>
                      
                      {/* Status & Stats with improved animation */}
                      <div className="flex items-center mt-2 text-label-xs">
                        <motion.span 
                          className={`inline-block w-2 h-2 rounded-full bg-white mr-1.5`}
                          animate={{ 
                            opacity: [0.6, 1, 0.6],
                            scale: active ? [1, 1.2, 1] : 1
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        ></motion.span>
                        <span className="text-text-secondary">Active</span>
                        <span className="mx-2 text-text-secondary">•</span>
                        <span className="text-text-secondary">{proposal.voting_stats.total_votes} votes</span>
                      </div>
                    </div>
                  </motion.button>
                );
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-text-secondary text-label-md p-4 bg-card rounded-md border border-border"
              >
                No proposals available.
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};

const SidebarLayout: React.FC<{ 
  sidebar: React.ReactNode; 
  main: React.ReactNode;
  rightPanel?: React.ReactNode;
}> = ({ sidebar, main, rightPanel }) => {
  return (
    <div className="flex flex-1 h-[calc(100vh-3.5rem)]">
      {sidebar}
      <main className="flex-1 overflow-auto">{main}</main>
      {rightPanel && <aside className="w-80 h-full border-l border-[#222] overflow-hidden">{rightPanel}</aside>}
    </div>
  );
};

export default Sidebar;