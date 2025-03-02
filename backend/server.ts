// server.ts
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
require('dotenv').config();
const Proposal = require('./models/Proposal').default; 

const app = express();
const PORT = process.env.PORT || 5001;

// middleware
app.use(cors());
app.use(express.json());


mongoose.set('strictQuery', false);
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((error: any) =>
    console.error('MongoDB connection error:', error.message)
  );



// create new
app.post('/api/proposals', async (req: any, res: any) => {
  try {
    const newProposal = new Proposal(req.body);
    const savedProposal = await newProposal.save();

    io.emit('proposalCreated', savedProposal);
    res.status(201).json(savedProposal);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// get all 
app.get('/api/proposals', async (req: any, res: any) => {
  try {
    const proposals = await Proposal.find();
    res.json(proposals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// get one by id
app.get('/api/proposals/:id', async (req: any, res: any) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    res.json(proposal);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// update votes
app.put('/api/proposals/:id/vote', async (req: any, res: any) => {
  try {
    // { vote: "yes" | "no" | "abstain" }
    const { vote } = req.body;
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (vote === 'yes') proposal.voting_stats.yes += 1;
    else if (vote === 'no') proposal.voting_stats.no += 1;
    else if (vote === 'abstain') proposal.voting_stats.abstain += 1;
    
    proposal.voting_stats.total_votes += 1;
    
    const updatedProposal = await proposal.save();
    
    io.emit('voteUpdate', updatedProposal);
    
    res.json(updatedProposal);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // change for prod
  },
});

io.on('connection', (socket: any) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
