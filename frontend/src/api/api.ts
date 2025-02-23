const API_URL = 'http://localhost:5001/api';

export const fetchProposals = async () => {
    const res = await fetch(`${API_URL}/proposals`);
    return await res.json();
}

export const createProposal = async (data: any) => {
    const res = await fetch(`${API_URL}/proposals`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return await res.json();
};

export const castVote = async (proposalId: string, vote: string) => {
    const res = await fetch(`${API_URL}/proposals/${proposalId}/vote`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote }),
    });
    return await res.json();
}; 