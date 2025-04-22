import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface PageLayoutProps {
  children: React.ReactNode;
  withAnimation?: boolean;
  withoutPadding?: boolean;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  withAnimation = true,
  withoutPadding = false,
  className
}) => {
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <main className={`flex-grow flex flex-col pt-16 ${!withoutPadding ? 'px-4 md:px-6 lg:px-8' : ''} ${className || ''}`}>
        {withAnimation ? (
          <motion.div 
            className="flex-grow flex flex-col"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
          >
            {children}
          </motion.div>
        ) : (
          <div className="flex-grow flex flex-col">
            {children}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}; 