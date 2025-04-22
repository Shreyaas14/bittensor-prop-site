import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppContextType {
  walletAddress: string | null;
  taoBalance: number;
  setWalletAddress: (address: string | null) => void;
  setTaoBalance: (balance: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [taoBalance, setTaoBalance] = useState<number>(0);

  // Load wallet address from localStorage on app startup
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress");
    const savedBalance = localStorage.getItem("taoBalance");
    
    if (savedAddress) {
      setWalletAddress(savedAddress);
      setTaoBalance(parseFloat(savedBalance || "0"));
    }
  }, []);

  // Save wallet address to localStorage whenever it changes
  useEffect(() => {
    if (walletAddress) {
      localStorage.setItem("walletAddress", walletAddress);
      localStorage.setItem("taoBalance", taoBalance.toString());
    } else {
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("taoBalance");
    }
  }, [walletAddress, taoBalance]);

  return (
    <AppContext.Provider value={{ walletAddress, taoBalance, setWalletAddress, setTaoBalance }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};