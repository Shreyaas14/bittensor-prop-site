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
    const response = await api.get('/api/proposals');
    console.log('API Response from /proposals:', response.data);

    // normalize raw data into array
    let proposalsData: any[] = [];
    if (Array.isArray(response.data)) {
      proposalsData = response.data;
    } else if (response.data && typeof response.data === 'object') {
      if (Array.isArray(response.data.proposals)) {
        proposalsData = response.data.proposals;
      } else if (Array.isArray(response.data.data)) {
        proposalsData = response.data.data;
      } else {
        proposalsData = [response.data];
      }
    }

    // load any local metadata
    let proposalMetadata: Record<string, any> = {};
    try {
      proposalMetadata = JSON.parse(
        localStorage.getItem('proposalMetadata') || '{}'
      );
    } catch { /* ignore */ }

    const processed = proposalsData.map((p: any) => {
      const id = p._id || p.id;

      // created_at
      const created_at =
        p.createdAt ||
        p.created_at ||
        new Date().toISOString();

      return {
        _id: id,
        onchainProposalId: p.onchainProposalId,          // ← NEW
        content: {
          title:   p.content?.title   || p.title   || 'Untitled Proposal',
          summary: p.content?.summary || p.summary || '',
          abstract:p.content?.abstract|| p.abstract|| '',
          details: p.content?.full_proposal ||
                   p.content?.details      ||
                   p.details               ||
                   ''
        },
        voting_stats: {
          yes:        p.voting_stats?.yes        || 0,
          no:         p.voting_stats?.no         || 0,
          abstain:    p.voting_stats?.abstain    || 0,
          total_votes:p.voting_stats?.total_votes|| 0
        },
        walletAddress: p.proposal_creator || '',
        created_at,                                        // ← added

        // either backend-provided voting_end, or 48h after created_at:
        voting_start: p.voting_start || created_at,        // fallback
        voting_end:   p.voting_end   ||
                      new Date(
                        new Date(created_at).getTime() + 48 * 60 * 60 * 1000
                      ).toISOString(),                    // ← added

        level:     proposalMetadata[id]?.level     || p.level     || 'network',
        subnet_id: proposalMetadata[id]?.subnet_id || p.subnet_id || null
      };
    });

    // sort newest first
    processed.sort((a, b) => {
      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });

    console.log('Sorted proposals:', processed);
    return processed;
  } catch (error) {
    console.error('Error fetching proposals:', error);
    throw error;
  }
};


export const getProposals = fetchProposals;

// Get single proposal
export const getProposal = async (id: string) => {
  if (!id) {
    throw new Error('Proposal ID is required');
  }
  
  try {
    const cleanId = id.replace(/^\/+|\/+$/g, '');
    console.log(`Fetching proposal with ID: ${cleanId}`);
    
    const response = await api.get(`/api/proposals/${cleanId}`);
    const backendData = response.data.proposal || response.data;
    
    console.log("Raw backend data:", JSON.stringify(backendData, null, 2));
    
    // Check localStorage for cached metadata about this proposal
    let level = 'network';
    let subnet_id = undefined;
    
    try {
      const proposalMetadata = JSON.parse(localStorage.getItem('proposalMetadata') || '{}');
      if (proposalMetadata[cleanId]) {
        console.log(`Found cached metadata for proposal ${cleanId}:`, proposalMetadata[cleanId]);
        level = proposalMetadata[cleanId].level || level;
        subnet_id = proposalMetadata[cleanId].subnet_id || subnet_id;
      }
    } catch (e) {
      console.error('Error reading proposal metadata from localStorage:', e);
    }
    
    // If backend has the data, use it (but it probably won't)
    if (backendData.level) {
      level = backendData.level;
    }
    if (backendData.subnet_id !== undefined) {
      subnet_id = backendData.subnet_id;
    }
    
    console.log(`Final determined level: ${level}, subnet_id: ${subnet_id}`);
    
    const result = {
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
      voting_start: backendData.voting_start,
      voting_end: backendData.voting_end,
      // Set the level and subnet_id from our cached data
      level: level,
      subnet_id: subnet_id
    };
    
    console.log("Final processed proposal data:", JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error(`Error fetching proposal ${id}:`, error);
    throw error;
  }
};

// Create a new proposal - Fix for 500 error based on validation message
export const createProposal = async (proposalData) => {
  try {
    console.log('Creating proposal with data:', proposalData);
    
    // Ensure subnet_id is properly formatted for the API
    let subnet_id = undefined;
    if (proposalData.level === 'subnet' && proposalData.subnet_id !== undefined) {
      subnet_id = Number(proposalData.subnet_id);
      console.log(`Setting subnet_id to ${subnet_id} (type: ${typeof subnet_id})`);
    }
    
    // Restructure payload for server - ensure subnet data is properly formatted
    const payload = {
      content: {
        title: proposalData.content.title,
        summary: proposalData.content.summary || "Proposal Summary",
        abstract: proposalData.content.abstract,
        full_proposal: proposalData.content.full_proposal
      },
      proposal_creator: proposalData.proposal_creator,
      level: proposalData.level,        // 'network' or 'subnet'
      subnet_id: subnet_id,              // numeric for subnet proposals
      voting_start: proposalData.voting_start,  // e.g. "2025-05-01T00:00:00Z"
      voting_end: proposalData.voting_end,      // e.g. "2025-05-02T00:00:00Z"
      voting_stats: proposalData.voting_stats || {
        yes: 0,
        no: 0,
        abstain: 0,
        total_votes: 0
      }
    };
    
    
    console.log('Final API payload:', JSON.stringify(payload, null, 2));
    
    const response = await api.post('/api/proposals', payload);
    console.log('Proposal creation response:', response.data);
    
    // WORKAROUND: Save the proposal level and subnet_id in localStorage
    // since the backend isn't storing this information properly
    const proposalId = response.data._id || response.data.id;
    if (proposalId) {
      // Create a proposal metadata cache in localStorage if it doesn't exist
      const proposalMetadata = JSON.parse(localStorage.getItem('proposalMetadata') || '{}');
      
      // Store this proposal's metadata
      proposalMetadata[proposalId] = {
        level: proposalData.level,
        subnet_id: subnet_id
      };
      
      // Save back to localStorage
      localStorage.setItem('proposalMetadata', JSON.stringify(proposalMetadata));
      console.log(`Saved proposal metadata to localStorage: ID ${proposalId}, level: ${proposalData.level}, subnet_id: ${subnet_id}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error creating proposal:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    throw error;
  }
};

// Cast a vote on a proposal
export const castVote = async (proposalId: string, onchainId: number, vote: 'yes' | 'no' | 'abstain', walletAddress: string, weight: number = 1) => {
  try {
    console.log(`Sending vote request for proposal ${proposalId}:`, {
      vote,
      weight,
      walletAddress
    });
    
    const response = await api.put(`/api/proposals/${proposalId}/vote`, {
      vote,
      weight,
      walletAddress,
      onchainId
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

// TEMPORARY TEST FUNCTION to debug proposal data flow
export const testSubnetProposalCreation = async () => {
  try {
    // Step 1: Create a test subnet proposal
    const testProposal = {
      content: {
        title: "TEST SUBNET PROPOSAL",
        abstract: "This is a test subnet proposal for debugging",
        full_proposal: "Testing the subnet proposal functionality"
      },
      proposal_creator: "TEST_WALLET_ADDRESS",
      level: "subnet",
      subnet_id: 999, // Use a distinctive number for testing
      voting_stats: { yes: 0, no: 0, abstain: 0, total_votes: 0 }
    };
    
    console.log("Creating test subnet proposal:", testProposal);
    
    // Create the proposal
    const createResponse = await createProposal(testProposal);
    console.log("Create response:", createResponse);
    
    // Get the ID of the new proposal
    const proposalId = createResponse._id || createResponse.id;
    if (!proposalId) {
      console.error("No proposal ID in response!");
      return;
    }
    
    // Fetch the proposal we just created
    console.log(`Fetching newly created proposal: ${proposalId}`);
    const fetchedProposal = await getProposal(proposalId);
    
    // Check if level and subnet_id are preserved
    console.log("RESULT: Fetched proposal level:", fetchedProposal.level);
    console.log("RESULT: Fetched proposal subnet_id:", fetchedProposal.subnet_id);
    
    return {
      created: createResponse,
      fetched: fetchedProposal,
      preserved: {
        levelPreserved: fetchedProposal.level === "subnet",
        subnetIdPreserved: fetchedProposal.subnet_id === 999
      }
    };
  } catch (error) {
    console.error("Test failed:", error);
    return { error: error.message };
  }
};