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
import { Server } from "socket.io";
import fetch from "node-fetch";
import Comment from './models/Comment';
import Proposal from './models/Proposal';

const app = express();
const PORT = process.env.PORT || 5001;
const FLASK_SERVER = process.env.FLASK_SERVER || "http://127.0.0.1:5001";

// ─── BODY PARSING MIDDLEWARE ────────────────────────────────────────────────────
// without this, req.body will be undefined and every POST/PUT with a JSON body
// blows up with a 500
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Middleware
app.use((req, res, next) => {
  // Log all incoming requests
  console.log(`${req.method} ${req.url}`);
  
  // For POST/PUT requests, log the body
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  
  // Continue to the next middleware
  next();
});

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/bittensor-governance";
mongoose.set('strictQuery', false);
mongoose
  .connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((error) => console.error('❌ MongoDB connection error:', error.message));

// Initialize WebSocket Server with proper CORS
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
  },
});

// Debug endpoint to check if server is running
app.get('/api/debug', (req, res) => {
  console.log('Debug endpoint hit');
  res.json({ message: 'Server is running' });
});

// Debug endpoint to check if Comment model is loaded
app.get('/api/debug/comment-model', (req, res) => {
  console.log('Comment model:', Comment);
  res.json({ 
    modelName: Comment.modelName,
    collectionName: Comment.collection.name,
    mongoURI: mongoURI
  });
});

// Debug endpoint to check MongoDB connection
app.get('/api/debug/db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    res.json({ 
      status: stateMap[dbState],
      database: mongoose.connection.name,
      host: mongoose.connection.host
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid proposal ID format' });
    }
    
    let proposal;
    try {
      proposal = await Proposal.findById(req.params.id);
    } catch (findErr) {
      console.error('Error finding proposal:', findErr);
      return res.status(500).json({ error: 'Database error when finding proposal' });
    }

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Votes
app.put('/api/proposals/:id/vote', async (req, res) => {
  try {
    // Log the full request body for debugging
    console.log(`Vote request received for proposal ${req.params.id}:`, req.body);
    
    const { vote, weight = 1, walletAddress } = req.body;
    
    if (!vote) {
      return res.status(400).json({ error: 'Vote type (yes/no/abstain) is required' });
    }
    
    // Find the proposal with better error handling
    let proposal;
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid proposal ID format' });
      }
      
      proposal = await Proposal.findById(req.params.id);
    } catch (findErr) {
      console.error('Error finding proposal:', findErr);
      return res.status(500).json({ error: 'Database error when finding proposal' });
    }

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    // Initialize voting_stats if it doesn't exist
    if (!proposal.voting_stats) {
      proposal.voting_stats = {
        yes: 0,
        no: 0,
        abstain: 0,
        total_votes: 0
      };
    }
    
    // Update vote counts based on vote type
    if (vote === 'yes') {
      proposal.voting_stats.yes = (proposal.voting_stats.yes || 0) + weight;
    } else if (vote === 'no') {
      proposal.voting_stats.no = (proposal.voting_stats.no || 0) + weight;
    } else if (vote === 'abstain') {
      proposal.voting_stats.abstain = (proposal.voting_stats.abstain || 0) + weight;
    } else {
      return res.status(400).json({ error: `Invalid vote: ${vote}` });
    }
    
    // Update total votes
    proposal.voting_stats.total_votes = (proposal.voting_stats.total_votes || 0) + weight;
    
    // Save the updated proposal
    const updated = await proposal.save();
    console.log('Vote recorded successfully:', updated.voting_stats);
    
    // Emit socket event with the updated proposal
    io.emit('voteUpdate', updated);
    
    return res.json(updated);
  } catch (err) {
    console.error('❌ Error in /api/proposals/:id/vote →', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ===== COMMENT API ENDPOINTS =====

// Get comments for a proposal
app.get('/api/proposals/:proposalId/comments', async (req, res) => {
  try {
    const { proposalId } = req.params;
    console.log(`Fetching comments for proposal: ${proposalId}`);
    
    const comments = await Comment.find({ proposalId }).sort({ createdAt: -1 });
    console.log(`Found ${comments.length} comments for proposal ${proposalId}`);
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a comment to a proposal
app.post('/api/proposals/:proposalId/comments', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { content, authorAddress } = req.body;
    
    console.log(`Adding comment to proposal ${proposalId} by ${authorAddress}`);
    console.log(`Comment content: ${content}`);
    
    if (!content || !authorAddress) {
      return res.status(400).json({ error: 'Content and author address are required' });
    }
    
    const newComment = new Comment({
      content,
      authorAddress,
      proposalId,
      createdAt: new Date(),
      upvotes: 0,
      downvotes: 0,
      upvotedBy: [],
      downvotedBy: [],
      replies: []
    });
    
    const savedComment = await newComment.save();
    console.log(`Comment saved with ID: ${savedComment._id}`);
    
    // Emit event to all clients
    io.emit('commentAdded', {
      proposalId,
      comment: savedComment
    });
    
    res.status(201).json(savedComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a reply to a comment
app.post('/api/comments/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content, authorAddress } = req.body;
    
    if (!content || !authorAddress) {
      return res.status(400).json({ error: 'Content and author address are required' });
    }
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const reply = {
      content,
      authorAddress,
      createdAt: new Date(),
      upvotes: 0,
      downvotes: 0,
      upvotedBy: [],
      downvotedBy: []
    };
    
    comment.replies.push(reply);
    await comment.save();
    
    // Emit event to all clients
    io.emit('replyAdded', {
      proposalId: comment.proposalId,
      commentId,
      reply,
      replyIndex: comment.replies.length - 1
    });
    
    res.status(201).json(reply);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upvote a comment
app.post('/api/comments/:commentId/upvote', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user already upvoted
    if (comment.upvotedBy.includes(walletAddress)) {
      // Remove upvote
      comment.upvotedBy = comment.upvotedBy.filter(addr => addr !== walletAddress);
      comment.upvotes = Math.max(0, comment.upvotes - 1);
    } else {
      // Add upvote
      comment.upvotedBy.push(walletAddress);
      comment.upvotes += 1;
      
      // Remove downvote if exists
      if (comment.downvotedBy.includes(walletAddress)) {
        comment.downvotedBy = comment.downvotedBy.filter(addr => addr !== walletAddress);
        comment.downvotes = Math.max(0, comment.downvotes - 1);
      }
    }
    
    await comment.save();
    
    // Emit event to all clients
    io.emit('commentVoteUpdated', {
      proposalId: comment.proposalId,
      commentId,
      upvotes: comment.upvotes,
      downvotes: comment.downvotes
    });
    
    res.json({ upvotes: comment.upvotes, downvotes: comment.downvotes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Downvote a comment
app.post('/api/comments/:commentId/downvote', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user already downvoted
    if (comment.downvotedBy.includes(walletAddress)) {
      // Remove downvote
      comment.downvotedBy = comment.downvotedBy.filter(addr => addr !== walletAddress);
      comment.downvotes = Math.max(0, comment.downvotes - 1);
    } else {
      // Add downvote
      comment.downvotedBy.push(walletAddress);
      comment.downvotes += 1;
      
      // Remove upvote if exists
      if (comment.upvotedBy.includes(walletAddress)) {
        comment.upvotedBy = comment.upvotedBy.filter(addr => addr !== walletAddress);
        comment.upvotes = Math.max(0, comment.upvotes - 1);
      }
    }
    
    await comment.save();
    
    // Emit event to all clients
    io.emit('commentVoteUpdated', {
      proposalId: comment.proposalId,
      commentId,
      upvotes: comment.upvotes,
      downvotes: comment.downvotes
    });
    
    res.json({ upvotes: comment.upvotes, downvotes: comment.downvotes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upvote a reply
app.post('/api/comments/:commentId/replies/:replyIndex/upvote', async (req, res) => {
  try {
    const { commentId, replyIndex } = req.params;
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const reply = comment.replies[replyIndex];
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }
    
    // Check if user already upvoted
    if (reply.upvotedBy.includes(walletAddress)) {
      // Remove upvote
      reply.upvotedBy = reply.upvotedBy.filter(addr => addr !== walletAddress);
      reply.upvotes = Math.max(0, reply.upvotes - 1);
    } else {
      // Add upvote
      reply.upvotedBy.push(walletAddress);
      reply.upvotes += 1;
      
      // Remove downvote if exists
      if (reply.downvotedBy.includes(walletAddress)) {
        reply.downvotedBy = reply.downvotedBy.filter(addr => addr !== walletAddress);
        reply.downvotes = Math.max(0, reply.downvotes - 1);
      }
    }
    
    await comment.save();
    
    // Emit event to all clients
    io.emit('replyVoteUpdated', {
      proposalId: comment.proposalId,
      commentId,
      replyIndex,
      upvotes: reply.upvotes,
      downvotes: reply.downvotes
    });
    
    res.json({ upvotes: reply.upvotes, downvotes: reply.downvotes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Downvote a reply
app.post('/api/comments/:commentId/replies/:replyIndex/downvote', async (req, res) => {
  try {
    const { commentId, replyIndex } = req.params;
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const reply = comment.replies[replyIndex];
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }
    
    // Check if user already downvoted
    if (reply.downvotedBy.includes(walletAddress)) {
      // Remove downvote
      reply.downvotedBy = reply.downvotedBy.filter(addr => addr !== walletAddress);
      reply.downvotes = Math.max(0, reply.downvotes - 1);
    } else {
      // Add downvote
      reply.downvotedBy.push(walletAddress);
      reply.downvotes += 1;
      
      // Remove upvote if exists
      if (reply.upvotedBy.includes(walletAddress)) {
        reply.upvotedBy = reply.upvotedBy.filter(addr => addr !== walletAddress);
        reply.upvotes = Math.max(0, reply.upvotes - 1);
      }
    }
    
    await comment.save();
    
    // Emit event to all clients
    io.emit('replyVoteUpdated', {
      proposalId: comment.proposalId,
      commentId,
      replyIndex,
      upvotes: reply.upvotes,
      downvotes: reply.downvotes
    });
    
    res.json({ upvotes: reply.upvotes, downvotes: reply.downvotes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// After all your routes are defined, add this to list all registered routes
app.get('/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Routes added via router
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json(routes);
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://127.0.0.1:${PORT}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI.substring(0, 20)}...`);
});

// Handle Shutdown Gracefully
process.on('SIGINT', () => {
  console.log('🔴 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});