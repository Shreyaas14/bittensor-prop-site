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
    <div className="container mx-auto px-4 py-12 max-w-4xl font-everett">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-everett font-bold mb-3 tracking-tight text-white"> </h1>
          <p className="text-xl font-everett text-white/80 max-w-xl mx-auto transition-all duration-300 leading-[1.6] text-center">
            
          </p>
        </div>
        
        {!walletAddress ? (
          <motion.div 
            className="bg-gradient-to-b from-[#1c1c1c] to-[#181818] border border-white/10 rounded-xl p-8 w-full max-w-md shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-white/5 rounded-full"
              animate={{ 
                boxShadow: ['0 0 0 rgba(255,255,255,0)', '0 0 20px rgba(255,255,255,0.3)', '0 0 0 rgba(255,255,255,0)'],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FaWallet size={36} className="text-white/80" />
            </motion.div>
            <h2 className="text-2xl font-medium mb-3 text-center text-white">Connect Your Wallet</h2>
            <p className="text-gray-400 text-center mb-8 leading-relaxed">
              You need to connect your wallet to vote on subnet forking proposals.
            </p>
            <WalletConnectButton onConnect={handleWalletConnect} className="w-full py-3" />
          </motion.div>
        ) : (
          <motion.form 
            onSubmit={handleSubmit}
            className="w-full"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-10">
              <div className="flex items-center mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-teal to-teal/30 rounded-full mr-4"></div>
                <h2 className="text-2xl font-everett font-medium text-white tracking-tight">Subnet Information</h2>
              </div>
              
              <div className="p-8 rounded-xl bg-[#121212] border border-white/10 shadow-lg backdrop-blur-sm">
                <p className="text-lg font-everett text-white/70 mb-8 leading-relaxed">
                  Enter the subnet number you wish to fork and provide your vote.
                </p>
                
                <div className="space-y-8">
                  <div className="group">
                    <label htmlFor="subnet" className="block text-sm font-medium text-gray-300 mb-2">
                      Subnet Number
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="subnet"
                        value={subnetNumber}
                        onChange={(e) => setSubnetNumber(e.target.value)}
                        className={`w-full px-4 py-3 bg-black/50 border ${
                          subnetError ? 'border-red-500' : 'border-white/10'
                        } rounded-lg text-white font-everett focus:border-teal focus:ring-1 focus:ring-teal focus:outline-none transition-all duration-200 group-hover:border-white/20`}
                        placeholder="Enter subnet number (e.g. 1, 22, etc.)"
                        min="1"
                      />
                    </div>
                    {subnetError && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-red-400 text-sm flex items-center"
                      >
                        <FaExclamationCircle className="mr-2" size={14} />
                        {subnetError}
                      </motion.p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Vote Option</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <motion.button
                        type="button"
                        onClick={() => setSelectedOption('yes')}
                        className={`px-6 py-4 rounded-lg flex items-center justify-center font-medium transition-all ${
                          selectedOption === 'yes' 
                            ? 'bg-teal/20 border-2 border-teal text-teal' 
                            : 'bg-black/50 border border-white/10 text-white hover:border-teal/50 hover:bg-black/70'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaCheckCircle className={`mr-3 ${selectedOption === 'yes' ? 'text-teal' : 'text-white/50'}`} />
                        Fork Subnet (Yes)
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => setSelectedOption('no')}
                        className={`px-6 py-4 rounded-lg flex items-center justify-center font-medium transition-all ${
                          selectedOption === 'no' 
                            ? 'bg-gradient-orange/20 border-2 border-gradient-orange text-gradient-orange' 
                            : 'bg-black/50 border border-white/10 text-white hover:border-gradient-orange/50 hover:bg-black/70'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaTimesCircle className={`mr-3 ${selectedOption === 'no' ? 'text-gradient-orange' : 'text-white/50'}`} />
                        Keep Subnet (No)
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="group">
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-2">Reason for Vote</label>
                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white font-everett focus:border-teal focus:ring-1 focus:ring-teal focus:outline-none h-32 resize-none transition-all duration-200 group-hover:border-white/20"
                      placeholder="Please explain your reasoning for this vote..."
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center pt-4">
              <motion.button 
                type="submit" 
                className={`px-10 py-4 text-lg font-medium bg-gradient-to-r from-teal to-teal/80 text-black rounded-lg shadow-lg transition-all duration-200 ${
                  !!subnetError ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-teal/20 hover:shadow-xl'
                }`}
                disabled={!!subnetError}
                whileHover={!subnetError ? { scale: 1.02, boxShadow: "0px 0px 15px rgba(20, 184, 166, 0.3)" } : {}}
                whileTap={!subnetError ? { scale: 0.98 } : {}}
              >
                Submit Vote
              </motion.button>
            </div>
            
            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`mt-8 p-5 rounded-lg backdrop-blur-sm ${
                    result.success 
                      ? 'bg-teal/10 border border-teal/30' 
                      : 'bg-gradient-orange/10 border border-gradient-orange/30'
                  } shadow-lg`}
                >
                  <div className="flex items-center">
                    {result.success ? (
                      <FaCheckCircle className="text-teal mr-3 flex-shrink-0" size={22} />
                    ) : (
                      <FaExclamationCircle className="text-gradient-orange mr-3 flex-shrink-0" size={22} />
                    )}
                    <p className={`${result.success ? 'text-teal' : 'text-gradient-orange'} font-medium`}>
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
