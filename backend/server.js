// server.js
// This file serves as a proxy between the frontend and the Flask Bittensor API

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { JsonRpcProvider, Contract, Wallet } = require('ethers');

const Comment = require('./models/Comment');
const Proposal = require('./models/Proposal');
const VotingArtifact = require('./src/abi/SoftConsensusVoting.json');
const addresses = require('./src/contract_addresses.json');

const app = express();
const PORT = process.env.PORT || 5001;
const FLASK_SERVER = process.env.FLASK_SERVER || 'http://127.0.0.1:5001';
const RPC_URL = process.env.RPC_URL_LOCAL;
const PK      = process.env.PRIVATE_KEY;
const CONTRACT= process.env.CONTRACT_ADDRESS_LOCAL;

// Dynamic import helper for node-fetch (ESM-only)
let _fetch = null;
async function fetchDynamic(input, init) {
  if (!_fetch) {
    const mod = await import('node-fetch');
    _fetch = mod.default;
  }
  return _fetch(input, init);
}

// Ethereum on-chain setup
const provider = new JsonRpcProvider(RPC_URL);
const signer   = new Wallet(PK, provider);
const votingOnChain = new Contract(CONTRACT, VotingArtifact.abi, signer);

// Initialize WebSocket Server with proper CORS
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET','POST'],
    transports: ['websocket','polling'],
  },
});

// Listen for on-chain events
votingOnChain.on('ProposalCreated', (pid, creator, event) => {
  console.log('📝 ProposalCreated →', {
    proposalId: pid.toString(),
    creator,
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
    voter,
    voteType,
    weight: weight.toString(),
    txHash: event.transactionHash
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
  res.header(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,DELETE,OPTIONS'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
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
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bittensor-governance';
mongoose.set('strictQuery', false);
mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// ─── ROUTES ───────────────────────────────────────────────────────────────────

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
  } catch (error) {
    res.status(503).json({ flaskStatus: 'unavailable', error: error.message });
  }
});

// Wallet proxy
app.get('/wallet/list', async (req, res) => {
  try {
    const r = await fetchDynamic(`${FLASK_SERVER}/wallet/list`);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post('/wallet/connect', async (req, res) => {
  try {
    const r = await fetchDynamic(`${FLASK_SERVER}/wallet/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create Proposal
app.post('/api/proposals', async (req, res) => {
  try {
    const newP = new Proposal(req.body);
    const saved = await newP.save();
    io.emit('proposalCreated', saved);

    const { content, voting_start, voting_end, level, subnet_id } = req.body;
    const tx = await votingOnChain.createProposal(
      content.title || '',
      content.summary || '',
      content.abstract || '',
      content.full_proposal || '',
      level || '',
      subnet_id || 0,
      Math.floor(new Date(voting_start).getTime()/1000),
      Math.floor(new Date(voting_end).getTime()/1000)
    );
    await tx.wait();

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List & read Proposals
app.get('/api/proposals', async (req, res) => {
  try {
    res.json(await Proposal.find());
  } catch (e) {
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Vote on Proposal
app.put('/api/proposals/:id/vote', async (req, res) => {
  try {
    const { vote, weight = 1 } = req.body;
    if (!vote) return res.status(400).json({ error: 'vote required' });

    const p = await Proposal.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    p.voting_stats = p.voting_stats || { yes:0, no:0, abstain:0, total_votes:0 };
    if (vote === 'yes')      p.voting_stats.yes += weight;
    else if (vote==='no')    p.voting_stats.no  += weight;
    else                     p.voting_stats.abstain += weight;
    p.voting_stats.total_votes += weight;

    const updated = await p.save();
    io.emit('voteUpdate', updated);

    const pid = parseInt(req.params.id, 10);
    const tx = await votingOnChain.vote(pid, vote, weight);
    await tx.wait();

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List all registered routes
app.get('/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(mw => {
    if (mw.route) {
      routes.push({
        path: mw.route.path,
        methods: Object.keys(mw.route.methods)
      });
    }
  });
  res.json(routes);
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://127.0.0.1:${PORT}`);
  console.log(`MongoDB URI: ${mongoURI.substring(0, 20)}...`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔴 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});
