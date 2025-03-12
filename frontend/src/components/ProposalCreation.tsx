import React, { useState } from 'react';
import { createProposal } from '@/api/api';
import { useNavigate } from 'react-router-dom';

const ProposalCreation: React.FC = () => {
  const [title, setTitle] = useState(''); // New title state
  const [summary, setSummary] = useState('');
  const [abstract, setAbstract] = useState('');
  const [fullProposal, setFullProposal] = useState('');
  const [creator, setCreator] = useState(''); // Wallet address
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build payload with new "title" field
    const proposalPayload = {
      content: { 
        title,
        summary, 
        abstract, 
        full_proposal: fullProposal  // using snake_case to match backend field
      },
      voting_stats: { yes: 0, no: 0, abstain: 0, total_votes: 0 },
      proposal_creator: creator
    };

    console.log('Submitting proposal:', proposalPayload);

    try {
      const newProposal = await createProposal(proposalPayload);
      setMessage('Proposal created successfully!');
      navigate(`/proposals/${newProposal._id}`);
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      setMessage('Error creating proposal: ' + error.message);
    }
    // Clear fields
    setTitle('');
    setSummary('');
    setAbstract('');
    setFullProposal('');
    setCreator('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label className="block font-medium mb-1">Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded bg-white text-black"
          required
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Summary:</label>
        <input
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full p-2 border rounded bg-white text-black"
          required
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Abstract:</label>
        <textarea
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          className="w-full p-2 border rounded bg-white text-black"
          rows={4}
          required
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Full Proposal:</label>
        <textarea
          value={fullProposal}
          onChange={(e) => setFullProposal(e.target.value)}
          className="w-full p-2 border rounded bg-white text-black"
          rows={4}
          required
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Your Wallet Address:</label>
        <input
          type="text"
          value={creator}
          onChange={(e) => setCreator(e.target.value)}
          className="w-full p-2 border rounded bg-white text-black"
          required
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-black text-white rounded"
      >
        Submit Proposal
      </button>
      {message && <p className="mt-2">{message}</p>}
    </form>
  );
};

export default ProposalCreation;
