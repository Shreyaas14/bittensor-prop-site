import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createProposal } from '@/api/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFileAlt, FaPen, FaUserAlt, FaTimes, FaArrowRight, FaCheck, FaExclamationCircle, FaWallet } from 'react-icons/fa';

// 1) import your context and WalletConnectButton
import { useAppContext } from '@/contexts/AppContext';
import WalletConnectButton from '@/components/ui/WalletConnectButton';

// Define form field component to reduce repetition
const FormField = ({ label, hint, children }) => (
  <div className="mb-6">
    <label className="block text-white font-medium mb-2">{label}</label>
    {children}
    {hint && <p className="mt-1 text-white/50 text-xs">{hint}</p>}
  </div>
);

// Define form section component
const FormSection = ({ title, icon, children }) => (
  <div className="mb-8">
    <div className="flex items-center mb-4">
      <div className="p-2 bg-white/5 rounded-md mr-3">
        {icon}
      </div>
      <h3 className="text-white text-lg font-medium">{title}</h3>
    </div>
    <div className="pl-2">
      {children}
    </div>
  </div>
);

const ProposalCreation = () => {
  const navigate = useNavigate();

  // 2) grab walletAddress & taoBalance (and setters) from context
  const { walletAddress, taoBalance, setWalletAddress, setTaoBalance } = useAppContext();

  // callback passed into WalletConnectButton:
  const handleWalletConnect = (address: string | null, balance: number) => {
    setWalletAddress(address);
    setTaoBalance(balance);
  };

  // Use refs for direct DOM access
  const titleRef = useRef(null);
  const abstractRef = useRef(null);
  const fullProposalRef = useRef(null);
  
  // State for form values
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [fullProposal, setFullProposal] = useState('');
  const [proposalLevel, setProposalLevel] = useState('network');
  const [subnetId, setSubnetId] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Move these calculations outside of handleSubmit to the component level
  const closingDate = useMemo(
    () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    []
  );
  
  const closingDateFormatted = useMemo(() => {
    return closingDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, [closingDate]);

  // Simple event handlers without useCallback
  const handleTitleChange = (e) => {
    const newValue = e.target.value;
    console.log('Title changing to:', newValue);
    setTitle(newValue);
  };

  const handleAbstractChange = (e) => {
    const newValue = e.target.value;
    console.log('Abstract changing to:', newValue);
    setAbstract(newValue);
  };

  const handleFullProposalChange = (e) => {
    const newValue = e.target.value;
    console.log('Full proposal changing to:', newValue);
    setFullProposal(newValue);
  };

  const handleProposalLevelChange = (e) => {
    const newValue = e.target.value;
    console.log('Proposal level changing to:', newValue);
    setProposalLevel(newValue);
  };

  const handleSubnetIdChange = (e) => {
    const newValue = e.target.value;
    console.log('Subnet ID changing to:', newValue);
    setSubnetId(newValue);
  };

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('State updated:', { title, abstract, fullProposal });
  }, [title, abstract, fullProposal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    // Validate required fields
    if (!proposalLevel) {
      setFormError('Please select a proposal level (Network or Subnet)');
      setIsSubmitting(false);
      return;
    }

    // If subnet level is selected, require subnet ID
    if (proposalLevel === 'subnet' && !subnetId) {
      setFormError('Please enter a subnet ID for subnet proposals');
      setIsSubmitting(false);
      return;
    }

    if (!title.trim() || !abstract.trim() || !fullProposal.trim()) {
      setFormError('Please fill out all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      // Convert subnetId to number if present
      const numericSubnetId = proposalLevel === 'subnet' ? parseInt(subnetId, 10) : undefined;
      
      // Log clearly what type of proposal we're creating
      console.log(`Creating a ${proposalLevel.toUpperCase()} proposal`, 
        proposalLevel === 'subnet' ? `for subnet #${numericSubnetId}` : '');

      // compute on‐chain timestamps
      const now = new Date();
      const closing = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days out

      const proposalPayload = {
        content: {
          title,
          summary: abstract,            // use your “summary” field if you want
          abstract,
          full_proposal: fullProposal
        },
        proposal_creator: walletAddress!,
        level: proposalLevel,           // "network" or "subnet"
        subnet_id: numericSubnetId,     // numeric only if subnet
        voting_start: now.toISOString(),
        voting_end: closing.toISOString(),
        voting_stats: { yes: 0, no: 0, abstain: 0, total_votes: 0 },
      };

      // Log the exact payload we're sending to ensure subnet_id is included
      console.log('Submitting proposal payload:', JSON.stringify(proposalPayload, null, 2));
      
      const response = await createProposal(proposalPayload);
      
      // Extract the ID from the response
      const newProposalId = response._id || response.id || response.proposal_id;
      
      if (newProposalId) {
        console.log(`Successfully created ${proposalLevel} proposal with ID: ${newProposalId}`);
        // Add a small delay to ensure database updates are complete
        setTimeout(() => {
          // Redirect directly to the new proposal's detail page
          navigate(`/proposals/${newProposalId}`);
        }, 500);
      } else {
        // Fallback to proposals list if we can't get the ID
        console.warn('Could not get new proposal ID from response:', response);
        navigate('/proposals');
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      setFormError('Failed to create proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3) If no wallet is connected, show the connect-wallet UI
  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-b from-[#1c1c1c] to-[#181818] p-8 rounded-xl max-w-md w-full text-center border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
        >
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-white/5 rounded-full">
            <FaWallet className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-white/70 mb-6">
            You need to connect your wallet before creating a proposal.
          </p>
          <WalletConnectButton onConnect={handleWalletConnect} />
        </motion.div>
      </div>
    );
  }

  // If success, show success message
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#141414]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-b from-[#1c1c1c] to-[#181818] p-8 rounded-xl max-w-md w-full text-center border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-teal to-teal/80 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheck className="text-black text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Proposal Created!</h2>
          <p className="text-white/70 mb-6">Your proposal has been successfully submitted.</p>
          <p className="text-white/50 text-sm">Redirecting you to your proposal...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white font-everett">
      <div className="container mx-auto py-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="max-w-3xl mx-auto">
            <motion.h1 
              className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Create a New Proposal
            </motion.h1>
            <motion.p 
              className="text-white/60 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Submit your proposal for community consideration and voting.
            </motion.p>
            
            {formError && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-orange/10 border border-gradient-orange/30 text-gradient-orange p-4 rounded-lg mb-6 flex items-center"
              >
                <FaExclamationCircle className="mr-3 flex-shrink-0" size={18} />
                {formError}
              </motion.div>
            )}
            
            <form onSubmit={handleSubmit}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-10"
              >
                <div className="flex items-center mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-teal to-teal/30 rounded-full mr-4"></div>
                  <h2 className="text-2xl font-medium text-white tracking-tight">Proposal Information</h2>
                </div>
                
                <div className="p-8 rounded-xl bg-gradient-to-b from-[#1c1c1c] to-[#181818] border border-white/10 shadow-lg backdrop-blur-sm">
                  <FormField 
                    label="Proposal Level"
                    hint="Choose the level of your proposal"
                  >
                    <select
                      value={proposalLevel}
                      onChange={handleProposalLevelChange}
                      className="w-full p-3 bg-black/50 border border-white/10 text-white rounded-lg focus:border-teal focus:ring-1 focus:ring-teal focus:outline-none transition-all duration-200 hover:border-white/20"
                    >
                      <option value="network">Network</option>
                      <option value="subnet">Subnet</option>
                    </select>
                  </FormField>
                
                  {proposalLevel === 'subnet' && (
                    <FormField 
                      label="Subnet ID"
                      hint="Choose the specific subnet for this proposal"
                    >
                      <select
                        value={subnetId}
                        onChange={handleSubnetIdChange}
                        className="w-full p-3 bg-black/50 border border-white/10 text-white rounded-lg focus:border-teal focus:ring-1 focus:ring-teal focus:outline-none transition-all duration-200 hover:border-white/20"
                      >
                        <option value="">Select a subnet</option>
                        {Array.from({ length: 99 }, (_, i) => (
                          <option key={i} value={i.toString()}>{i}</option>
                        ))}
                      </select>
                    </FormField>
                  )}
                
                  <FormField 
                    label="Proposal Title"
                    hint="Keep it concise and descriptive."
                  >
                    <input
                      ref={titleRef}
                      type="text"
                      value={title}
                      onChange={handleTitleChange}
                      className="w-full p-3 bg-black/50 border border-white/10 text-white rounded-lg focus:border-teal focus:ring-1 focus:ring-teal focus:outline-none transition-all duration-200 hover:border-white/20"
                      placeholder="Enter a descriptive title for your proposal"
                      required
                    />
                  </FormField>
                
                  <FormField 
                    label="Abstract"
                    hint="A more detailed explanation of your proposal (3-5 sentences)."
                  >
                    <textarea
                      ref={abstractRef}
                      value={abstract}
                      onChange={handleAbstractChange}
                      className="w-full p-3 bg-black/50 border border-white/10 text-white rounded-lg focus:border-teal focus:ring-1 focus:ring-teal focus:outline-none h-32 resize-none transition-all duration-200 hover:border-white/20"
                      placeholder="Provide an abstract that explains your proposal in more detail"
                    />
                  </FormField>
                </div>
              </motion.div>
            
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-10"
              >
                <div className="flex items-center mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-teal to-teal/30 rounded-full mr-4"></div>
                  <h2 className="text-2xl font-medium text-white tracking-tight">Proposal Details</h2>
                </div>
                
                <div className="p-8 rounded-xl bg-gradient-to-b from-[#1c1c1c] to-[#181818] border border-white/10 shadow-lg backdrop-blur-sm">
                  <FormField 
                    label="Full Proposal Details"
                    hint="Markdown formatting is supported. Be thorough and clear in your proposal."
                  >
                    <textarea
                      ref={fullProposalRef}
                      value={fullProposal}
                      onChange={handleFullProposalChange}
                      className="w-full p-3 bg-black/50 border border-white/10 text-white rounded-lg focus:border-teal focus:ring-1 focus:ring-teal focus:outline-none h-60 resize-none transition-all duration-200 hover:border-white/20"
                      placeholder="Detail your proposal thoroughly. Include background, implementation details, timeline, and any other relevant information."
                    />
                  </FormField>
                </div>
              </motion.div>
            
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-10"
              >
                <div className="flex items-center mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-teal to-teal/30 rounded-full mr-4"></div>
                  <h2 className="text-2xl font-medium text-white tracking-tight">Proposal Submitter</h2>
                </div>
                
                <div className="p-8 rounded-xl bg-gradient-to-b from-[#1c1c1c] to-[#181818] border border-white/10 shadow-lg backdrop-blur-sm">
                  <FormField
                    label="Your Wallet Address"
                    hint="This address comes from your connected wallet and cannot be changed."
                  >
                    <input
                      type="text"
                      value={walletAddress}
                      disabled
                      className="w-full p-3 bg-black/50 border border-white/10 text-white rounded-lg font-mono cursor-not-allowed opacity-70"
                    />
                  </FormField>
                
                  <FormField
                    label="Proposal Closing Date"
                    hint="This proposal will stop accepting votes & comments after this date."
                  >
                    <input
                      type="text"
                      value={closingDateFormatted}
                      disabled
                      className="w-full p-3 bg-black/50 border border-white/10 text-white rounded-lg font-mono cursor-not-allowed opacity-70"
                    />
                  </FormField>
                </div>
              </motion.div>
            
              <motion.div 
                className="flex justify-end items-center mt-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <motion.button
                  type="button"
                  onClick={() => navigate('/proposals')}
                  className="px-5 py-3 bg-black border border-white/20 text-white rounded-lg flex items-center font-medium mr-4 hover:bg-white/5 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaTimes className="mr-2" />
                  <span>Cancel</span>
                </motion.button>
              
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 bg-gradient-to-r from-teal to-teal/80 text-black rounded-lg flex items-center font-medium shadow-lg ${isSubmitting ? 'opacity-70' : 'hover:shadow-teal/20 hover:shadow-xl'}`}
                  whileHover={!isSubmitting ? { scale: 1.02, boxShadow: "0px 0px 15px rgba(20, 184, 166, 0.3)" } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-t-2 border-b-2 border-black rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Proposal</span>
                      <FaArrowRight className="ml-2" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProposalCreation;