import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Proposal } from '@/hooks/useProposals';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaChevronRight } from 'react-icons/fa';

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
      transition={{ duration: 0.3 }}
      className="w-64 h-full flex flex-col bg-[#141414] border-r border-[#272727] font-everett"
    >
      <div className="p-4 flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[12px] leading-[16px] font-medium text-white/70 tracking-[0.08em] uppercase"
          >
            Proposals
          </motion.h2>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/create-proposal')}
            className="p-2 rounded-full bg-[#252525] text-white/70 hover:text-white transition-colors"
          >
            <FaPlus size={12} />
          </motion.button>
        </div>
        
        {/* List of Proposals */}
        <AnimatePresence>
          <div className="space-y-2">
            {proposals.length > 0 ? (
              proposals.map((proposal, index) => {
                const active = isSelected(proposal._id);
                return (
                  <motion.div
                    key={proposal._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.03 * index,
                      duration: 0.2
                    }}
                    className="relative"
                  >
                    {active && (
                      <motion.div
                        layoutId="activeProposal"
                        className="absolute inset-0 bg-[#252525] rounded-md -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      />
                    )}
                    
                    <button
                      onClick={() => navigate(`/proposals/${proposal._id}`)}
                      className={`w-full text-left p-3 rounded-md transition-all ${
                        active 
                          ? 'text-white' 
                          : 'text-white/70 hover:text-white hover:bg-[#252525]/50'
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate text-[14px] leading-[18px] tracking-[-0.03em]">
                            {proposal.content.summary}
                          </span>
                          
                          <motion.div
                            animate={{ 
                              rotate: active ? 90 : 0,
                              opacity: active ? 1 : 0.5
                            }}
                            transition={{ duration: 0.2 }}
                            className="ml-2 flex-shrink-0"
                          >
                            <FaChevronRight size={10} />
                          </motion.div>
                        </div>
                        
                        <span className="text-[12px] leading-[16px] tracking-[-0.02em] text-white/50 mt-1 line-clamp-1">
                          {proposal.content.abstract.substring(0, 60)}
                          {proposal.content.abstract.length > 60 ? '...' : ''}
                        </span>
                      </div>
                    </button>
                  </motion.div>
                );
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center justify-center p-5 bg-[#1a1a1a] rounded-md text-center"
              >
                <p className="text-[12px] leading-[16px] tracking-[-0.02em] text-white/60 mb-3">No proposals yet</p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/create-proposal')}
                  className="px-3 py-2 bg-[#252525] text-white/80 hover:text-white rounded-md text-[14px] leading-[16px] tracking-[-0.03em] font-medium transition-colors"
                >
                  Create New Proposal
                </motion.button>
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
    <div className="flex flex-1 h-[calc(100vh-var(--navbar-height))] font-everett">
      {sidebar}
      <main className="flex-1 overflow-auto">{main}</main>
      {rightPanel && <aside className="w-72 h-full border-l border-[#272727] overflow-hidden">{rightPanel}</aside>}
    </div>
  );
};

export default Sidebar;