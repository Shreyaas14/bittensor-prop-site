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
    const token = localStorage.getItem("jwt");
    
    // Only set the wallet address if both the address and token exist
    if (savedAddress && token) {
      setWalletAddress(savedAddress);
      setTaoBalance(parseFloat(savedBalance || "0"));
    } else {
      // If either is missing, clear everything to ensure consistent state
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("taoBalance");
      localStorage.removeItem("jwt");
      setWalletAddress(null);
      setTaoBalance(0);
    }
  }, []);

  // Custom setter that also updates localStorage
  const setWalletAddressWithStorage = (address: string | null) => {
    setWalletAddress(address);
    if (address) {
      localStorage.setItem("walletAddress", address);
    } else {
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("jwt");
      localStorage.removeItem("taoBalance");
    }
  };

  // Custom setter that also updates localStorage
  const setTaoBalanceWithStorage = (balance: number) => {
    setTaoBalance(balance);
    if (balance > 0) {
      localStorage.setItem("taoBalance", balance.toString());
    } else {
      localStorage.removeItem("taoBalance");
    }
  };

  return (
    <AppContext.Provider value={{ 
      walletAddress, 
      taoBalance, 
      setWalletAddress: setWalletAddressWithStorage, 
      setTaoBalance: setTaoBalanceWithStorage 
    }}>
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