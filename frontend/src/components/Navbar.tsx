// src/components/Navbar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaChartLine, FaExternalLinkAlt, FaChevronDown, FaWallet, FaBars, FaTimes } from 'react-icons/fa';
import WalletConnectButton from './ui/WalletConnectButton';

// Animated SVG icon component for the TAO logo
const TaoIcon = () => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 34.44 36.91" 
      className="h-6 w-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ 
        filter: isHovered ? "drop-shadow(0 0 3px rgba(255,255,255,0.7))" : "none",
        rotate: isHovered ? 360 : 0
      }}
      transition={{ duration: 0.7, rotate: { duration: 1 } }}
    >
      <path 
        fill="#fff" 
        d="M20.88,28.32V13.19c0-3.78-3.12-6.86-6.9-6.86V30.51c0,4.81,4.08,6.4,6.6,6.4,2.09,0,3.27-.36,4.69-1.36-3.98-.42-4.39-2.82-4.39-7.23Z"
      />
      <path 
        fill="#fff" 
        d="M6.29,0C2.82,0,0,2.87,0,6.34H28.15c3.47,0,6.29-2.87,6.29-6.34H6.29Z"
      />
    </motion.svg>
  );
};

interface NavbarProps {
  proposals?: Array<{_id: string}>;
  onWalletConnect?: (address: string | null, taoBalance: number) => void;
}

const Navbar: React.FC<NavbarProps> = ({ proposals = [], onWalletConnect }) => {
  const location = useLocation();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [taoBalance, setTaoBalance] = useState<number>(0);
  const [scrolled, setScrolled] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);
  
  // Check if a path is active
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Get the first proposal ID or default to the proposals page
  const getProposalsPath = () => {
    return proposals.length > 0 ? `/proposals/${proposals[0]._id}` : '/proposals';
  };
  
  // Handle wallet connection
  const handleWalletConnect = (address: string | null, balance: number) => {
    setWalletAddress(address);
    setTaoBalance(balance);
    if (onWalletConnect) {
      onWalletConnect(address, balance);
    }
  };
  
  // Truncate wallet address for display
  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Calculate navbar height and set CSS variable
  useEffect(() => {
    if (navbarRef.current) {
      const height = navbarRef.current.offsetHeight;
      document.documentElement.style.setProperty('--navbar-height', `${height}px`);
      document.body.style.paddingTop = `${height}px`;
    }
    
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === navbarRef.current) {
          const height = entry.contentRect.height;
          document.documentElement.style.setProperty('--navbar-height', `${height}px`);
          document.body.style.paddingTop = `${height}px`;
        }
      }
    });
    
    if (navbarRef.current) {
      resizeObserver.observe(navbarRef.current);
    }
    
    return () => {
      if (navbarRef.current) {
        resizeObserver.unobserve(navbarRef.current);
      }
    };
  }, []);
  
  return (
    <>
      <div ref={navbarRef} className="fixed top-0 left-0 right-0 z-50">
        {/* Top black bar */}
        <div className="w-full bg-black border-b border-[#272727]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-8">
              <div className="flex items-center">
                <span className="text-white/80 text-xs font-everett">TAO Governance & Bittensor Network</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main navigation bar */}
        <motion.header 
          className={`bg-[#141414] transition-shadow duration-300 ${
            scrolled ? "shadow-[0_5px_15px_rgba(0,0,0,0.5)]" : ""
          }`}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                {/* Logo and Brand */}
                <motion.div 
                  className="flex-shrink-0 mr-8"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to="/" className="flex items-center">
                    <TaoIcon />
                    <motion.span 
                      className="text-white font-everett font-medium text-xl ml-2"
                      whileHover={{ textShadow: "0 0 8px rgba(255,255,255,0.7)" }}
                    >
                      taogov
                    </motion.span>
                  </Link>
                </motion.div>
              </div>
              
              {/* Right side items */}
              <div className="flex items-center gap-6">
                {/* Main Navigation - Desktop */}
                <nav className="hidden md:flex items-center space-x-8">
                  <NavLink to={getProposalsPath()} active={isActive('/proposals')}>
                    Proposals
                  </NavLink>
                  
                  <NavLink to="/demo" active={isActive('/demo')}>
                    Demo
                  </NavLink>
                  
                  <NavLink to="/whitepaper" active={isActive('/whitepaper')}>
                    White Paper
                  </NavLink>
                  
                  {/* Create Proposal Button */}
                  <NavLink to="/proposals/create" active={isActive('/proposals/create')}>
                    <div className="flex items-center gap-1.5">
                      <FaPlus size={12} />
                      <span>Create Proposal</span>
                    </div>
                  </NavLink>
                </nav>
                
                {/* Wallet Connect Button */}
                <div className="h-9 relative"
                  onMouseEnter={() => walletAddress && setShowWalletDropdown(true)}
                  onMouseLeave={() => setShowWalletDropdown(false)}
                >
                  {walletAddress ? (
                    <>
                      <motion.button
                        className="flex items-center justify-center h-full bg-white border border-gray-200 text-black rounded-md px-3 py-1.5 text-sm font-everett"
                        whileHover={{ 
                          scale: 1.02,
                          boxShadow: "0 0 8px rgba(255,255,255,0.3)"
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaWallet className="mr-2" size={14} />
                        Wallet Connected
                        <FaChevronDown className="ml-2" size={10} />
                      </motion.button>
                      
                      {/* Wallet Dropdown */}
                      <AnimatePresence>
                        {showWalletDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-64 bg-[#1a1a1a] border border-[#272727] rounded-md shadow-lg z-50"
                          >
                            <div className="p-3">
                              <div className="mb-3">
                                <p className="text-white/60 text-xs mb-1 font-everett">Connected Wallet</p>
                                <p className="text-white font-medium font-everett">{truncateAddress(walletAddress)}</p>
                              </div>
                              <div className="mb-3">
                                <p className="text-white/60 text-xs mb-1 font-everett">TAO Balance</p>
                                <p className="text-white font-medium font-everett">{taoBalance.toFixed(2)} TAO</p>
                              </div>
                              <button
                                onClick={() => {
                                  setWalletAddress(null);
                                  setTaoBalance(0);
                                  setShowWalletDropdown(false);
                                  if (onWalletConnect) {
                                    onWalletConnect(null, 0);
                                  }
                                }}
                                className="w-full mt-2 py-2 text-white/80 hover:text-white text-sm bg-[#252525] hover:bg-[#2a2a2a] rounded-md transition-colors font-everett"
                              >
                                Disconnect
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <WalletConnectButton onConnect={handleWalletConnect} isNavbar={true} />
                  )}
                </div>
                
                {/* Mobile menu button */}
                <button
                  className="md:hidden flex items-center justify-center h-9 w-9 bg-[#252525] text-white rounded-md border border-[#272727]"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile menu - only renders when mobileMenuOpen is true */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden overflow-hidden bg-[#1a1a1a] border-t border-[#272727]"
              >
                <div className="px-4 py-3 space-y-2">
                  <Link 
                    to={getProposalsPath()} 
                    className={`block py-2 px-3 rounded-md font-everett text-[14px] leading-[16px] tracking-[-0.04em] font-medium ${isActive('/proposals') ? 'bg-[#252525] text-white' : 'text-white/80'}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Proposals
                  </Link>
                  <Link 
                    to="/demo" 
                    className={`block py-2 px-3 rounded-md font-everett text-[14px] leading-[16px] tracking-[-0.04em] font-medium ${isActive('/demo') ? 'bg-[#252525] text-white' : 'text-white/80'}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Demo
                  </Link>
                  <Link 
                    to="/whitepaper" 
                    className={`block py-2 px-3 rounded-md font-everett text-[14px] leading-[16px] tracking-[-0.04em] font-medium ${isActive('/whitepaper') ? 'bg-[#252525] text-white' : 'text-white/80'}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    White Paper
                  </Link>
                  <Link 
                    to="/proposals/create" 
                    className="flex items-center gap-1.5 bg-[#252525] text-white font-everett text-[14px] leading-[16px] tracking-[-0.04em] font-medium px-3 py-2 rounded-md hover:bg-[#2a2a2a] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaPlus size={12} />
                    <span>Create Proposal</span>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      </div>
      
      {/* Add CSS to ensure content appears below navbar */}
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --navbar-height: 0px;
        }
        
        body {
          padding-top: var(--navbar-height);
        }
      `}} />
    </>
  );
};

// NavLink component for consistent styling
const NavLink = ({ to, active, children }) => (
  <Link
    to={to}
    className={`relative font-everett text-[14px] leading-[16px] tracking-[-0.04em] font-medium transition-colors ${
      active ? 'text-white' : 'text-white/70 hover:text-white'
    }`}
  >
    <div className="flex items-center">
      {children}
    </div>
    {active && (
      <motion.div
        className="absolute bottom-[-20px] left-0 w-full h-[3px] bg-white rounded-t-full"
        layoutId="navIndicator"
        transition={{ type: "spring", duration: 0.5 }}
      />
    )}
  </Link>
);

export default Navbar;