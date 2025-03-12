import mongoose, { Schema, Document } from 'mongoose';

export interface IProposal extends Document {
  content: {
    title: string; // New field added
    summary: string;
    abstract: string;
    full_proposal: string;
  };
  voting_stats: {
    yes: number;
    no: number;
    abstain: number;
    total_votes: number;
  };
  proposal_creator: string;
}

const ProposalSchema: Schema = new Schema(
  {
    content: {
      title: { type: String, required: true }, // New field
      summary: { type: String, required: true },
      abstract: { type: String, required: true },
      full_proposal: { type: String, required: true },
    },
    voting_stats: {
      yes: { type: Number, default: 0 },
      no: { type: Number, default: 0 },
      abstain: { type: Number, default: 0 },
      total_votes: { type: Number, default: 0 },
    },
    proposal_creator: { type: String, required: true },
  },
  { timestamps: true }
);

const Proposal = mongoose.model<IProposal>('Proposal', ProposalSchema);
export default Proposal;
