// src/components/Navbar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';
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

// Update interface for Navbar to accept proposals and add wallet connection handler
interface NavbarProps {
  proposals?: Array<{_id: string}>;
  onWalletConnect?: (address: string | null, taoBalance: number) => void;
}

const Navbar: React.FC<NavbarProps> = ({ proposals = [], onWalletConnect }) => {
  const location = useLocation();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [taoBalance, setTaoBalance] = useState<number>(0);
  
  // Check if a path is active
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Get the first proposal ID or default to the proposals page
  const getProposalsPath = () => {
    return proposals.length > 0 ? `/proposals/${proposals[0]._id}` : '/proposals';
  };

  // Navbar scroll animation
  const [scrolled, setScrolled] = useState(false);
  
  React.useEffect(() => {
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

  // Handle wallet connection
  const handleWalletConnect = (address: string | null, balance: number) => {
    setWalletAddress(address);
    setTaoBalance(balance);
    if (onWalletConnect) {
      onWalletConnect(address, balance);
    }
  };

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 bg-black transition-all duration-300 ${
        scrolled ? "shadow-[0_5px_15px_rgba(0,0,0,0.5)] backdrop-blur-sm bg-black/90" : "border-b border-[#1a1a1a]"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo and Brand */}
          <motion.div 
            className="flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="flex items-center">
              <TaoIcon />
              <motion.span 
                className="text-white font-medium ml-2"
                whileHover={{ textShadow: "0 0 8px rgba(255,255,255,0.7)" }}
              >
                taogov
              </motion.span>
            </Link>
          </motion.div>
          
          {/* Navigation Links */}
          <nav className="flex items-center space-x-8">
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
              <div className="flex items-center">
                <FaPlus size={10} className="mr-1.5" />
                Create Proposal
              </div>
            </NavLink>
            
            {/* Add wallet connect button */}
            <div className="ml-2 w-44">
              {walletAddress ? (
                <motion.div 
                  className="flex items-center gap-2 bg-card border border-teal rounded-md px-3 py-1.5"
                  whileHover={{ scale: 1.02, boxShadow: "0 0 8px rgba(0,219,188,0.25)" }}
                >
                  <div className="flex-1 truncate">
                    <div className="text-xs text-text-secondary">Connected</div>
                    <div className="font-mono text-white text-xs truncate">
                      {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                    </div>
                  </div>
                  <span className="text-teal font-medium text-xs">{taoBalance}τ</span>
                </motion.div>
              ) : (
                <div className="h-9">
                  <WalletConnectButton onConnect={handleWalletConnect} />
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </motion.header>
  );
};

// Animated NavLink component
interface NavLinkProps {
  to: string;
  active: boolean;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, active, children }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Link 
      to={to} 
      className="relative group py-1 px-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.span 
        className={`text-sm font-medium transition-all duration-300 ${
          active ? "text-white" : "text-white opacity-80"
        } ${isHovered ? "text-white" : ""}`}
        animate={{ 
          y: isHovered ? -2 : 0,
          textShadow: isHovered ? "0 0 8px rgba(255,255,255,0.7)" : "none"
        }}
      >
        {children}
      </motion.span>
      
      {/* Animated underline */}
      <motion.div 
        className="absolute -bottom-1 left-0 h-0.5 bg-white"
        initial={{ width: active ? "100%" : "0%" }}
        animate={{ 
          width: active || isHovered ? "100%" : "0%",
          boxShadow: isHovered ? "0 0 5px rgba(255,255,255,0.7)" : "none"
        }}
        transition={{ duration: 0.2 }}
      />
    </Link>
  );
};

export default Navbar;