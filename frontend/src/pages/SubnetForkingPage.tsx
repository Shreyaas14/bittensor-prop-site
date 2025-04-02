// src/pages/SubnetForkingPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { FaInfoCircle, FaTimes, FaArrowDown, FaArrowUp } from 'react-icons/fa';
import Footer from '@/components/Footer';

// Define interfaces for props
interface BlobEffectProps {
  active?: boolean;
  scale?: number;
  color?: string;
  pulse?: boolean;
  x?: string | number;
  y?: string | number;
  animationScale?: number | null;
}

interface SubnetCircleProps {
  label: string;
  description?: string;
  isSelected?: boolean;
  size?: number;
  x?: string | number;
  y?: string | number;
  showTokenInfo?: boolean;
  taoValue?: string;
  taoChange?: string;
  alphaValue?: string;
  alphaChange?: string;
  color?: string;
  animate?: boolean;
  splitting?: boolean;
  splittingDirection?: 'left' | 'right';
  splittingSpeed?: number;
}

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParticleProps {
  x: string;
  y: string;
  color: string;
  size: number;
  delay: number;
  duration: number;
  targetX: string;
  targetY: string;
}

// Particles for the splitting animation with improved easing
const SplitParticle: React.FC<ParticleProps> = ({ 
  x, y, color, size, delay, duration, targetX, targetY 
}) => {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        backgroundColor: color,
        x: "-50%",
        y: "-50%",
      }}
      initial={{ opacity: 0.8, scale: 1 }}
      animate={{
        left: targetX,
        top: targetY,
        opacity: 0,
        scale: 0.5
      }}
      transition={{
        duration,
        delay,
        ease: [0.34, 1.56, 0.64, 1], // Custom spring-like easing
      }}
    />
  );
};

// Enhanced blob effect with multiple layers for depth and better animation
const BlobEffect: React.FC<BlobEffectProps> = ({ 
  active = true, 
  scale = 1, 
  color = '#00DBBC',
  pulse = true,
  x = "50%",
  y = "50%",
  animationScale = null
}) => {
  if (!active) return null;
  
  // Use animationScale if provided
  const scaleValue = animationScale || (pulse ? [0.9, 1.1, 0.9] : 1);
  const scaleMultiplier = scale || 1; // Ensure scale has a default value even if prop is undefined
  
  return (
    <>
      {/* Main blob */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 220 * scaleMultiplier,
          height: 220 * scaleMultiplier,
          left: x,
          top: y,
          backgroundColor: color,
          opacity: 0.3,
          x: "-50%", 
          y: "-50%",
          filter: "blur(5px)"
        }}
        animate={{
          scale: scaleValue,
        }}
        transition={{
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Inner blob for depth */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 160 * scaleMultiplier,
          height: 160 * scaleMultiplier,
          left: x,
          top: y,
          backgroundColor: color,
          opacity: 0.2,
          x: "-50%", 
          y: "-50%",
          filter: "blur(2px)"
        }}
        animate={{
          scale: pulse ? [1.1, 0.9, 1.1] : 1,
        }}
        transition={{
          duration: 3.5, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 250 * scaleMultiplier,
          height: 250 * scaleMultiplier,
          left: x,
          top: y,
          backgroundColor: color,
          opacity: 0.1,
          x: "-50%", 
          y: "-50%",
          filter: "blur(15px)"
        }}
        animate={{
          scale: pulse ? [1, 1.15, 1] : 1,
        }}
        transition={{
          duration: 5, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2
        }}
      />
    </>
  );
};

// Token indicator component interface
interface TokenIndicatorProps {
  token: string;
  value: string;
  change?: string;
  mini?: boolean;
  color?: string;
}

// Token indicator component with proper type definitions
const TokenIndicator: React.FC<TokenIndicatorProps> = ({ token, value, change, mini = false, color = 'teal' }) => {
  const isPositive = change ? (change.startsWith('+')) : true;
  
  if (mini) {
    return (
      <motion.div 
        className="flex items-center justify-between w-full bg-black/40 px-3 py-1.5 rounded backdrop-blur-sm border border-[#333]/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <span className="text-white text-sm font-medium">{token}</span>
        <div className="flex items-center">
          <span className="text-white text-sm">{value}</span>
          {change && (
            <span className={`text-xs ml-1 ${isPositive ? 'text-teal' : 'text-gradient-orange'}`}>
              {change}
            </span>
          )}
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className={`p-3 bg-[#0A0A0A] border border-[#2b2b2b] rounded-lg backdrop-blur-sm`}
      whileHover={{ scale: 1.02, borderColor: color }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-white font-medium">{token === 'τ' ? 'TAO' : 'Alpha'}</span>
        {change && (
          <span className={`text-xs ${isPositive ? 'text-teal' : 'text-gradient-orange'}`}>
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-medium text-white">{value} <span className="text-sm">{token}</span></div>
    </motion.div>
  );
};

// Improved subnet circle with agar.io-like split animation
const SubnetCircle: React.FC<SubnetCircleProps> = ({ 
  label, 
  description, 
  isSelected = false, 
  size = 180,
  x = "50%",
  y = "50%",
  showTokenInfo = false,
  taoValue = "0.00K",
  taoChange = "+0.0%",
  alphaValue = "0.00",
  alphaChange = "+0.0%",
  color = "teal",
  animate = true,
  splitting = false,
  splittingDirection,
  splittingSpeed = 0
}) => {
  const controls = useAnimation();
  const borderColor = color === 'teal' ? '#00DBBC' : '#FF8B25';
  
  useEffect(() => {
    if (splitting && splittingDirection) {
      // Simulate agar.io-like splitting with initial acceleration and then slowing down
      controls.start({
        scale: [1, 1.05, 1],
        x: splittingDirection === 'left' ? [0, -40, -20] : [0, 40, 20],
        opacity: [1, 0.85, 1],
        transition: {
          duration: 1.8,
          ease: [0.34, 1.56, 0.64, 1], // Custom spring-like easing
          times: [0, 0.3, 1], // Control timing of keyframes
        }
      });
    } else if (animate) {
      controls.start({
        scale: [0.98, 1, 0.98],
        transition: {
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }
      });
    }
  }, [splitting, animate, splittingDirection, controls]);

  return (
    <>
      <motion.div
        className={`absolute flex flex-col items-center justify-center rounded-full bg-[#111] border-2
        z-10 text-center ${isSelected ? `border-${color}` : 'border-[#333]'}`}
        style={{ 
          width: size, 
          height: size, 
          left: x, 
          top: y, 
          transform: 'translate(-50%, -50%)',
          borderColor: isSelected ? borderColor : '#333',
        }}
        whileHover={{ borderColor: borderColor, boxShadow: `0 0 15px ${borderColor}40` }}
        animate={controls}
      >
        <motion.span 
          className="text-white font-medium text-xl mb-1"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {label}
        </motion.span>
        
        {description && (
          <motion.span 
            className="text-[#AAA] text-xs px-4 mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {description}
          </motion.span>
        )}
      </motion.div>
      
      {showTokenInfo && (
        <motion.div 
          className="absolute flex flex-col space-y-1 w-full max-w-[120px]"
          style={{
            left: x,
            top: `calc(${y} + ${size/2}px + 15px)`, // Position below the circle
            transform: 'translateX(-50%)',
            zIndex: 20,
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <TokenIndicator token="τ" value={taoValue} change={taoChange} mini={true} color={color === 'teal' ? '#00DBBC' : '#FF8B25'} />
          <TokenIndicator token="α" value={alphaValue} change={alphaChange} mini={true} color={color === 'teal' ? '#00DBBC' : '#FF8B25'} />
        </motion.div>
      )}
    </>
  );
};

// Info modal component
const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-[#141414] border border-border rounded-lg max-w-md w-full p-6"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium text-white">Subnet Forking</h2>
              <button 
                className="text-white hover:text-teal"
                onClick={onClose}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="space-y-4 text-text-secondary">
              <p>A subnet fork occurs when the community decides to split a subnet into two independent entities. This often happens when there are differing visions for the future of the subnet.</p>
              
              <p>In this case, the AMM subnet would split into AMM1 and AMM2, each with its own governance and token economics.</p>
              
              <p>Voting to fork requires significant community support and usually impacts token values as the ecosystem adapts to the change.</p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                className="bg-teal text-black px-4 py-2 rounded-lg font-medium hover:opacity-90"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Header navigation component
const NavHeader: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-6 py-4 z-30">
      <div className="flex items-center">
        <motion.div 
          className="text-white text-2xl font-bold"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          T
        </motion.div>
        <motion.div
          className="text-white ml-2 opacity-80"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 0.8, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          taogov
        </motion.div>
      </div>
      
      <div className="flex items-center space-x-6">
        <motion.div
          className="text-white opacity-70 cursor-pointer hover:opacity-100 transition-opacity"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          Proposals
        </motion.div>
        <motion.div
          className="text-white opacity-70 cursor-pointer hover:opacity-100 transition-opacity"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          Demo
        </motion.div>
        <motion.div
          className="text-white opacity-70 cursor-pointer hover:opacity-100 transition-opacity"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          White Paper
        </motion.div>
        <motion.div
          className="text-white bg-[#333] px-3 py-1 rounded-md flex items-center cursor-pointer hover:bg-[#444] transition-colors"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <span className="mr-1">+</span> Create Proposal
        </motion.div>
      </div>
    </div>
  );
};

// Enhanced starfield background
const EnhancedStarField: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden opacity-80">
      {/* Large distant stars */}
      {[...Array(20)].map((_, i) => (
        <div
          key={`large-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 1.5 + 0.5 + 'px',
            height: Math.random() * 1.5 + 0.5 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            opacity: Math.random() * 0.3 + 0.2,
            animation: `twinkle ${Math.random() * 8 + 5}s infinite ${Math.random() * 5}s ease-in-out`
          }}
        />
      ))}
      
      {/* Small nearby stars with different twinkle animation */}
      {[...Array(15)].map((_, i) => (
        <div
          key={`small-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 1 + 0.5 + 'px',
            height: Math.random() * 1 + 0.5 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            opacity: Math.random() * 0.4 + 0.3,
            animation: `microTwinkle ${Math.random() * 3 + 2}s infinite ${Math.random() * 2}s ease-in-out`
          }}
        />
      ))}
    </div>
  );
};

// Enhanced blob effect with perfect centering
const EnhancedBlobEffect: React.FC<BlobEffectProps> = ({
  active,
  scale = 1,
  color,
  x = "50%",
  y = "50%",
  pulse = true,
  animationScale = null
}) => {
  if (!active) return null;
  
  // Use animationScale if provided
  const scaleValue = animationScale || (pulse ? [0.92, 1.05, 0.92] : 1);
  const scaleMultiplier = scale || 1; // Ensure scale has a default value even if prop is undefined
  
  return (
    <>
      {/* Main blob with improved blur and animation */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 220 * scaleMultiplier,
          height: 220 * scaleMultiplier,
          left: x,
          top: y,
          backgroundColor: color,
          opacity: 0.25,
          x: "-50%", 
          y: "-50%",
          filter: "blur(8px)"
        }}
        animate={{
          scale: scaleValue,
        }}
        transition={{
          duration: 5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Inner blob with more subtle animation */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 160 * scaleMultiplier,
          height: 160 * scaleMultiplier,
          left: x,
          top: y,
          backgroundColor: color,
          opacity: 0.2,
          x: "-50%", 
          y: "-50%",
          filter: "blur(3px)"
        }}
        animate={{
          scale: pulse ? [1.08, 0.95, 1.08] : 1,
        }}
        transition={{
          duration: 4.2, 
          repeat: Infinity,
          ease: [0.4, 0.0, 0.6, 1.0],
          delay: 0.5
        }}
      />
      
      {/* Outer glow with increased blur radius */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 280 * scaleMultiplier,
          height: 280 * scaleMultiplier,
          left: x,
          top: y,
          backgroundColor: color,
          opacity: 0.08,
          x: "-50%", 
          y: "-50%",
          filter: "blur(20px)"
        }}
        animate={{
          scale: pulse ? [1, 1.12, 1] : 1,
        }}
        transition={{
          duration: 6, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2
        }}
      />
    </>
  );
};

// Success animation component
const SuccessAnimation: React.FC = () => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gradient-to-br from-black/80 to-black/90 p-8 rounded-xl border border-teal-500/30 relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl text-white text-center font-light">Fork Completed</h3>
        <p className="text-gray-400 text-center mt-2">
          Subnet has been successfully forked
        </p>
      </motion.div>
    </motion.div>
  );
};

// Redesigned liquidity flow line that connects directly between AMM circles
const LiquidityFlowLine: React.FC<{ 
  active: boolean; 
  progress: number;
  amm1Size: number;
  amm2Size: number;
  amm1X: string; 
  amm2X: string;
}> = ({ active, progress, amm1Size, amm2Size, amm1X, amm2X }) => {
  if (!active) return null;
  
  // Calculate positions to connect right side of AMM1 to left side of AMM2
  // Safely parse percentage values
  const amm1XPos = parseInt(amm1X.replace('%', ''));
  const amm2XPos = parseInt(amm2X.replace('%', ''));
  const amm1Radius = amm1Size / 2;
  const amm2Radius = amm2Size / 2;
  
  return (
    <div 
      className="absolute top-1/2 -translate-y-1/2 z-10"
      style={{
        left: `calc(${amm1X} + ${amm1Radius}px)`,
        width: `calc(${amm2X} - ${amm1X} - ${amm1Radius}px - ${amm2Radius}px)`,
        height: '6px' // Thicker line for more impact
      }}
    >
      {/* Base pipe with subtle glow effect */}
      <div 
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          boxShadow: "0 0 10px 2px rgba(80, 80, 100, 0.2)",
          background: "linear-gradient(to right, rgba(30,30,30,0.6), rgba(40,40,40,0.6))"
        }}
      ></div>
      
      {/* Progress fill with dynamic gradient */}
      <motion.div 
        className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
        style={{ width: `${progress * 100}%` }}
        initial={{ width: "0%" }}
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, rgba(255,139,37,0.8), rgba(0,219,188,0.8))"
          }}
          animate={{
            backgroundPosition: ["0% 0%", "200% 0%"],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Moving highlight effect */}
        <motion.div
          className="absolute inset-y-0 w-20 left-0"
          style={{
            background: "linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.3), rgba(255,255,255,0))"
          }}
          animate={{
            left: ["-10%", "110%"]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      {/* Animated tokens/droplets flowing through the pipe */}
      <div className="relative h-full">
        {/* Large TAO tokens */}
        {[...Array(7)].map((_, i) => (
          <motion.div
            key={`tao-${i}`}
            className="absolute top-1/2 -translate-y-1/2"
            initial={{ left: "0%", opacity: 0 }}
            animate={{ 
              left: ["0%", "100%"],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 4.5, 
              delay: i * 0.7, 
              repeat: Infinity,
              times: [0, 0.1, 1]
            }}
          >
            <div 
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium"
              style={{
                background: "radial-gradient(circle at 30% 30%, rgba(255,139,37,0.9), rgba(255,120,20,0.7))",
                boxShadow: "0 0 10px 2px rgba(255,139,37,0.4)",
              }}
            >
              τ
            </div>
          </motion.div>
        ))}
        
        {/* Alpha tokens */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`alpha-${i}`}
            className="absolute top-1/2 -translate-y-1/2"
            initial={{ left: "0%", opacity: 0 }}
            animate={{ 
              left: ["0%", "100%"],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 5,
              delay: 0.5 + i * 1.2, 
              repeat: Infinity,
              times: [0, 0.1, 1]
            }}
          >
            <div 
              className="w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-medium"
              style={{
                background: "radial-gradient(circle at 30% 30%, rgba(0,219,188,0.9), rgba(0,180,160,0.7))",
                boxShadow: "0 0 8px 2px rgba(0,219,188,0.4)",
              }}
            >
              α
            </div>
          </motion.div>
        ))}
        
        {/* Pulse effects at connection points */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{
            background: "rgba(255,139,37,0.2)",
          }}
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(255,139,37,0)",
              "0 0 0 8px rgba(255,139,37,0.5)",
              "0 0 0 12px rgba(255,139,37,0)"
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
        
        <motion.div
          className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{
            background: "rgba(0,219,188,0.2)",
          }}
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(0,219,188,0)",
              "0 0 0 8px rgba(0,219,188,0.5)",
              "0 0 0 12px rgba(0,219,188,0)"
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      </div>
    </div>
  );
};

// Main SubnetForkingPage component
const SubnetForkingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  
  // State for animation progress
  const [progressValue, setProgressValue] = useState(0);
  const [forkingComplete, setForkingComplete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  
  // State for subnet visualization
  const [showAMM1, setShowAMM1] = useState(true);
  const [showAMM2, setShowAMM2] = useState(false);
  const [operationsStopped, setOperationsStopped] = useState(false);
  
  // Define the splitting states
  const [splitting, setSplitting] = useState(false);
  const [splittingLeft, setSplittingLeft] = useState(false);
  const [splittingRight, setSplittingRight] = useState(false);
  const [flowingLiquidity, setFlowingLiquidity] = useState(false);
  
  // State for subnet sizes - increasing initial AMM1 size and final AMM2 size
  const [ammSizes, setAmmSizes] = useState({
    amm1Size: 220, // Bigger AMM1 at the start
    amm2Size: 0
  });
  
  // New state for token info visibility
  const [showTokenInfo, setShowTokenInfo] = useState(false);
  
  // Animation sequence
  useEffect(() => {
    // Helper function for delays
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    const animateForking = async () => {
      await delay(800);
      setOperationsStopped(true);
      
      // Start with only AMM1 visible and large
      setShowAMM1(true);
      
      await delay(1200);
      
      // Begin forking animation
      setSplitting(true);
      setSplittingLeft(true);
      setSplittingRight(true);
      
      // Show AMM2 early in the process
      await delay(600);
      setShowAMM2(true);
      
      // Set initial sizes after split
      setAmmSizes({
        amm1Size: 220, // AMM1 starts larger
        amm2Size: 140  // AMM2 starts smaller but visible
      });
      await delay(1000); // Longer pause
      
      // Start flowing liquidity with animated particles
      setFlowingLiquidity(true);
      
      // Gradual size transition showing liquidity flow from AMM1 to AMM2
      // More dramatic size changes
      const steps = 60;
      for (let i = 1; i <= steps; i++) {
        setProgressValue(i / steps);
        setAmmSizes({
          amm1Size: 220 - (80 * i / steps), // AMM1 gets smaller, from 220 to 140
          amm2Size: 140 + (100 * i / steps)  // AMM2 gets much bigger, from 140 to 240
        });
        await delay(80);
      }
      
      // End the animated flow with longer pause
      await delay(1200);
      setFlowingLiquidity(false);
      
      // Complete the animation
      setSplitting(false);
      setSplittingLeft(false);
      setSplittingRight(false);
      
      await delay(800);
      setForkingComplete(true);
      setShowSuccess(true);
      await delay(2000);
      setShowSuccess(false);
      
      // CHANGE HERE: Only show token info after success message is dismissed
      await delay(300); // Small delay after success message disappears
      setAnimationFinished(true);
      await delay(500); // Delay before showing token info
      setShowTokenInfo(true); // Trigger token info display
    };
    
    // Start the animation sequence
    animateForking();
  }, []);

  // Helper function for delays
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Fixed positioning values for better window alignment
  const amm1Position = "35%";
  const amm2Position = "65%";

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-black overflow-hidden">
      {/* Enhanced starfield background */}
      <EnhancedStarField />
      
      {/* Elegant gradient background */}
      <div 
        className="absolute inset-0 z-0"
        style={{ 
          background: 'radial-gradient(circle at 50% 40%, rgba(15,15,20,0.3) 0%, rgba(0,0,0,1) 70%)',
          pointerEvents: 'none' 
        }}
      />

      {/* Main content container with improved responsiveness */}
      <div className="relative z-10 flex-grow flex flex-col items-center justify-start pt-12 pb-16 px-4 md:px-6">
        {/* Heading with subtle glow */}
        <motion.h1 
          className="text-white text-4xl md:text-5xl font-light tracking-wide mb-16 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ textShadow: "0 0 20px rgba(255,255,255,0.2)" }}
        >
          Subnet Fork Complete
        </motion.h1>

        {/* Improved subnet visualization container with better responsiveness */}
        <div className="relative w-full max-w-6xl mx-auto h-[350px] md:h-[450px] mb-10 md:mb-16">
          {/* Improved positioning container with better window alignment */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* AMM1 Circle with responsive positioning */}
            <motion.div 
              className="absolute"
              style={{ 
                left: amm1Position, 
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
              animate={{ 
                width: ammSizes.amm1Size,
                height: ammSizes.amm1Size,
              }}
              transition={{ duration: 0.8 }}
            >
              {showAMM1 && (
                <>
                  {/* Shadow element directly behind AMM1 */}
                  {animationFinished && (
                    <motion.div
                      className="absolute rounded-full"
                      style={{
                        width: ammSizes.amm1Size * 1.5,
                        height: ammSizes.amm1Size * 1.5,
                        left: "50%",
                        top: "50%",
                        background: "radial-gradient(circle, rgba(255,139,37,0.3) 0%, rgba(255,139,37,0.1) 40%, rgba(255,139,37,0) 70%)",
                        transform: 'translate(-50%, -50%)',
                        zIndex: -1
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: [0.6, 0.9, 0.6],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  {/* AMM1 glow effect */}
                  <EnhancedBlobEffect 
                    active={true} 
                    scale={ammSizes.amm1Size / 220} // Scale based on size
                    color="rgba(255, 139, 37, 0.4)"
                    x="50%"
                    y="50%"
                    pulse={!splitting}
                  />
                  {/* AMM1 circle */}
                  <motion.div 
                    className="absolute bg-black border-2 border-orange-500 rounded-full flex items-center justify-center overflow-hidden z-10"
                    style={{ 
                      width: ammSizes.amm1Size, 
                      height: ammSizes.amm1Size,
                      left: "50%",
                      top: "50%",
                      transform: 'translate(-50%, -50%)',
                      boxShadow: animationFinished ? 
                        '0 0 10px 5px rgba(255, 139, 37, 0.15), 0 0 15px 8px rgba(255, 139, 37, 0.1), inset 0 0 10px rgba(255, 139, 37, 0.1)' : 
                        'none',
                    }}
                  >
                    <motion.span 
                      className="text-white text-lg font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      AMM1
                    </motion.span>
                  </motion.div>
                </>
              )}
            </motion.div>
            
            {/* Liquidity flow line with proper attachment points */}
            <LiquidityFlowLine 
              active={flowingLiquidity} 
              progress={progressValue} 
              amm1Size={ammSizes.amm1Size}
              amm2Size={ammSizes.amm2Size}
              amm1X={amm1Position}
              amm2X={amm2Position}
            />
            
            {/* AMM2 Circle with responsive positioning */}
            <motion.div 
              className="absolute"
              style={{ 
                left: amm2Position, 
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
              animate={{ 
                width: ammSizes.amm2Size,
                height: ammSizes.amm2Size,
              }}
              transition={{ duration: 0.8 }}
            >
              {showAMM2 && (
                <>
                  {/* Shadow element directly behind AMM2 */}
                  {animationFinished && (
                    <motion.div
                      className="absolute rounded-full"
                      style={{
                        width: ammSizes.amm2Size * 1.8,
                        height: ammSizes.amm2Size * 1.8,
                        left: "50%",
                        top: "50%",
                        background: "radial-gradient(circle, rgba(0,219,188,0.35) 0%, rgba(0,219,188,0.12) 40%, rgba(0,219,188,0) 70%)",
                        transform: 'translate(-50%, -50%)',
                        zIndex: -1
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: [0.7, 1, 0.7],
                        scale: [1, 1.08, 1]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  {/* AMM2 glow effect */}
                  <EnhancedBlobEffect 
                    active={true} 
                    scale={ammSizes.amm2Size / 220} // Scale based on size
                    color="rgba(0, 219, 188, 0.4)"
                    x="50%"
                    y="50%"
                    pulse={!splitting}
                  />
                  {/* AMM2 circle */}
                  <motion.div 
                    className="absolute bg-black border-2 border-teal-500 rounded-full flex items-center justify-center overflow-hidden z-10"
                    style={{ 
                      width: ammSizes.amm2Size, 
                      height: ammSizes.amm2Size,
                      left: "50%",
                      top: "50%",
                      transform: 'translate(-50%, -50%)',
                      boxShadow: animationFinished ? 
                        '0 0 12px 6px rgba(0, 219, 188, 0.15), 0 0 18px 10px rgba(0, 219, 188, 0.1), inset 0 0 12px rgba(0, 219, 188, 0.1)' : 
                        'none',
                    }}
                  >
                    <motion.span 
                      className="text-white text-lg font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      AMM2
                    </motion.span>
                  </motion.div>
                </>
              )}
            </motion.div>
          </div>
          
          {/* Added animated connection lines after animation completes */}
          {animationFinished && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full z-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
            >
              {/* Subtle connecting path between the AMMs */}
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                <motion.path
                  d={`M ${parseInt(amm1Position)} 50% Q 50% 65%, ${parseInt(amm2Position)} 50%`}
                  fill="none"
                  stroke="url(#gradientPath)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.5 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
                <defs>
                  <linearGradient id="gradientPath" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,139,37,0.5)" />
                    <stop offset="100%" stopColor="rgba(0,219,188,0.5)" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          )}
        </div>

        {/* Token info area with improved responsiveness */}
        <AnimatePresence>
          {showTokenInfo && (
            <motion.div 
              className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 px-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              <div className="space-y-4">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mr-3"></div>
                  <h3 className="text-white text-xl font-light">AMM1 Tokens</h3>
                </div>
                
                <motion.div 
                  className="bg-[#111]/80 backdrop-blur-md border border-orange-500/30 rounded-lg p-5 w-full hover:border-orange-500/60 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                  whileHover={{ 
                    y: -5,
                    boxShadow: "0 10px 25px -5px rgba(255, 139, 37, 0.3)",
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center mr-3">
                        <span className="text-orange-500 text-sm font-medium">τ</span>
                      </div>
                      <span className="text-gray-200 font-medium text-lg">TAO</span>
                    </div>
                    <div className="flex items-center px-3 py-1 bg-red-900/20 rounded-full">
                      <FaArrowDown size={10} className="text-red-400 mr-1.5" />
                      <span className="text-red-400 text-sm">3.8%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline mt-2 mb-4">
                    <span className="text-4xl font-light text-white">6.00K</span>
                    <span className="text-gray-400 text-lg ml-2">τ</span>
                  </div>
                  
                  <div className="h-1 w-full bg-[#151515] rounded-full overflow-hidden">
                    <div className="h-full w-[45%] bg-gradient-to-r from-orange-600/30 to-orange-500/30 rounded-full"></div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="bg-[#111]/80 backdrop-blur-md border border-orange-500/30 rounded-lg p-5 w-full hover:border-orange-500/60 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15, type: "spring", stiffness: 100 }}
                  whileHover={{ 
                    y: -5,
                    boxShadow: "0 10px 25px -5px rgba(255, 139, 37, 0.3)",
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center mr-3">
                        <span className="text-orange-500 text-sm font-medium">α</span>
                      </div>
                      <span className="text-gray-200 font-medium text-lg">Alpha</span>
                    </div>
                    <div className="flex items-center px-3 py-1 bg-red-900/20 rounded-full">
                      <FaArrowDown size={10} className="text-red-400 mr-1.5" />
                      <span className="text-red-400 text-sm">4.2%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline mt-2 mb-4">
                    <span className="text-4xl font-light text-white">0.78</span>
                    <span className="text-gray-400 text-lg ml-2">α</span>
                  </div>
                  
                  <div className="h-1 w-full bg-[#151515] rounded-full overflow-hidden">
                    <div className="h-full w-[35%] bg-gradient-to-r from-orange-600/30 to-orange-500/30 rounded-full"></div>
                  </div>
                </motion.div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 rounded-full bg-teal-500 mr-3"></div>
                  <h3 className="text-white text-xl font-light">AMM2 Tokens</h3>
                </div>
                
                <motion.div 
                  className="bg-[#111]/80 backdrop-blur-md border border-teal-500/30 rounded-lg p-5 w-full hover:border-teal-500/60 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ 
                    y: -5,
                    boxShadow: "0 10px 25px -5px rgba(0, 219, 188, 0.3)",
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/20 to-teal-600/10 flex items-center justify-center mr-3">
                        <span className="text-teal-500 text-sm font-medium">τ</span>
                      </div>
                      <span className="text-gray-200 font-medium text-lg">TAO</span>
                    </div>
                    <div className="flex items-center px-3 py-1 bg-teal-900/20 rounded-full">
                      <FaArrowUp size={10} className="text-teal-400 mr-1.5" />
                      <span className="text-teal-400 text-sm">7.3%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline mt-2 mb-4">
                    <span className="text-4xl font-light text-white">9.00K</span>
                    <span className="text-gray-400 text-lg ml-2">τ</span>
                  </div>
                  
                  <div className="h-1 w-full bg-[#151515] rounded-full overflow-hidden">
                    <div className="h-full w-[65%] bg-gradient-to-r from-teal-600/30 to-teal-500/30 rounded-full"></div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="bg-[#111]/80 backdrop-blur-md border border-teal-500/30 rounded-lg p-5 w-full hover:border-teal-500/60 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25, type: "spring", stiffness: 100 }}
                  whileHover={{ 
                    y: -5,
                    boxShadow: "0 10px 25px -5px rgba(0, 219, 188, 0.3)",
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/20 to-teal-600/10 flex items-center justify-center mr-3">
                        <span className="text-teal-500 text-sm font-medium">α</span>
                      </div>
                      <span className="text-gray-200 font-medium text-lg">Alpha</span>
                    </div>
                    <div className="flex items-center px-3 py-1 bg-teal-900/20 rounded-full">
                      <FaArrowUp size={10} className="text-teal-400 mr-1.5" />
                      <span className="text-teal-400 text-sm">6.1%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline mt-2 mb-4">
                    <span className="text-4xl font-light text-white">1.25</span>
                    <span className="text-gray-400 text-lg ml-2">α</span>
                  </div>
                  
                  <div className="h-1 w-full bg-[#151515] rounded-full overflow-hidden">
                    <div className="h-full w-[70%] bg-gradient-to-r from-teal-600/30 to-teal-500/30 rounded-full"></div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Operations stopped message */}
      {operationsStopped && (
        <motion.div
          className="absolute top-28 right-8 bg-gradient-to-r from-[#331111]/80 to-[#221111]/80 text-white px-4 py-2 rounded-md border border-[#ff3333]/30 z-30 backdrop-blur-sm"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 50, opacity: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#ff3333] animate-pulse"></div>
            <span>Subnet operations paused during forking</span>
          </div>
        </motion.div>
      )}
      
      {/* Success animation */}
      <AnimatePresence>
        {showSuccess && <SuccessAnimation />}
      </AnimatePresence>
      
      {/* Footer */}
      <Footer />
      
      {/* CSS for animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.25; }
        }
        
        @keyframes microTwinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default SubnetForkingPage;