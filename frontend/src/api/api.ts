import axios from 'axios';

// Create base axios instance with proper configuration
// Use a specific backend URL instead of relying on relative paths
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug log to verify the API URL
console.log('API is configured with base URL:', API_BASE_URL);

// Log requests for debugging
api.interceptors.request.use(request => {
  console.log('API Request:', request.method, request.url);
  return request;
});

// Get all proposals
export const fetchProposals = async () => {
  try {
    // Use explicit path with /api prefix if needed
    const response = await api.get('/api/proposals');
    
    // Debug the response structure
    console.log('API Response from /proposals:', response.data);
    
    // Handle different response data structures
    let proposalsData = [];
    
    if (Array.isArray(response.data)) {
      proposalsData = response.data;
    } else if (response.data && typeof response.data === 'object') {
      if (Array.isArray(response.data.proposals)) {
        proposalsData = response.data.proposals;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        proposalsData = response.data.data;
      } else {
        proposalsData = [response.data];
      }
    }
    
    return proposalsData.map(proposal => ({
      _id: proposal._id || proposal.id || 'unknown-id',
      content: {
        title: proposal.content?.title || 'Untitled Proposal',
        summary: proposal.content?.summary || proposal.content?.title || 'No Summary',
        abstract: proposal.content?.abstract || '',
        fullProposal: proposal.content?.full_proposal || proposal.content?.details || '',
      },
      voting_stats: {
        yes: proposal.voting_stats?.yes || 0,
        no: proposal.voting_stats?.no || 0,
        abstain: proposal.voting_stats?.abstain || 0,
        total_votes: proposal.voting_stats?.total_votes || 0,
      },
      walletAddress: proposal.proposal_creator || proposal.wallet_address || proposal.walletAddress || '',
      created_at: proposal.createdAt || proposal.created_at || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching proposals:', error);
    throw error;
  }
};

export const getProposals = fetchProposals;

// Get single proposal
export const getProposal = async (id) => {
  if (!id) {
    throw new Error('Proposal ID is required');
  }
  
  try {
    const cleanId = id.replace(/^\/+|\/+$/g, '');
    console.log(`Fetching proposal with ID: ${cleanId}`);
    
    const response = await api.get(`/api/proposals/${cleanId}`);
    console.log("Original API response:", response.data);
    
    const backendData = response.data.proposal || response.data;
    
    return {
      _id: backendData._id || backendData.id || cleanId,
      content: {
        title: backendData.content?.title || 'Untitled Proposal',
        summary: backendData.content?.summary || backendData.content?.title || 'No Summary',
        abstract: backendData.content?.abstract || '',
        details: backendData.content?.full_proposal || backendData.content?.details || '',
      },
      voting_stats: {
        yes: backendData.voting_stats?.yes || 0,
        no: backendData.voting_stats?.no || 0,
        abstain: backendData.voting_stats?.abstain || 0,
        total_votes: backendData.voting_stats?.total_votes || 0,
      },
      walletAddress: backendData.proposal_creator || backendData.walletAddress || '',
      created_at: backendData.createdAt || backendData.created_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching proposal ${id}:`, error);
    throw error;
  }
};

// Create a new proposal - Fix for 500 error based on validation message
export const createProposal = async (proposalData) => {
  try {
    console.log('Creating proposal with data:', proposalData);
    
    // Restructure the payload to match what the server expects
    // Based on the validation error, we need to maintain the nested structure
    const serverPayload = {
      proposal_creator: proposalData.proposal_creator,
      content: {
        title: proposalData.content.title,
        summary: proposalData.content.summary,
        abstract: proposalData.content.abstract,
        full_proposal: proposalData.content.details // Note: server expects full_proposal, not details
      },
      voting_stats: proposalData.voting_stats || { yes: 0, no: 0, abstain: 0, total_votes: 0 }
    };
    
    console.log('Restructured payload for server:', serverPayload);
    
    const response = await api.post('/api/proposals', serverPayload);
    console.log('Proposal creation response:', response.data);
    
    // After successful creation, refresh the proposals list
    // This ensures the sidebar and other components will show the new proposal
    await fetchProposals();
    
    return response.data;
  } catch (error) {
    console.error('Error creating proposal:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      if (typeof error.response.data === 'object') {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }
    throw error;
  }
};

// Cast a vote on a proposal
export const castVote = async (proposalId, voteType, wallet, voteWeight) => {
  try {
    // Changed from POST to PUT to match the backend route
    const response = await api.put(`/api/proposals/${proposalId}/vote`, {
      vote: voteType,
      wallet,
      weight: voteWeight
    });
    return response.data;
  } catch (error) {
    console.error('Error casting vote:', error);
    throw error;
  }
};

// Comment API functions

// Get all comments for a proposal
export const fetchComments = async (proposalId: string): Promise<Comment[]> => {
  try {
    console.log(`Fetching comments for proposal: ${proposalId}`);
    const response = await api.get(`/api/proposals/${proposalId}/comments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    
    // Log more details about the error
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    // Return empty array instead of throwing
    console.warn('Returning empty comments array due to error');
    return [];
  }
};

// Add a comment to a proposal
export const addComment = async (proposalId: string, content: string, authorAddress: string) => {
  try {
    console.log(`Adding comment to proposal ${proposalId} by ${authorAddress}`);
    console.log(`Comment content: ${content}`);
    
    const response = await api.post(`/api/proposals/${proposalId}/comments`, {
      content,
      authorAddress
    });
    
    console.log('Comment added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Add a reply to a comment
export const addReply = async (commentId: string, content: string, authorAddress: string) => {
  try {
    const response = await api.post(`/api/comments/${commentId}/replies`, {
      content,
      authorAddress
    });
    return response.data;
  } catch (error) {
    console.error('Error adding reply:', error);
    throw error;
  }
};

// Upvote a comment
export const upvoteComment = async (commentId: string, walletAddress: string) => {
  try {
    const response = await api.post(`/api/comments/${commentId}/upvote`, {
      walletAddress
    });
    return response.data;
  } catch (error) {
    console.error('Error upvoting comment:', error);
    throw error;
  }
};

// Downvote a comment
export const downvoteComment = async (commentId: string, walletAddress: string) => {
  try {
    const response = await api.post(`/api/comments/${commentId}/downvote`, {
      walletAddress
    });
    return response.data;
  } catch (error) {
    console.error('Error downvoting comment:', error);
    throw error;
  }
};

// Upvote a reply
export const upvoteReply = async (commentId: string, replyIndex: number, walletAddress: string) => {
  try {
    const response = await api.post(`/api/comments/${commentId}/replies/${replyIndex}/upvote`, {
      walletAddress
    });
    return response.data;
  } catch (error) {
    console.error('Error upvoting reply:', error);
    throw error;
  }
};

// Downvote a reply
export const downvoteReply = async (commentId: string, replyIndex: number, walletAddress: string) => {
  try {
    const response = await api.post(`/api/comments/${commentId}/replies/${replyIndex}/downvote`, {
      walletAddress
    });
    return response.data;
  } catch (error) {
    console.error('Error downvoting reply:', error);
    throw error;
  }
};