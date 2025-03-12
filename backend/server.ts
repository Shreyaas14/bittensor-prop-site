// server.ts
// @ts-nocheck
// server.ts
// This file serves as a proxy between the frontend and the Flask Bittensor API

import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import fetch from "node-fetch";
const Proposal = require('./models/Proposal').default;

const app = express();
const PORT = process.env.PORT || 5001;
const FLASK_SERVER = process.env.FLASK_SERVER || "http://127.0.0.1:5001";

// ===== CORS CONFIGURATION =====
app.use(cors());

// Apply CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Specific handler for OPTIONS requests
app.options('*', (req, res) => {
  res.status(200).end();
});

app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/defaultdb";
mongoose.set('strictQuery', false);
mongoose
  .connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((error) => console.error('❌ MongoDB connection error:', error.message));

// Initialize WebSocket Server with proper CORS
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
  },
});

// Handle WebSocket Connections
io.on("connection", (socket) => {
  console.log("🔗 New WebSocket client connected:", socket.id);

  // Listen for wallet connected events from clients
  socket.on('wallet_connected', (data) => {
    console.log('Received wallet_connected event from client:', data);
    // Broadcast to all clients
    io.emit('wallet_update', data);
  });

  socket.on("disconnect", () => {
    console.log("❌ WebSocket client disconnected:", socket.id);
  });
});

// ===== HEALTH CHECKS =====

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Check Flask server health
app.get('/flask-health', async (req, res) => {
  try {
    const response = await fetch(`${FLASK_SERVER}/health`);
    if (response.ok) {
      const data = await response.json();
      res.json({ flaskStatus: 'ok', status: data.status });
    } else {
      res.status(502).json({ flaskStatus: 'error', message: 'Flask server returned an error' });
    }
  } catch (error) {
    res.status(503).json({ 
      flaskStatus: 'unavailable', 
      message: 'Cannot connect to Flask server',
      details: error.message
    });
  }
});

// ===== WALLET API ENDPOINTS =====

// List available wallets
app.get('/wallet/list', async (req, res) => {
  try {
    const response = await fetch(`${FLASK_SERVER}/wallet/list`);
    
    if (!response.ok) {
      throw new Error(`Flask server error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error listing wallets:', error);
    res.status(500).json({ 
      error: "Failed to list wallets", 
      details: error.message,
      message: "Could not connect to Bittensor wallet service. Please check if the wallet service is running."
    });
  }
});

// Connect to wallet
app.post('/wallet/connect', async (req, res) => {
  console.log("🔍 Forwarding wallet connect request to Flask:", req.body);

  try {
    const response = await fetch(`${FLASK_SERVER}/wallet/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const responseData = await response.json();
    console.log("✅ Flask Response:", responseData);

    res.json(responseData);
  } catch (error) {
    console.error("❌ Error forwarding wallet connect request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== PROPOSAL API ENDPOINTS =====

// Create New Proposal
app.post('/api/proposals', async (req, res) => {
  try {
    const newProposal = new Proposal(req.body);
    const savedProposal = await newProposal.save();

    io.emit('proposalCreated', savedProposal);
    res.status(201).json(savedProposal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Proposals
app.get('/api/proposals', async (req, res) => {
  try {
    const proposals = await Proposal.find();
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Proposal by ID
app.get('/api/proposals/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Votes
app.put('/api/proposals/:id/vote', async (req, res) => {
  try {
    const { vote } = req.body;
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    if (vote === 'yes') proposal.voting_stats.yes += 1;
    else if (vote === 'no') proposal.voting_stats.no += 1;
    else if (vote === 'abstain') proposal.voting_stats.abstain += 1;

    proposal.voting_stats.total_votes += 1;
    const updatedProposal = await proposal.save();

    io.emit('voteUpdate', updatedProposal);
    res.json(updatedProposal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://127.0.0.1:${PORT}`);
});

// Handle Shutdown Gracefully
process.on('SIGINT', () => {
  console.log('🔴 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});