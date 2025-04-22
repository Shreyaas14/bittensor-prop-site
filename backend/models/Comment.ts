import mongoose, { Schema, Document } from 'mongoose';

export interface IReply extends Document {
  content: string;
  authorAddress: string;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  upvotedBy: string[];
  downvotedBy: string[];
}

export interface IComment extends Document {
  content: string;
  authorAddress: string;
  proposalId: string;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  upvotedBy: string[];
  downvotedBy: string[];
  replies: IReply[];
}

const ReplySchema: Schema = new Schema({
  content: { type: String, required: true },
  authorAddress: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: String }],
  downvotedBy: [{ type: String }]
});

const CommentSchema: Schema = new Schema({
  content: { type: String, required: true },
  authorAddress: { type: String, required: true },
  proposalId: { type: String, required: true, ref: 'Proposal' },
  createdAt: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: String }],
  downvotedBy: [{ type: String }],
  replies: [ReplySchema]
});

export default mongoose.model<IComment>('Comment', CommentSchema); 