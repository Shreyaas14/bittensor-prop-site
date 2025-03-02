export const hasVotedForProposal = (proposalId: string): boolean => {
    const votedProposals = JSON.parse(localStorage.getItem('votedProposals') || '{}');
    return !!votedProposals[proposalId];
  };
  
  export const markProposalAsVoted = (proposalId: string): void => {
    const votedProposals = JSON.parse(localStorage.getItem('votedProposals') || '{}');
    votedProposals[proposalId] = true;
    localStorage.setItem('votedProposals', JSON.stringify(votedProposals));
  };
  