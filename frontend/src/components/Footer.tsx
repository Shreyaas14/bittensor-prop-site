// src/components/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer: React.FC = () => {
  return (
    <motion.footer 
      className="bg-black border-t border-[#1a1a1a] py-8 px-6 mt-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center">
        <Link to="/" className="flex items-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34.44 36.91" className="h-6 w-6 mr-2">
            <path fill="#fff" d="M20.88,28.32V13.19c0-3.78-3.12-6.86-6.9-6.86V30.51c0,4.81,4.08,6.4,6.6,6.4,2.09,0,3.27-.36,4.69-1.36-3.98-.42-4.39-2.82-4.39-7.23Z"/>
            <path fill="#fff" d="M6.29,0C2.82,0,0,2.87,0,6.34H28.15c3.47,0,6.29-2.87,6.29-6.34H6.29Z"/>
          </svg>
          <span className="text-white font-medium text-lg">taogov</span>
        </Link>
        <p className="text-[#AAAAAA] text-sm text-center">
          Created by Aaron, Anish, Shreyaas, and Rifa
        </p>
      </div>
    </motion.footer>
  );
};

export default Footer;