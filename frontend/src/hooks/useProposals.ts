import { useState, useEffect } from 'react';
import { fetchProposals } from '@/api/api';

export interface Proposal {
    _id: string;
    content: {
        summary: string;
        abstract: string;
    };
    voting_stats: {
        yes: number;
        no: number;
        abstain: number;
        total_votes: number;
    };
}

export const useProposals = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProposals()
        .then((data: Proposal[]) => {
            setProposals(data);
            setLoading(false);
        })
        .catch((err: any) => {
            setError(err.message || "error fetching proposals");
            setLoading(false);
        })
    }, []);

    return { proposals, loading, error };
}
