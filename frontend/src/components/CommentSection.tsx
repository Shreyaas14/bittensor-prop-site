import React, { useState, useEffect } from 'react';
import { useComments, Comment as CommentType } from '@/hooks/useComments';
import { motion, AnimatePresence } from 'framer-motion';
import { FaThumbsUp, FaThumbsDown, FaReply, FaTimes, FaRegComment, FaUser, FaComment } from 'react-icons/fa';
import { addComment, addReply, upvoteComment, downvoteComment, upvoteReply, downvoteReply } from '@/api/api';
import { useAppContext } from '@/contexts/AppContext';

interface CommentSectionProps {
  proposalId: string;
  walletAddress: string | null;
}

const CommentSection: React.FC<CommentSectionProps> = ({ proposalId, walletAddress: propWalletAddress }) => {
  // Use the app context to get the wallet address
  const { walletAddress: contextWalletAddress } = useAppContext();
  
  // Use either the prop or context wallet address, preferring the context one
  const walletAddress = contextWalletAddress || propWalletAddress;
  
  const { comments, loading, error, refreshComments } = useComments(proposalId);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  // Debug logging to help identify the issue
  useEffect(() => {
    console.log("CommentSection - Context Wallet Address:", contextWalletAddress);
    console.log("CommentSection - Prop Wallet Address:", propWalletAddress);
    console.log("CommentSection - Final Wallet Address:", walletAddress);
  }, [contextWalletAddress, propWalletAddress, walletAddress]);

  // Helper function to truncate wallet address for display
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Helper function to format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Helper function to check if a comment is from the current user
  const isOwnComment = (authorAddress: string) => {
    return walletAddress && authorAddress.toLowerCase() === walletAddress.toLowerCase();
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return;
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      console.log(`Submitting comment to proposal ${proposalId} by ${walletAddress}`);
      console.log(`Comment content: ${newComment}`);
      
      await addComment(proposalId, newComment, walletAddress);
      setNewComment('');
      // Refresh comments after adding a new one
      await refreshComments();
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!walletAddress || !replyContent.trim()) return;

    setSubmitting(true);
    try {
      await addReply(commentId, replyContent, walletAddress);
      setReplyContent('');
      setReplyingTo(null);
      // Refresh comments after adding a reply
      await refreshComments();
    } catch (err) {
      console.error('Error adding reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvoteComment = async (commentId: string) => {
    if (!walletAddress) return;
    try {
      await upvoteComment(commentId, walletAddress);
      // Refresh comments after upvoting
      await refreshComments();
    } catch (err) {
      console.error('Error upvoting comment:', err);
    }
  };

  const handleDownvoteComment = async (commentId: string) => {
    if (!walletAddress) return;
    try {
      await downvoteComment(commentId, walletAddress);
      // Refresh comments after downvoting
      await refreshComments();
    } catch (err) {
      console.error('Error downvoting comment:', err);
    }
  };

  const handleUpvoteReply = async (commentId: string, replyIndex: number) => {
    if (!walletAddress) return;
    try {
      await upvoteReply(commentId, replyIndex, walletAddress);
      // Refresh comments after upvoting a reply
      await refreshComments();
    } catch (err) {
      console.error('Error upvoting reply:', err);
    }
  };

  const handleDownvoteReply = async (commentId: string, replyIndex: number) => {
    if (!walletAddress) return;
    try {
      await downvoteReply(commentId, replyIndex, walletAddress);
      // Refresh comments after downvoting a reply
      await refreshComments();
    } catch (err) {
      console.error('Error downvoting reply:', err);
    }
  };

  return (
    <div className="bg-[#0c0c0c] text-white rounded-xl mt-8 p-6 border border-[#1a1a1a]">
      <h2 className="text-xl font-medium mb-8 flex items-center gap-2">
        <div className="text-teal">
          <FaRegComment size={18} />
        </div>
        <span>Discussion</span>
      </h2>
      
      {/* Comment form */}
      {walletAddress ? (
        <div className="mb-8">
          <div className="bg-[#111] rounded-xl p-5 border border-[#222] shadow-lg transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal/30 to-teal/10 flex items-center justify-center font-mono text-white text-xs mr-3 border border-teal/20">
                <span>{walletAddress.substring(2, 4)}</span>
              </div>
              <span className="font-mono text-sm text-gray-400">{truncateAddress(walletAddress)}</span>
            </div>
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <textarea
                className="w-full bg-[#0a0a0a] text-white rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-1 focus:ring-teal border border-[#333] transition-all placeholder-gray-500 text-sm"
                placeholder="Share your thoughts on this proposal..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex justify-end">
                <button 
                  type="submit"
                  className="bg-teal hover:bg-teal/90 text-black font-medium py-2.5 px-5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  disabled={submitting || !newComment.trim()}
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="mb-8 bg-[#111] rounded-xl p-6 border border-[#222] text-center">
          <p className="text-gray-400 mb-2">Connect your wallet to join the discussion</p>
        </div>
      )}
      
      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-teal border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="bg-[#111] rounded-xl p-4 text-center text-gray-400">
          <p>Error loading comments: {error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="bg-[#111] rounded-xl p-6 text-center border border-[#222]">
              <p className="text-gray-400">No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="bg-[#111] rounded-xl p-5 border border-[#1a1a1a] shadow-md transition-all hover:border-[#333]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal/30 to-teal/10 flex items-center justify-center font-mono text-white text-xs border border-teal/20">
                      {comment.authorAddress.substring(2, 4)}
                    </div>
                    <div className="ml-3">
                      <div className="font-mono text-white text-sm flex items-center">
                        {truncateAddress(comment.authorAddress)}
                        {isOwnComment(comment.authorAddress) && (
                          <span className="ml-2 text-xs bg-teal/20 text-teal px-2 py-0.5 rounded-full flex items-center">
                            <FaUser size={10} className="mr-1" />
                            Your comment
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">{formatDate(new Date(comment.createdAt))}</div>
                    </div>
                  </div>
                  
                  {/* Comment voting buttons */}
                  <div className="flex items-center space-x-4">
                    {isOwnComment(comment.authorAddress) ? (
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-gray-500">
                          <FaThumbsUp size={14} />
                          <span>{comment.upvotes}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500">
                          <FaThumbsDown size={14} />
                          <span>{comment.downvotes}</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleUpvoteComment(comment._id)}
                          className={`flex items-center space-x-1 transition-colors ${
                            comment.upvotedBy?.includes(walletAddress || '') 
                              ? 'text-teal' 
                              : 'text-gray-500 hover:text-teal'
                          }`}
                          disabled={!walletAddress}
                        >
                          <FaThumbsUp size={14} />
                          <span>{comment.upvotes}</span>
                        </button>
                        
                        <button 
                          onClick={() => handleDownvoteComment(comment._id)}
                          className={`flex items-center space-x-1 transition-colors ${
                            comment.downvotedBy?.includes(walletAddress || '') 
                              ? 'text-gradient-orange' 
                              : 'text-gray-500 hover:text-gradient-orange'
                          }`}
                          disabled={!walletAddress}
                        >
                          <FaThumbsDown size={14} />
                          <span>{comment.downvotes}</span>
                        </button>
                      </>
                    )}
                  
                    {walletAddress && (
                      <button 
                        onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-white transition-colors"
                      >
                        {replyingTo === comment._id ? <FaTimes size={14} /> : <FaReply size={14} />}
                        <span>{replyingTo === comment._id ? 'Cancel' : 'Reply'}</span>
                      </button>
                    )}
                  </div>
                </div>
              
                {/* Comment content */}
                <div className="text-white whitespace-pre-wrap py-2 leading-relaxed text-sm">{comment.content}</div>
              
                {/* Reply form */}
                <AnimatePresence>
                  {replyingTo === comment._id && walletAddress && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 overflow-hidden"
                    >
                      <div className="bg-[#0a0a0a] rounded-xl p-4 border border-[#333]">
                        <div className="text-gray-400 text-sm mb-3 flex items-center">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal/30 to-teal/10 flex items-center justify-center font-mono text-white text-xs mr-2 border border-teal/20">
                            {walletAddress.substring(2, 4)}
                          </div>
                          <span className="font-mono">{truncateAddress(walletAddress)}</span>
                        </div>
                        <textarea
                          className="w-full bg-[#111] text-white rounded-xl p-3 min-h-[80px] focus:outline-none focus:ring-1 focus:ring-teal border border-[#333] transition-all placeholder-gray-600 text-sm"
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                        />
                        <div className="flex justify-end mt-3">
                          <button 
                            onClick={() => handleSubmitReply(comment._id)}
                            className="bg-teal hover:bg-teal/90 text-black font-medium py-2 px-4 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={submitting || !replyContent.trim()}
                          >
                            {submitting ? 'Posting...' : 'Post Reply'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              
                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-5">
                    <div className="ml-6 border-l-2 border-[#333] pl-4 mb-3">
                      <div className="text-gray-500 text-xs flex items-center gap-1.5">
                        <FaComment size={10} />
                        {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                      </div>
                    </div>
                  
                    <div className="space-y-3 mt-3">
                      {comment.replies.map((reply, index) => (
                        <div key={index} className="bg-[#0a0a0a] rounded-xl p-4 ml-6 border border-[#1a1a1a] transition-all hover:border-[#333]">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal/30 to-teal/10 flex items-center justify-center font-mono text-white text-xs border border-teal/20">
                                {reply.authorAddress.substring(2, 4)}
                              </div>
                              <div className="ml-2">
                                <div className="font-mono text-white text-xs flex items-center">
                                  {truncateAddress(reply.authorAddress)}
                                  {isOwnComment(reply.authorAddress) && (
                                    <span className="ml-2 text-xs bg-teal/20 text-teal px-2 py-0.5 rounded-full flex items-center">
                                      <FaUser size={8} className="mr-1" />
                                      Your reply
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-500 text-xs mt-0.5">{formatDate(new Date(reply.createdAt))}</div>
                              </div>
                            </div>
                          
                            {/* Reply voting buttons */}
                            <div className="flex items-center space-x-3">
                              {isOwnComment(reply.authorAddress) ? (
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-1 text-gray-500">
                                    <FaThumbsUp size={12} />
                                    <span className="text-xs">{reply.upvotes}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-gray-500">
                                    <FaThumbsDown size={12} />
                                    <span className="text-xs">{reply.downvotes}</span>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => handleUpvoteReply(comment._id, index)}
                                    className={`flex items-center space-x-1 transition-colors ${
                                      reply.upvotedBy?.includes(walletAddress || '') 
                                        ? 'text-teal' 
                                        : 'text-gray-500 hover:text-teal'
                                    }`}
                                    disabled={!walletAddress}
                                  >
                                    <FaThumbsUp size={12} />
                                    <span className="text-xs">{reply.upvotes}</span>
                                  </button>
                                
                                  <button 
                                    onClick={() => handleDownvoteReply(comment._id, index)}
                                    className={`flex items-center space-x-1 transition-colors ${
                                      reply.downvotedBy?.includes(walletAddress || '') 
                                        ? 'text-gradient-orange' 
                                        : 'text-gray-500 hover:text-gradient-orange'
                                    }`}
                                    disabled={!walletAddress}
                                  >
                                    <FaThumbsDown size={12} />
                                    <span className="text-xs">{reply.downvotes}</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        
                          <div className="text-white text-sm whitespace-pre-wrap leading-relaxed">{reply.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection; 