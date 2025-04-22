// src/components/pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

// Subtle texture overlay component
const TextureOverlay: React.FC = () => (
  <div 
    className="absolute inset-0 pointer-events-none opacity-10"
    style={{
      backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"4\" height=\"4\"%3E%3Cpath d=\"M1 3h1v1H1V3zm2-2h1v1H3V1z\" fill=\"%23ffffff\" fill-opacity=\".1\"%3E%3C/path%3E%3C/svg%3E')",
      backgroundRepeat: "repeat"
    }}
  />
);

// Enhanced TAO logo component with improved animations
const TaoLogo: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const logoAnimation = useAnimation();

  useEffect(() => {
    if (isHovered) {
      logoAnimation.start({
        filter: "drop-shadow(0 0 20px rgba(255, 255, 255, 0.8))",
        scale: 1.05,
        rotate: 2,
        transition: { duration: 0.4 }
      });
    } else {
      logoAnimation.start({
        filter: "drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))",
        scale: 1,
        rotate: 0,
        transition: { duration: 0.4 }
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
      initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
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

// Enhanced navigation button with updated styling to match app theme
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
        className="inline-block bg-transparent border border-white/15 text-white font-everett font-medium rounded-3xl px-8 py-3 
                  hover:bg-white/5 hover:text-white hover:border-white/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.3)]
                  transition-all duration-300"
      >
        {children}
      </Link>
    </motion.div>
  );
};

// Refined floating particle effect with more subtle appearance
const FloatingParticles: React.FC = () => {
  const particles = [];
  const colors = [
    "rgba(255, 255, 255, 0.08)",
    "rgba(45, 212, 191, 0.08)",
    "rgba(167, 139, 250, 0.08)",
    "rgba(14, 165, 233, 0.08)"
  ];
  
  for (let i = 0; i < 25; i++) {
    const randomX = Math.random() * 100;
    const randomY = Math.random() * 100;
    const size = Math.random() * 3 + 1;
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    particles.push(
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          top: `${randomY}%`,
          left: `${randomX}%`,
          backgroundColor: color
        }}
        animate={{
          y: [20, -20, 20],
          x: [10, -10, 10],
          opacity: [0.05, 0.15, 0.05]
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
  // Set background to match app theme
  useEffect(() => {
    document.body.style.backgroundColor = '#141414';
    
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
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, #141414, #0c0c0c)"
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background floating particles */}
      <FloatingParticles />
      
      {/* Texture overlay */}
      <TextureOverlay />
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(255,255,255,0.03)] pointer-events-none" />
      
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center px-4 relative z-10">
        {/* Animated Logo with parallax effect */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <TaoLogo />
        </motion.div>
        
        {/* Title with typewriter effect and enhanced styling */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
          className="text-5xl font-everett font-medium text-white mb-4 h-16 relative tracking-[0.01em]"
          style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
        >
          <span>{displayedTitle}</span>
          <AnimatePresence>
            {displayedTitle !== title && (
              <motion.span
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute h-8 w-1 bg-[#2dd4bf] ml-1 inline-block"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
            )}
          </AnimatePresence>
        </motion.h1>
        
        {/* Subtitle with enhanced hover effect */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.4 }}
          whileHover={{ 
            textShadow: "0 0 8px rgba(45,212,191,0.8)",
            scale: 1.02
          }}
          className="text-xl font-everett text-white/80 mb-12 max-w-xl mx-auto transition-all duration-300 leading-[1.6]"
        >
          Decentralized Governance for the Bittensor Network
        </motion.p>
        
        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.8 }}
          className="flex flex-wrap gap-5 justify-center"
        >
          <NavButton to="/proposals">Proposals</NavButton>
          <NavButton to="/demo">Demo</NavButton>
          <NavButton to="/whitepaper">White Paper</NavButton>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HomePage;