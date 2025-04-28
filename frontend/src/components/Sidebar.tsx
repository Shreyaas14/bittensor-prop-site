import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Proposal } from '@/hooks/useProposals';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSort, FaChevronRight, FaFilter, FaTimes } from 'react-icons/fa';

interface SidebarProps {
  proposals: Proposal[];
}

const Sidebar: React.FC<SidebarProps> = ({ proposals }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Sorting and filtering state
  const [showFilters, setShowFilters] = useState(false);
  const [proposalTypeFilter, setProposalTypeFilter] = useState<'all' | 'network' | 'subnet'>('all');
  const [subnetId, setSubnetId] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Helper to check if a proposal is currently selected
  const isSelected = (id: string) => {
    return location.pathname === `/proposals/${id}`;
  };

  // Filter and sort proposals
  const filteredProposals = proposals
    .filter(proposal => {
      // More robust subnet detection (matching ProposalDetail logic)
      const hasSubnetId = 
        proposal.subnet_id !== undefined && 
        proposal.subnet_id !== null && 
        proposal.subnet_id !== 'null' &&
        proposal.subnet_id !== 'undefined' &&
        String(proposal.subnet_id || '').trim() !== '';
      
      const isSubnetLevel = 
        proposal.level === 'subnet' || 
        (typeof proposal.level === 'string' && proposal.level.toLowerCase() === 'subnet');
      
      // A proposal is a subnet proposal if either condition is true
      const isSubnetProposal = hasSubnetId || isSubnetLevel;
      
      // Apply filter based on robust detection
      if (proposalTypeFilter === 'all') return true;
      if (proposalTypeFilter === 'network') return !isSubnetProposal;
      if (proposalTypeFilter === 'subnet') return isSubnetProposal;
      return true;
    })
    .filter(proposal => {
      // Filter by specific subnet ID if specified
      if (proposalTypeFilter === 'subnet' && subnetId !== '') {
        return String(proposal.subnet_id || '').trim() === subnetId;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by creation date
      const dateA = new Date(a.created_at || '').getTime();
      const dateB = new Date(b.created_at || '').getTime();
      
      return sortOrder === 'newest' 
        ? dateB - dateA // Newest first
        : dateA - dateB; // Oldest first
    });

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
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-full bg-[#252525] text-white/70 hover:text-white transition-colors"
          >
            <FaSort size={12} />
          </motion.button>
        </div>
        
        {/* Sort and Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-[#202020] rounded-lg p-3 mb-4">
                <div className="mb-3">
                  <h3 className="text-[11px] leading-[14px] font-medium text-white/70 tracking-[0.05em] uppercase mb-2">
                    Proposal Type
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setProposalTypeFilter('all')}
                      className={`px-2.5 py-1.5 rounded-md text-[12px] leading-[14px] transition-all ${
                        proposalTypeFilter === 'all'
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 hover:text-white/80'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setProposalTypeFilter('network')}
                      className={`px-2.5 py-1.5 rounded-md text-[12px] leading-[14px] transition-all ${
                        proposalTypeFilter === 'network'
                          ? 'bg-[#EB5347]/10 text-[#EB5347]'
                          : 'text-white/60 hover:text-white/80'
                      }`}
                    >
                      Network
                    </button>
                    <button
                      onClick={() => setProposalTypeFilter('subnet')}
                      className={`px-2.5 py-1.5 rounded-md text-[12px] leading-[14px] transition-all ${
                        proposalTypeFilter === 'subnet'
                          ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]'
                          : 'text-white/60 hover:text-white/80'
                      }`}
                    >
                      Subnet
                    </button>
                  </div>
                </div>
                
                {proposalTypeFilter === 'subnet' && (
                  <div className="mb-3">
                    <h3 className="text-[11px] leading-[14px] font-medium text-white/70 tracking-[0.05em] uppercase mb-2">
                      Subnet ID
                    </h3>
                    <input
                      type="text"
                      value={subnetId}
                      onChange={(e) => setSubnetId(e.target.value)}
                      placeholder="Filter by subnet ID"
                      className="w-full bg-black/30 text-white border border-white/10 rounded-md px-3 py-2 text-[12px] placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#2DD4BF]/50 focus:border-[#2DD4BF]/50"
                    />
                  </div>
                )}
                
                <div>
                  <h3 className="text-[11px] leading-[14px] font-medium text-white/70 tracking-[0.05em] uppercase mb-2">
                    Sort Order
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSortOrder('newest')}
                      className={`px-2.5 py-1.5 rounded-md text-[12px] leading-[14px] transition-all ${
                        sortOrder === 'newest'
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 hover:text-white/80'
                      }`}
                    >
                      Newest First
                    </button>
                    <button
                      onClick={() => setSortOrder('oldest')}
                      className={`px-2.5 py-1.5 rounded-md text-[12px] leading-[14px] transition-all ${
                        sortOrder === 'oldest'
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 hover:text-white/80'
                      }`}
                    >
                      Oldest First
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* List of Proposals */}
        <AnimatePresence>
          <div className="space-y-2">
            {filteredProposals.length > 0 ? (
              filteredProposals.map((proposal, index) => {
                const active = isSelected(proposal._id);
                // Determine proposal type for the indicator dot
                const isSubnet = proposal.level === 'subnet';
                const dotColor = isSubnet ? 'bg-[#2DD4BF]' : 'bg-[#EB5347]';
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
                          <div className="flex items-center space-x-2">
                            {/* Proposal type indicator dot */}
                            <span className={`h-2 w-2 rounded-full ${dotColor}`}></span>
                            <span
                              className="
                                font-medium 
                                flex-1 
                                text-[14px] 
                                leading-[18px] 
                                tracking-[-0.03em] 
                                whitespace-normal 
                                break-words
                              "
                            >
                              {proposal.content.title}
                            </span>
                          </div>
                          
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
                        
                        <div className="flex items-center mt-1">
                          {/* Subnet ID badge for subnet proposals */}
                          {isSubnet && proposal.subnet_id !== undefined && (
                            <span className="text-[10px] leading-[12px] py-0.5 px-1.5 rounded-sm bg-teal/10 text-teal mr-2">
                              Subnet #{proposal.subnet_id}
                            </span>
                          )}
                          
                          <span className="text-[12px] leading-[16px] tracking-[-0.02em] text-white/50 line-clamp-1">
                            {proposal.content.abstract.substring(0, 60)}
                            {proposal.content.abstract.length > 60 ? '...' : ''}
                          </span>
                        </div>
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
                <p className="text-[12px] leading-[16px] tracking-[-0.02em] text-white/60 mb-3">
                  {proposals.length > 0 
                    ? "No proposals match your filters" 
                    : "No proposals yet"}
                </p>
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
