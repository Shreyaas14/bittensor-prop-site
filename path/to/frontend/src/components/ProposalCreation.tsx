import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import WalletConnectButton from '@/components/ui/WalletConnectButton';
import { createProposal } from '@/api/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFileAlt, FaPen, FaUserAlt, FaTimes, FaArrowRight, FaCheck, FaExclamationCircle, FaWallet } from 'react-icons/fa';

// ... your FormField & FormSection definitions ...

const ProposalCreation = () => {
  // 1) Read wallet state from context
  const { walletAddress, taoBalance, setWalletAddress, setTaoBalance } = useAppContext();

  // Use refs for direct DOM access
  const titleRef = useRef(null);
  // ...
  const creatorRef = useRef(null);
  
  // State for form values
  const [title, setTitle] = useState('');
  // ...
  const [creator, setCreator] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string|null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // 2) Whenever walletAddress changes, auto‐fill the creator field
  useEffect(() => {
    if (walletAddress) {
      setCreator(walletAddress);
    }
  }, [walletAddress]);

  // 3) Handle the onConnect callback from WalletConnectButton
  const handleWalletConnect = (address: string|null, balance: number) => {
    if (address) {
      setWalletAddress(address);
      setTaoBalance(balance);
      // setCreator is covered by the effect above
    }
  };

  // … all of your existing handlers … 

  // If we have success, show the usual success screen
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#141414]">
        {/* … unchanged … */}
      </div>
    );
  }

  // 4) If the user is not yet connected, short-circuit to a "Connect Wallet" UI
  if (!walletAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#141414]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-b from-[#1c1c1c] to-[#181818] p-8 rounded-xl max-w-md w-full text-center border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
        >
          <FaWallet className="text-white text-4xl mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-white/70 mb-6">You need to connect your wallet to submit a proposal.</p>
          <WalletConnectButton onConnect={handleWalletConnect} />
        </motion.div>
      </div>
    );
  }

  // … your existing form render …
  return (
    <div className="min-h-screen bg-[#141414] text-white font-everett">
      {/* … all the motion wrappers, form sections, etc. */}
      <form onSubmit={handleSubmit}>
        {/* Proposal Information, Details, … */}
        
        {/* Proposal Submitter Section */}
        <FormSection title="Proposal Submitter" icon={<FaUserAlt />}>
          <FormField 
            label="Your Wallet Address"
            hint="Automatically pulled from your connected wallet. Cannot be changed."
          >
            <input
              ref={creatorRef}
              type="text"
              value={creator}
              readOnly
              className="w-full p-3 bg-black/50 border border-white/10 text-white rounded-lg font-mono opacity-70 cursor-not-allowed"
            />
          </FormField>
        </FormSection>

        {/* Submit & Cancel buttons */}
      </form>
    </div>
  );
};

export default ProposalCreation; 