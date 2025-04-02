import React, { useState } from 'react';
import { createProposal } from '@/api/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFileAlt, FaPen, FaUserAlt, FaTimes, FaArrowRight } from 'react-icons/fa';

const ProposalCreation: React.FC = () => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [abstract, setAbstract] = useState('');
  const [fullProposal, setFullProposal] = useState('');
  const [creator, setCreator] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const proposalPayload = {
      content: { 
        title,
        summary, 
        abstract, 
        details: fullProposal
      },
      voting_stats: { yes: 0, no: 0, abstain: 0, total_votes: 0 },
      proposal_creator: creator
    };

    try {
      const newProposal = await createProposal(proposalPayload);
      setTimeout(() => {
        navigate(`/proposals/${newProposal._id}`);
      }, 500);
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      setIsSubmitting(false);
    }
  };

  // Form section component for consistent styling
  const FormSection = ({ 
    title, 
    icon, 
    children 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode 
  }) => (
    <div className="mb-10">
      <div className="flex items-center mb-5">
        <div className="bg-[#111] border border-white/10 rounded-full p-3 mr-4">
          {icon}
        </div>
        <h2 className="text-2xl text-white font-medium">{title}</h2>
      </div>
      <div className="pl-0 md:pl-14">
        {children}
      </div>
    </div>
  );

  // Styled form field component
  const FormField = ({ 
    label, 
    children, 
    hint 
  }: { 
    label: string; 
    children: React.ReactNode; 
    hint?: string 
  }) => (
    <div className="mb-6">
      <label className="block text-white mb-2 font-medium">{label}</label>
      {children}
      {hint && <p className="mt-2 text-gray-400 text-sm">{hint}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="relative bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="w-full px-6 py-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl text-white font-medium mb-2">Create Proposal</h1>
              <p className="text-gray-400">Submit a new governance proposal for the community to vote on.</p>
            </div>
            <button
              onClick={() => navigate('/proposals')}
              className="flex items-center text-white/70 hover:text-white"
            >
              <FaTimes className="mr-2" />
              <span>Cancel</span>
            </button>
          </div>

          <div className="bg-[#111] rounded-lg border border-white/5 p-8">
            <form onSubmit={handleSubmit}>
              <FormSection title="Proposal Information" icon={<FaFileAlt className="text-white" size={20} />}>
                <FormField label="Proposal Title">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 bg-black border border-white/10 text-white rounded-md focus:border-white/30 focus:outline-none"
                    placeholder="Enter a descriptive title for your proposal"
                    required
                  />
                </FormField>
              
                <FormField label="Summary">
                  <input
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full p-3 bg-black border border-white/10 text-white rounded-md focus:border-white/30 focus:outline-none"
                    placeholder="A brief one-line summary of your proposal"
                    required
                  />
                </FormField>
              </FormSection>
              
              <FormSection title="Proposal Content" icon={<FaPen className="text-white" size={20} />}>
                <FormField label="Abstract">
                  <textarea
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    className="w-full p-3 bg-black border border-white/10 text-white rounded-md focus:border-white/30 focus:outline-none h-32 resize-none"
                    placeholder="Provide a concise overview of your proposal, including its purpose and goals"
                    required
                  />
                </FormField>
              
                <FormField 
                  label="Full Proposal Details"
                  hint="Markdown formatting is supported. Be thorough and clear in your proposal."
                >
                  <textarea
                    value={fullProposal}
                    onChange={(e) => setFullProposal(e.target.value)}
                    className="w-full p-3 bg-black border border-white/10 text-white rounded-md focus:border-white/30 focus:outline-none h-60 resize-none"
                    placeholder="Detail your proposal thoroughly. Include background, implementation details, timeline, and any other relevant information."
                    required
                  />
                </FormField>
              </FormSection>
            
              <FormSection title="Proposal Submitter" icon={<FaUserAlt className="text-white" size={20} />}>
                <FormField 
                  label="Your Wallet Address"
                  hint="This will be recorded as the proposal creator and cannot be changed later."
                >
                  <input
                    type="text"
                    value={creator}
                    onChange={(e) => setCreator(e.target.value)}
                    className="w-full p-3 bg-black border border-white/10 text-white rounded-md focus:border-white/30 focus:outline-none font-mono"
                    placeholder="Enter your wallet address (0x...)"
                    required
                  />
                </FormField>
              </FormSection>
            
              <div className="flex justify-end items-center mt-10">
                <button
                  type="button"
                  onClick={() => navigate('/proposals')}
                  className="px-5 py-3 bg-black border border-white/20 text-white rounded-md flex items-center font-medium mr-4 hover:bg-white/5"
                >
                  <FaTimes className="mr-2" />
                  <span>Cancel</span>
                </button>
              
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 bg-white text-black rounded-md flex items-center font-medium ${isSubmitting ? 'opacity-70' : 'hover:bg-white/90'}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-t-2 border-b-2 border-black rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Proposal</span>
                      <FaArrowRight className="ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalCreation;