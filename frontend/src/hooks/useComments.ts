import { useState, useEffect } from 'react';
import { fetchComments } from '@/api/api';
import { useSocket } from './useSocket';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export interface Reply {
  _id?: string;
  content: string;
  authorAddress: string;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  upvotedBy: string[];
  downvotedBy: string[];
}

export interface Comment {
  _id: string;
  content: string;
  authorAddress: string;
  proposalId: string;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  upvotedBy: string[];
  downvotedBy: string[];
  replies: Reply[];
}

export const useComments = (proposalId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();

  useEffect(() => {
    const getComments = async () => {
      try {
        const data = await fetchComments(proposalId);
        setComments(data);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching comments:", err);
        setComments([]);
        setError(err.message || "Error fetching comments");
        setLoading(false);
      }
    };

    getComments();

    // Socket event listeners
    if (socket) {
      // Listen for new comments
      socket.on('commentAdded', (data) => {
        if (data.proposalId === proposalId) {
          setComments(prev => [data.comment, ...prev]);
        }
      });

      // Listen for new replies
      socket.on('replyAdded', (data) => {
        if (data.proposalId === proposalId) {
          setComments(prev => prev.map(comment => {
            if (comment._id === data.commentId) {
              return {
                ...comment,
                replies: [...comment.replies, data.reply]
              };
            }
            return comment;
          }));
        }
      });

      // Listen for comment vote updates
      socket.on('commentVoteUpdated', (data) => {
        if (data.proposalId === proposalId) {
          setComments(prev => prev.map(comment => {
            if (comment._id === data.commentId) {
              return {
                ...comment,
                upvotes: data.upvotes,
                downvotes: data.downvotes
              };
            }
            return comment;
          }));
        }
      });

      // Listen for reply vote updates
      socket.on('replyVoteUpdated', (data) => {
        if (data.proposalId === proposalId) {
          setComments(prev => prev.map(comment => {
            if (comment._id === data.commentId) {
              const updatedReplies = [...comment.replies];
              if (updatedReplies[data.replyIndex]) {
                updatedReplies[data.replyIndex] = {
                  ...updatedReplies[data.replyIndex],
                  upvotes: data.upvotes,
                  downvotes: data.downvotes
                };
              }
              return {
                ...comment,
                replies: updatedReplies
              };
            }
            return comment;
          }));
        }
      });

      return () => {
        socket.off('commentAdded');
        socket.off('replyAdded');
        socket.off('commentVoteUpdated');
        socket.off('replyVoteUpdated');
      };
    }
  }, [proposalId, socket]);

  return { comments, loading, error };
}; 