// src/components/pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

// TAO logo component based on the SVG paths we see in the screenshot
const TaoLogo: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const logoAnimation = useAnimation();

  useEffect(() => {
    if (isHovered) {
      logoAnimation.start({
        filter: "drop-shadow(0 0 15px rgba(255, 255, 255, 0.8))",
        scale: 1.05,
        transition: { duration: 0.3 }
      });
    } else {
      logoAnimation.start({
        filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.4))",
        scale: 1,
        transition: { duration: 0.3 }
      });
    }
  }, [isHovered, logoAnimation]);

  return (
    <motion.svg 
      width="200" 
      height="200" 
      viewBox="0 0 34.44 36.91"
      className="w-60 h-60 mx-auto cursor-pointer"
      animate={logoAnimation}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* TAO logo paths based on the actual image */}
      <motion.path 
        fill="#ffffff" 
        d="M20.88,28.32V13.19c0-3.78-3.12-6.86-6.9-6.86V30.51c0,4.81,4.08,6.4,6.6,6.4,2.09,0,3.27-.36,4.69-1.36-3.98-.42-4.39-2.82-4.39-7.23Z"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      <motion.path 
        fill="#ffffff" 
        d="M6.29,0C2.82,0,0,2.87,0,6.34H28.15c3.47,0,6.29-2.87,6.29-6.34H6.29Z"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
      />
    </motion.svg>
  );
};

// Enhanced navigation button with better hover effects
const NavButton: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="relative"
    >
      <Link 
        to={to} 
        className="inline-block bg-transparent border border-white text-white font-medium rounded-lg px-8 py-3 
                  hover:bg-opacity-20 hover:bg-white hover:text-white hover:border-opacity-80 hover:shadow-[0_0_15px_rgba(255,255,255,0.5)]
                  transition-all duration-300"
      >
        {children}
      </Link>
    </motion.div>
  );
};

// Floating particle effect
const FloatingParticles: React.FC = () => {
  const particles = [];
  
  for (let i = 0; i < 30; i++) {
    const randomX = Math.random() * 100;
    const randomY = Math.random() * 100;
    const size = Math.random() * 4 + 1;
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;
    
    particles.push(
      <motion.div
        key={i}
        className="absolute bg-white rounded-full opacity-20"
        style={{
          width: size,
          height: size,
          top: `${randomY}%`,
          left: `${randomX}%`,
        }}
        animate={{
          y: [20, -20, 20],
          x: [10, -10, 10],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          delay: delay,
          ease: "easeInOut"
        }}
      />
    );
  }
  
  return <div className="absolute inset-0 overflow-hidden pointer-events-none">{particles}</div>;
};

const HomePage: React.FC = () => {
  // Set background to pure black
  useEffect(() => {
    document.body.style.backgroundColor = '#000000';
    
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  // Text animation for title with typewriter effect
  const title = "taogov";
  const [displayedTitle, setDisplayedTitle] = useState("");
  
  useEffect(() => {
    let currentIndex = 0;
    const titleInterval = setInterval(() => {
      if (currentIndex <= title.length) {
        setDisplayedTitle(title.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(titleInterval);
      }
    }, 150);
    
    return () => clearInterval(titleInterval);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Background floating particles */}
      <FloatingParticles />
      
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center px-4 relative z-10">
        {/* Animated Logo */}
        <TaoLogo />
        
        {/* Title with typewriter effect */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
          className="text-5xl font-medium text-white mb-4 h-16 relative"
        >
          <span>{displayedTitle}</span>
          <AnimatePresence>
            {displayedTitle !== title && (
              <motion.span
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute h-8 w-1 bg-white ml-1 inline-block"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
            )}
          </AnimatePresence>
        </motion.h1>
        
        {/* Subtitle with glow effect */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.4 }}
          whileHover={{ 
            textShadow: "0 0 8px rgba(255,255,255,0.8)",
            scale: 1.02
          }}
          className="text-xl text-white opacity-80 mb-12 max-w-xl mx-auto transition-all duration-300"
        >
          Decentralized Governance for the Bittensor Network
        </motion.p>
        
        {/* Navigation Buttons - Added Create Proposal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.8 }}
          className="flex flex-wrap gap-5 justify-center"
        >
          <NavButton to="/proposals">Proposals</NavButton>
          <NavButton to="/demo">Demo</NavButton>
          <NavButton to="/whitepaper">White Paper</NavButton>
          <NavButton to="/proposals/create">Create Proposal</NavButton>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;