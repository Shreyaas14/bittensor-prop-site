// models/Proposal.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IProposal extends Document {
  content: {
    summary: string;
    abstract: string;
    // add additional fields if needed
  };
  voting_stats: {
    yes: number;
    no: number;
    abstain: number;
    total_votes: number;
  };
}

const ProposalSchema: Schema = new Schema({
  content: {
    summary: { type: String, required: true },
    abstract: { type: String, required: true },
    // additional fields...
  },
  voting_stats: {
    yes: { type: Number, default: 0 },
    no: { type: Number, default: 0 },
    abstain: { type: Number, default: 0 },
    total_votes: { type: Number, default: 0 },
  },
}, { timestamps: true });

const Proposal = mongoose.model<IProposal>('Proposal', ProposalSchema);
export default Proposal;
