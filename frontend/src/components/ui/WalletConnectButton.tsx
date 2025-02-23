import React, { useState, useEffect } from "react";
import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Button } from "./button"; // Import your existing Button component

interface WalletConnectButtonProps {
  onConnect: (walletAddress: string) => void; // Prop to pass wallet address
}

const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ onConnect }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [web3Modal, setWeb3Modal] = useState<Web3Modal | null>(null);

  useEffect(() => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          rpc: {
            1: "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID", // Replace with a valid Infura ID
          },
        },
      },
    };

    setWeb3Modal(
      new Web3Modal({
        cacheProvider: true,
        providerOptions,
      })
    );
  }, []);

  const connectWallet = async () => {
    if (!web3Modal) return;
    try {
      const provider = await web3Modal.connect();
      const web3 = new Web3(provider);
      const accounts = await web3.eth.getAccounts();
      if (accounts.length > 0) {
        setAccount(accounts[0]); // Set connected account
        onConnect(accounts[0]); // Pass wallet address to VotingPanel
      }
    } catch (error) {
      console.error("WalletConnect Error:", error);
    }
  };

  return (
    <Button onClick={connectWallet} variant="default">
      {account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
    </Button>
  );
};

export default WalletConnectButton;
