const axios = require('axios');
const mongoose = require('mongoose');

async function testAPIConnections() {
  console.log('Testing API connections...');

  try {
    // Test MongoDB Connection
    console.log('Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connection Successful');

    // Check Proposals Collection
    const Proposal = mongoose.model('Proposal', new mongoose.Schema({}, { strict: false }));
    const proposalCount = await Proposal.countDocuments();
    console.log(`Total Proposals in Database: ${proposalCount}`);

    // Fetch Some Proposals for Debugging
    const proposals = await Proposal.find().limit(5);
    console.log('Sample Proposals:');
    proposals.forEach((proposal, index) => {
      console.log(`Proposal ${index + 1}:`, JSON.stringify(proposal, null, 2));
    });

    // Test API Endpoint
    console.log('Testing GET /api/proposals endpoint...');
    const response = await axios.get('http://localhost:5001/api/proposals');
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response data: ${JSON.stringify(response.data, null, 2)}`);
    console.log(`Number of proposals: ${response.data.length}`);

  } catch (error) {
    console.error('Error in testing:', error.message);
    
    // More detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Server Response Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No Response Received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error Setting Up Request:', error.message);
    }
  } finally {
    // Ensure mongoose connection is closed
    await mongoose.connection.close();
  }
}

// Run the test
testAPIConnections();