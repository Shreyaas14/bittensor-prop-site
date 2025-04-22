const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  content: { type: String, required: true },
  authorAddress: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: String }],
  downvotedBy: [{ type: String }]
});

const commentSchema = new mongoose.Schema({
  proposalId: { type: String, required: true, index: true },
  content: { type: String, required: true },
  authorAddress: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: String }],
  downvotedBy: [{ type: String }],
  replies: [replySchema]
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment; 