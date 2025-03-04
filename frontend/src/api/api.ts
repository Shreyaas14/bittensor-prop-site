const API_URL = 'http://localhost:5001/api';

export const fetchProposals = async () => {
    console.log('🔍 API - Fetching proposals from:', `${API_URL}/proposals`);
    try {
        const res = await fetch(`${API_URL}/proposals`);
        console.log('📡 API - Response status:', res.status);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log('📦 API - Raw response data:', data);
        return data;
    } catch (error) {
        console.error('❌ API - Error in fetchProposals:', error);
        throw error;
    }
}

export const createProposal = async (data: any) => {
    console.log('🔍 API - Creating proposal with data:', data);
    const res = await fetch(`${API_URL}/proposals`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return await res.json();
};

export const castVote = async (proposalId: string, voteType: string, walletAddress: string, voteWeight: number) => {
    console.log(`🔍 API - Casting vote: ${voteType} for proposal: ${proposalId} with wallet: ${walletAddress} and weight: ${voteWeight}`);
    const res = await fetch(`${API_URL}/vote`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            proposalId,
            voteType,
            walletAddress,
            voteWeight,
        }),
    });
    if (!res.ok) {
        throw new Error("Failed to cast vote");
    }
    return await res.json();
};