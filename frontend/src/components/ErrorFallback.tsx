import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  error?: string;
  resetErrorBoundary?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error = "Something went wrong", 
  resetErrorBoundary 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="w-16 h-16 mb-6 text-error">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-xl font-medium mb-2 text-white">Error</h3>
      <p className="text-text-secondary mb-6">{error}</p>
      {resetErrorBoundary && (
        <Button 
          variant="default" 
          onClick={resetErrorBoundary}
        >
          Try Again
        </Button>
      )}
    </motion.div>
  );
}; 