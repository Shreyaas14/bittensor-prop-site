// src/components/ui/WalletConnectButton.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { web3Enable, web3Accounts, web3FromAddress } from "@polkadot/extension-dapp";
import { ApiPromise, WsProvider } from "@polkadot/api";
import axios from "axios";
import { FaWallet, FaExclamationTriangle, FaTimes, FaCheck, FaChevronDown } from "react-icons/fa";

interface WalletSession {
  address: string;
  network: string;
  balance: number;
}

interface WalletConnectButtonProps {
  onConnect: (address: string | null, taoBalance: number) => void;
  isNavbar?: boolean;
}

const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ onConnect, isNavbar = false }) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [session, setSession] = useState<WalletSession | null>(null);
  const [taoBalance, setTaoBalance] = useState<number>(0);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"error" | "info" | "success">("info");
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (session) onConnect(session.address, taoBalance);
  }, [session, taoBalance, onConnect]);

  // Automatically hide notification after 5 seconds
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  // Check if we're already connected on mount
  useEffect(() => {
    // Try to load session from localStorage
    const savedAddress = localStorage.getItem("walletAddress");
    const savedBalance = localStorage.getItem("taoBalance");
    
    if (savedAddress) {
      setSession({
        address: savedAddress,
        network: "Bittensor",
        balance: parseFloat(savedBalance || "0")
      });
      setTaoBalance(parseFloat(savedBalance || "0"));
    }
  }, []);

  // When session changes, update localStorage
  useEffect(() => {
    if (session) {
      localStorage.setItem("walletAddress", session.address);
      localStorage.setItem("taoBalance", taoBalance.toString());
    }
  }, [session, taoBalance]);

  const showErrorNotification = (message: string) => {
    setNotificationMessage(message);
    setNotificationType("error");
    setShowNotification(true);
    setError(message);
  };

  const connectWallet = async () => {
    setConnecting(true);
    setError(null);

    try {
      console.log("🔄 Enabling web3 extension...");
      const extensions = await web3Enable("Bittensor DApp");

      if (extensions.length === 0) {
        showErrorNotification("Bittensor Wallet Extension is not installed");
        setConnecting(false);
        return;
      }

      console.log("Extension detected. Fetching accounts...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      const allAccounts = await web3Accounts();

      if (allAccounts.length === 0) {
        showErrorNotification("No Bittensor accounts found. Please create or import an account in your wallet");
        setConnecting(false);
        return;
      }

      setAccounts(allAccounts);
      setShowAccounts(true);
    } catch (err: any) {
      showErrorNotification(err.message || "Wallet connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const fetchTaoBalance = async (account: string) => {
    try {
      console.log("🔄 Fetching TAO balance...");
      const provider = new WsProvider("wss://entrypoint-finney.opentensor.ai:443");
      const api = await ApiPromise.create({ provider });

      // Simulating balance fetch - in production, use actual API call
      const { data: balanceData } = await axios.get(`https://taobalance.bittensor.com/${account}`);
      const balance = parseFloat(balanceData.balance) || 0;
      console.log(`TAO Balance for ${account}:`, balance);

      setTaoBalance(balance);
    } catch (err) {
      console.error("Error fetching TAO balance:", err);
      setTaoBalance(0);
    }
  };

  const handleSignIn = async () => {
    if (!selectedAccount) {
      showErrorNotification("Please select an account first");
      return;
    }

    setConnecting(true);
    try {
      console.log("🔄 Connecting to Bittensor network...");

      const provider = new WsProvider("wss://entrypoint-finney.opentensor.ai:443");
      const api = await ApiPromise.create({ provider });

      console.log("WebSocket provider connected.");

      const injector = await web3FromAddress(selectedAccount);
      const signer = injector.signer;

      if (!signer || !signer.signRaw) {
        showErrorNotification("Your wallet does not support signRaw. Try restarting the extension");
        setConnecting(false);
        return;
      }

      const challenge = Date.now().toString();
      console.log("🔄 Signing challenge...");
      
      const { signature } = await signer.signRaw({
        type: "bytes",
        data: challenge,
        address: selectedAccount,
      });

      console.log("Signature received. Sending to backend...");
      console.log("Sending login request with:", { selectedAccount, challenge, signature });

      const { data } = await axios.post("http://127.0.0.1:5001/auth/login", {
        address: selectedAccount,
        challenge,
        signature,
      });

      console.log("Authentication Successful:", data);

      await fetchTaoBalance(selectedAccount);

      setSession({
        address: selectedAccount,
        network: "Bittensor",
        balance: taoBalance,
      });

      localStorage.setItem("jwt", data.token);
      
      // Show success notification
      setNotificationMessage("Wallet connected successfully");
      setNotificationType("success");
      setShowNotification(true);
    } catch (err: any) {
      console.error("Login Failed:", err);
      showErrorNotification(err.message || "Wallet authentication failed");
    } finally {
      setConnecting(false);
      setShowAccounts(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Notification component
  const Notification = () => (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-4 right-4 z-50 rounded-lg shadow-lg p-4 max-w-sm ${
            notificationType === "error" 
              ? "bg-gradient-orange/90 border border-gradient-orange shadow-[0_0_20px_rgba(255,139,37,0.2)]" 
              : notificationType === "success" 
                ? "bg-teal/90 border border-teal shadow-[0_0_20px_rgba(0,219,188,0.2)]" 
                : "bg-background-secondary border border-border"
          }`}
        >
          <div className="flex items-center">
            <div className="mr-3">
              {notificationType === "error" ? (
                <FaExclamationTriangle className="text-white text-xl" />
              ) : (
                <FaWallet className="text-white text-xl" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">
                {notificationType === "error" ? "Error" : notificationType === "success" ? "Success" : "Info"}
              </h3>
              <p className="text-sm text-white/90">{notificationMessage}</p>
              {notificationType === "error" && (
                <a 
                  href="https://chromewebstore.google.com/detail/bittensor-wallet/bdgmdoedahdcjmpmifafdhnffjinddgc?hl=en" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white text-sm underline mt-1 block hover:opacity-90"
                >
                  Install Bittensor Wallet Extension
                </a>
              )}
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="text-white opacity-70 hover:opacity-100"
            >
              <FaTimes />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (connecting) {
    return (
      <>
        <Notification />
        <motion.div 
          className="bg-background/30 border border-white text-white font-medium text-center py-3 px-4 rounded-lg w-full flex items-center justify-center"
          animate={{ 
            boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 10px rgba(255,255,255,0.3)", "0 0 0px rgba(255,255,255,0)"],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <motion.div 
            className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          ></motion.div>
          Connecting...
        </motion.div>
      </>
    );
  }

  return (
    <>
      <Notification />

      {showAccounts ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border rounded-lg p-4 shadow-lg"
        >
          <p className="text-white font-medium mb-3">Select Account</p>
          <div className="space-y-2 max-h-48 overflow-y-auto mb-4 pr-1">
            {accounts.map((account) => (
              <motion.button
                key={account.address}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedAccount(account.address)}
                className={`w-full p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedAccount === account.address 
                    ? "bg-teal/10 border border-teal shadow-[0_0_10px_rgba(0,219,188,0.15)]" 
                    : "bg-background border border-border hover:border-teal/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-white font-medium">{account.meta.name}</p>
                    <p className="text-text-secondary text-sm font-mono">{formatAddress(account.address)}</p>
                  </div>
                  {selectedAccount === account.address && (
                    <motion.div 
                      className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <FaCheck className="text-teal" size={10} />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "#232323" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAccounts(false)}
              className="flex-1 py-2 px-3 text-white bg-background border border-border hover:bg-card rounded-lg font-medium transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 10px rgba(0,219,188,0.2)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignIn}
              disabled={!selectedAccount}
              className="flex-1 py-2 px-3 text-black bg-teal hover:opacity-90 rounded-lg font-medium disabled:bg-text-secondary disabled:opacity-50 transition-all"
            >
              Connect
            </motion.button>
          </div>
          
          {error && !showNotification && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-gradient-orange text-sm"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      ) : (
        <motion.button
          className="flex items-center justify-center w-full h-full bg-black border border-white/20 text-white rounded-md px-3 py-1.5 text-sm font-medium"
          whileHover={{ 
            scale: 1.02,
            borderColor: "rgba(255,255,255,0.4)",
            boxShadow: "0 0 8px rgba(255,255,255,0.1)"
          }}
          whileTap={{ scale: 0.98 }}
          onClick={connectWallet}
        >
          <FaWallet className="mr-2" size={14} />
          Connect Wallet
        </motion.button>
      )}
    </>
  );
};

export default WalletConnectButton;