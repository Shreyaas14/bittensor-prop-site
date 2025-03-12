const mongoose = require('mongoose');
require('dotenv').config();

// Load the Proposal model
const Proposal = require('./dist/models/Proposal').default;

async function debugProposals() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {});
    console.log('MongoDB connected successfully');

    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log();

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(collection.name);
    });

    // Count proposals
    const proposalCount = await Proposal.countDocuments();
    console.log();

    // Fetch a few proposals
    const proposals = await Proposal.find().limit(5);
    console.log('Sample proposals:');
    proposals.forEach((proposal, index) => {
      console.log();
      console.log(JSON.stringify(proposal, null, 2));
    });

  } catch (error) {
    console.error('Error in debugging:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
}

debugProposals();
