// server.ts
// @ts-nocheck
// This file serves as a proxy between the frontend and the Flask Bittensor API
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import Comment from './models/Comment.ts';
import Proposal from './models/Proposal.js';
import { JsonRpcProvider, Contract, Wallet, WebSocketProvider, BigNumber, ethers } from "ethers";
import VotingArtifact from "./src/abi/SoftConsensusVoting.json";
import IntersubjectivityArtifact from "./src/abi/intersubjectivityToken.json";
import DelegatedVotingArtifact from "./src/abi/DelegatedVoting.json";
import addresses from "./src/contract_addresses.json";

const app = express();
const PORT = process.env.PORT || 5001;
const WEBSOCKET_URL = process.env.WEBSOCKET_URL_LOCAL;
const FLASK_SERVER = process.env.FLASK_SERVER || "http://127.0.0.1:5001";
const RPC_URL = process.env.RPC_URL_LOCAL
const PK = process.env.PRIVATE_KEY!;
const CONTRACT = process.env.VOTING_CONTRACT_ADDRESS!
const INTER_CONTRACT = process.env.TOKEN_CONTRACT_ADDRESS!
const DELEGATION_CONTRACT = process.env.DELEGATION_CONTRACT_ADDRESS!

// Dynamic import helper for node-fetch (ESM-only)
let _fetch: typeof fetch | null = null;
async function fetchDynamic(input: RequestInfo, init?: RequestInit) {
  if (!_fetch) {
    const mod = await import("node-fetch");
    _fetch = mod.default as typeof fetch;
  }
  return _fetch!(input, init);
}

// Ethereum on-chain setup
const provider = new JsonRpcProvider(RPC_URL);
const wsProv = new WebSocketProvider(WEBSOCKET_URL, {
  chainId: 945,
  name:  "localnet",
  ensAddress: null
});
const signer = new Wallet(PK, wsProv);
const votingOnChain = new Contract(CONTRACT, VotingArtifact.abi, signer);
const intersubjectivityToken = new Contract(INTER_CONTRACT, IntersubjectivityArtifact.abi, signer);
const tokenDelegation = new Contract(DELEGATION_CONTRACT, DelegatedVotingArtifact.abi, signer);


// Initialize WebSocket Server with proper CORS
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
  },
});

// Listen for on-chain events
votingOnChain.on('ProposalCreated', (pid, creator, event) => {
  console.log('📝 ProposalCreated →', {
    proposalId: pid.toString(),
    txHash: event.transactionHash,
    block: event.blockNumber
  });
  io.emit('onchain:proposalCreated', {
    id: pid.toNumber(),
    creator,
    txHash: event.transactionHash,
    block: event.blockNumber
  });
});

votingOnChain.on('VoteCast', (pid, voter, voteType, weight, event) => {
  console.log('🗳 VoteCast →', {
    proposalId: pid.toString(),
    voteType,
    weight: (weight / 10000000000000000000000).toString(),
  });
  io.emit('onchain:voteCast', {
    id: pid.toNumber(),
    voter,
    voteType,
    weight: weight.toString(),
    txHash: event.transactionHash
  });
});

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});
app.options('*', (_, res) => res.sendStatus(200));

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  if (['POST','PUT'].includes(req.method)) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// ─── DATABASE ─────────────────────────────────────────────────────────────────
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/bittensor-governance";
mongoose.set('strictQuery', false);
mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// register stakeholder to subnet
app.post('/api/subnets/:subnetId/register', async (req, res) => {
  try {
    const { accounts, roles } = req.body;
    if (!accounts || !roles) {
      return res.status(400).json({ error: 'accounts & roles required' });
    }
    const tx = await intersubjectivityToken.registerStakeholders(accounts, roles);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// init and rebalance
app.post('/api/subnets/:subnetId/initialize', async (req, res) => {
  try {
    const tx = await intersubjectivityToken.initializeAllocations();
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/subnets/:subnetId/rebalance', async (req, res) => {
  try {
    const tx = await intersubjectivityToken.rebalance();
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});



// Debug endpoints
app.get('/api/debug', (req, res) => res.json({ message: 'Server is running' }));
app.get('/api/debug/db', (req, res) => {
  const stateMap = ['disconnected','connected','connecting','disconnecting'];
  res.json({
    status: stateMap[mongoose.connection.readyState],
    db: mongoose.connection.name,
    host: mongoose.connection.host
  });
});

// Health checks
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/flask-health', async (req, res) => {
  try {
    const response = await fetchDynamic(`${FLASK_SERVER}/health`);
    if (response.ok) {
      const data = await response.json();
      res.json({ flaskStatus: 'ok', status: data.status });
    } else {
      res.status(502).json({ flaskStatus: 'error' });
    }
  } catch (error: any) {
    res.status(503).json({ flaskStatus: 'unavailable', error: error.message });
  }
});

// Wallet proxy
app.get('/wallet/list', async (req, res) => {
  try {
    const r = await fetchDynamic(`${FLASK_SERVER}/wallet/list`);
    const data = await r.json();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
app.post('/wallet/connect', async (req, res) => {
  try {
    const r = await fetchDynamic(`${FLASK_SERVER}/wallet/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Create Proposal
// server.ts (excerpt)
app.post('/api/proposals', async (req, res) => {
  try {
    // 1) save off-chain
    const newP = new Proposal(req.body);
    const saved = await newP.save();
    io.emit('proposalCreated', saved);

    // 2) on-chain createProposal
    const { content, voting_start, voting_end, level, subnet_id } = req.body;
    const tx = await votingOnChain.createProposal(
      content.title || "",
      content.summary || "",
      content.abstract || "",
      content.full_proposal || "",
      level || "",
      subnet_id || 0,
      Math.floor(new Date(voting_start).getTime() / 1000),
      Math.floor(new Date(voting_end).getTime()   / 1000)
    );
    const receipt = await tx.wait();

    // 3) try the decoded events array
    let createdEvent = Array.isArray(receipt.events)
      ? receipt.events.find(e => e.event === 'ProposalCreated')
      : undefined;

    // 4) fallback: manually parse raw logs
    if (!createdEvent) {
      const iface = votingOnChain.interface;
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed.name === 'ProposalCreated') {
            createdEvent = { args: parsed.args } as any;
            break;
          }
        } catch {
          // not our event
        }
      }
    }

    if (!createdEvent) {
      console.warn('⚠️ ProposalCreated event missing—logs:', receipt.logs);
      return res
        .status(500)
        .json({ error: 'On-chain ProposalCreated event missing' });
    }

    const rawId = createdEvent.args.proposalId;

    let onchainId: number;
    if (rawId && typeof rawId === 'object' && 'toNumber' in rawId) {
      onchainId = (rawId as ethers.BigNumber).toNumber();
    } else {
      onchainId = Number(rawId);
      if (Number.isNaN(onchainId)) {
        console.warn('Could not parse proposalId:', rawId);
        return res.status(500).json({ error: 'Invalid onchain proposalId format' });
      }
    }

    saved.onchainProposalId = onchainId;
    await saved.save();

    res.status(201).json(saved);
  } catch (err: any) {
    console.error('POST /api/proposals error →', err);
    res.status(500).json({ error: err.message });
  }
});


// List & read Proposals
app.get('/api/proposals', async (req, res) => {
  try {
    res.json(await Proposal.find());
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
app.get('/api/proposals/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const p = await Proposal.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/proposals/:id/vote', async (req, res) => {
  try {
    const { vote, walletAddress } = req.body;
    if (!vote || !walletAddress) {
      return res.status(400).json({ error: 'vote and walletAddress are required' });
    }

    // 1) Load & off‐chain update
    const p = await Proposal.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Proposal not found' });

    // 2) Determine weight
    let weightBN = 1
    if (p.subnet_id === 99) {
      // pull exactly from your DelegatedVoting.freeBalance mapping
      weightBN = await intersubjectivityToken.userAllocation(walletAddress);
      weightBN = Number(weightBN) / 10000000000000000000000;
    }

    if (weightBN ==0) {
      return res.status(400).json({ error: 'No tokens available to vote with' });
    }
    const weight = weightBN;

    // 3) Update off‐chain tally
    p.voting_stats = p.voting_stats || { yes: 0, no: 0, abstain: 0, total_votes: 0 };
    if (vote === 'yes')      p.voting_stats.yes     += weight;
    else if (vote === 'no')   p.voting_stats.no      += weight;
    else                      p.voting_stats.abstain += weight;
    p.voting_stats.total_votes += weight;
    const updated = await p.save();
    io.emit('voteUpdate', updated);

    // 4) On‐chain: correct .vote(...) signature
    const onchainId = p.onchainProposalId!;
    let tx;
    if (p.subnet_id === 99) {
      tx = await intersubjectivityToken.delegatedVote(CONTRACT, onchainId, vote);
      console.log(`🔀 Delegated vote emit received (weight=${weight}):`);
    } else {
      // SoftConsensusVoting.vote(uint256, string, uint256)
      tx = await votingOnChain.vote(onchainId, vote, weightBN);
      console.log(`🗳 Regular vote emit received (weight=${weight}):`);
    }
    await tx.wait();

    return res.json({ success: true, txHash: tx.hash, weight });
  }
  catch (err: any) {
    console.error('PUT /api/proposals/:id/vote error →', err);
    return res.status(500).json({ error: err.message });
  }
});


// List all registered routes
app.get('/debug/routes', (req, res) => {
  const routes: any[] = [];
  app._router.stack.forEach(mw => {
    if (mw.route) {
      routes.push({ path: mw.route.path, methods: Object.keys(mw.route.methods) });
    }
  });
  res.json(routes);
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

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://127.0.0.1:${PORT}`);
  console.log(`MongoDB URI: ${mongoURI.substring(0,20)}...`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔴 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});
