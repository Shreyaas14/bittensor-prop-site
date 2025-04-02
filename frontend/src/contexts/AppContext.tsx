import React, { createContext, useContext, useState } from 'react';

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

  return (
    <AppContext.Provider value={{ walletAddress, taoBalance, setWalletAddress, setTaoBalance }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};