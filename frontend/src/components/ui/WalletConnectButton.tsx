import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { web3Enable, web3Accounts, web3FromAddress } from "@polkadot/extension-dapp";
import { ApiPromise, WsProvider } from "@polkadot/api";
import axios from "axios";

interface WalletSession {
  address: string;
  network: string;
  balance: number;
}

const WalletConnectButton: React.FC<{ onConnect: (address: string | null, taoBalance: number) => void }> = ({ onConnect }) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [session, setSession] = useState<WalletSession | null>(null);
  const [taoBalance, setTaoBalance] = useState<number>(0);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) onConnect(session.address, taoBalance);
  }, [session, taoBalance, onConnect]);

  const connectWallet = async () => {
    setConnecting(true);
    setError(null);

    try {
      console.log("🔄 Enabling web3 extension...");
      const extensions = await web3Enable("Bittensor DApp");

      if (extensions.length === 0) {
        alert("Bittensor Wallet Extension is not installed. Install it from the Chrome Web Store.");
        setError("Bittensor Wallet Extension not detected.");
        setConnecting(false);
        return;
      }

      console.log("Extension detected. Fetching accounts...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      const allAccounts = await web3Accounts();

      if (allAccounts.length === 0) {
        alert("No Bittensor accounts found. Please create or import an account in your wallet.");
        setError("No Bittensor accounts found.");
        setConnecting(false);
        return;
      }

      setAccounts(allAccounts);
    } catch (err: any) {
      setError(err.message || "Wallet connection failed.");
    } finally {
      setConnecting(false);
    }
  };

  const fetchTaoBalance = async (account: string) => {
    try {
      console.log("🔄 Fetching TAO balance...");
      const provider = new WsProvider("wss://entrypoint-finney.opentensor.ai:443");
      const api = await ApiPromise.create({ provider });

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
      alert("Please select an account first!");
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
        alert("Your wallet does not support signRaw. Try restarting the extension.");
        setError("Wallet does not support signRaw.");
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
    } catch (err: any) {
      console.error("Login Failed:", err);
      setError(err.message || "Wallet authentication failed.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg shadow-lg bg-white w-full max-w-md mx-auto">
      {!session ? (
        <>
          <motion.button
            onClick={connectWallet}
            disabled={connecting}
            className="w-full px-4 py-3 text-lg font-bold text-white bg-blue-600 rounded-lg shadow-md transition-all hover:bg-blue-700 disabled:bg-gray-400"
            whileTap={{ scale: 0.95 }}
          >
            {connecting ? "Connecting..." : "Connect Bittensor Wallet"}
          </motion.button>

          {accounts.length > 0 && (
            <div className="mt-4">
              <select
                value={selectedAccount || ""}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">-- Select an account --</option>
                {accounts.map((account) => (
                  <option key={account.address} value={account.address}>
                    {account.meta.name} ({account.address})
                  </option>
                ))}
              </select>

              <motion.button
                onClick={handleSignIn}
                disabled={!selectedAccount || connecting}
                className="w-full mt-3 px-4 py-3 text-lg font-bold text-white bg-green-600 rounded-lg shadow-md transition-all hover:bg-green-700 disabled:bg-gray-400"
                whileTap={{ scale: 0.95 }}
              >
                {connecting ? "Signing in..." : "Sign In"}
              </motion.button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center">
          <p className="text-lg font-bold text-gray-700">Connected</p>
          <p className="text-sm text-gray-500">{session.address}</p>
          <p className="text-xl font-semibold text-blue-600 mt-2">{taoBalance.toFixed(4)} TAO</p>
        </div>
      )}
      {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default WalletConnectButton;
