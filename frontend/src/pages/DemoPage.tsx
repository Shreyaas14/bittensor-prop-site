import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { FaWallet, FaExclamationCircle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import WalletConnectButton from '@/components/ui/WalletConnectButton';

const DemoPage = () => {
  const navigate = useNavigate();
  const { walletAddress, taoBalance, setWalletAddress, setTaoBalance } = useAppContext();
  
  // Form state
  const [subnetNumber, setSubnetNumber] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<'yes' | 'no' | null>(null);
  
  // Animation states
  const [showAnimation, setShowAnimation] = useState<boolean>(false);
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null);
  const [waitingMessage, setWaitingMessage] = useState<string | null>(null);
  
  // Error state for invalid subnets
  const [subnetError, setSubnetError] = useState<string | null>(null);
  
  // Validate subnet selection
  useEffect(() => {
    if (subnetNumber === '2' || subnetNumber === '7') {
      setSubnetError('Your wallet does not have sufficient TAO in this subnet to propose a fork.');
    } else {
      setSubnetError(null);
    }
  }, [subnetNumber]);
  
  // Handle wallet connection from this page
  const handleWalletConnect = (address: string | null, balance: number) => {
    if (address) {
      setWalletAddress(address);
      setTaoBalance(balance);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subnetNumber || !reason || !selectedOption) {
      setResult({
        success: false,
        message: "Please fill out all fields."
      });
      return;
    }
    
    // Check for restricted subnets
    if (subnetNumber === '2' || subnetNumber === '7') {
      setResult({
        success: false,
        message: "Your wallet does not have sufficient TAO in this subnet to propose a fork."
      });
      return;
    }
    
    // If user voted YES to fork, navigate immediately to SubnetForkingPage
    if (selectedOption === 'yes') {
      navigate('/subnet-forking');
    } else {
      // For "no" votes, just show success message
      setResult({
        success: true,
        message: `Your vote on subnet ${subnetNumber} has been recorded.`
      });
      
      // Reset form after a delay
      setTimeout(() => {
        setSubnetNumber('');
        setReason('');
        setSelectedOption(null);
      }, 3000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <h1 className="text-4xl font-bold mb-8 text-center text-white">Subnet Forking Demo</h1>
        
        {!walletAddress ? (
          <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-8 w-full max-w-md">
            <motion.div 
              className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-white/5 rounded-full"
              animate={{ 
                boxShadow: ['0 0 0 rgba(255,255,255,0)', '0 0 20px rgba(255,255,255,0.3)', '0 0 0 rgba(255,255,255,0)'],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FaWallet size={32} />
            </motion.div>
            <h2 className="text-2xl font-medium mb-2 text-center">Please Connect Your Wallet</h2>
            <p className="text-gray-400 text-center mb-6">
              You need to connect your wallet to vote on subnet forking proposals.
            </p>
            <WalletConnectButton onConnect={handleWalletConnect} />
          </div>
        ) : (
          <motion.form 
            onSubmit={handleSubmit}
            className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-8 w-full"
          >
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-1 text-white">Subnet Information</h2>
              <p className="text-gray-400 mb-4">Enter the subnet number you wish to fork.</p>
              <div className="flex flex-col space-y-6">
                <div>
                  <label htmlFor="subnet" className="block text-sm font-medium text-gray-300 mb-2">Subnet Number</label>
                  <input
                    type="number"
                    id="subnet"
                    value={subnetNumber}
                    onChange={(e) => setSubnetNumber(e.target.value)}
                    className={`w-full px-4 py-3 bg-black border ${
                      subnetError ? 'border-red-500' : 'border-white/20'
                    } rounded-md text-white focus:border-teal focus:outline-none`}
                    placeholder="Enter subnet number (e.g. 1, 22, etc.)"
                    min="1"
                  />
                  {subnetError && (
                    <p className="mt-2 text-red-500 text-sm flex items-center">
                      <FaExclamationCircle className="mr-1" size={14} />
                      {subnetError}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Vote Option</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedOption('yes')}
                      className={`px-4 py-3 rounded-md flex items-center justify-center font-medium transition-all bg-black ${
                        selectedOption === 'yes' 
                          ? 'border-2 border-teal text-teal' 
                          : 'border border-white/20 text-white hover:border-teal/50'
                      }`}
                    >
                      Fork Subnet (Yes)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedOption('no')}
                      className={`px-4 py-3 rounded-md flex items-center justify-center font-medium transition-all bg-black ${
                        selectedOption === 'no' 
                          ? 'border-2 border-gradient-orange text-gradient-orange' 
                          : 'border border-white/20 text-white hover:border-gradient-orange/50'
                      }`}
                    >
                      Keep Subnet (No)
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-2">Reason for Vote</label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-md text-white focus:border-teal focus:outline-none h-32 resize-none"
                    placeholder="Please explain your reasoning for this vote..."
                  />
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                type="submit" 
                className="px-8 py-6 text-lg font-medium"
                disabled={!!subnetError}
              >
                Submit Vote
              </Button>
            </div>
            
            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 30 
                  }}
                  className={`mt-6 p-4 rounded-md ${
                    result.success ? 'bg-teal/10 border border-teal/30' : 'bg-gradient-orange/10 border border-gradient-orange/30'
                  }`}
                >
                  <div className="flex items-center">
                    {result.success ? (
                      <FaCheckCircle className="text-teal mr-2" size={20} />
                    ) : (
                      <FaExclamationCircle className="text-gradient-orange mr-2" size={20} />
                    )}
                    <p className={`${result.success ? 'text-teal' : 'text-gradient-orange'}`}>
                      {result.message}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
};

export default DemoPage;
