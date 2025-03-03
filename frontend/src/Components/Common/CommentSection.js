import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { FaHeart, FaRegHeart, FaTrash } from 'react-icons/fa';
import styles from './CommentSection.module.css';
import { useAuth0 } from '@auth0/auth0-react';

export const CommentSection = ({ selectedPostId, userId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState({});
  const [likeCount, setLikeCount] = useState({});

  const { user, isAuthenticated, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
  const username = user?.name || 'Anonymous';

  useEffect(() => {
    if (!selectedPostId) return;
    fetchComments();
  }, [selectedPostId]);

  // Fetch comments for the selected post
  const fetchComments = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments/${selectedPostId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();

      const initialLikesState = data.reduce((acc, comment) => {
        acc[comment.comment_id] = comment.isliked;
        return acc;
      }, {});
      const initialLikeCounts = data.reduce((acc, comment) => {
        acc[comment.comment_id] = comment.like_count;
        return acc;
      }, {});

      setComments(data);
      setIsLiked(initialLikesState);
      setLikeCount(initialLikeCounts);
    } catch (error) {
      console.error(error);
    }
  };

  // Add a new comment
  const addComment = async () => {
    if (!newComment.trim()) return;
    const tempId = Date.now(); // Temporary ID for optimistic UI update
    const newCommentData = {
      id: tempId,
      user_id: userId,
      name: username,
      text: newComment,
      like_count: 0,
      isliked: false,
    };

    // Optimistic UI update
    setComments((prev) => [...prev, newCommentData]);
    setLikeCount((prev) => ({ ...prev, [tempId]: 0 }));
    setIsLiked((prev) => ({ ...prev, [tempId]: false }));
    setNewComment('');

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId: selectedPostId, userId: userId, text: newComment }),
      });
      if (!response.ok) throw new Error('Failed to post comment');

      const postedCommentData = await response.json();

      setComments((prev) =>
        prev.map((comment) => (comment.id === tempId ? { ...comment, ...postedCommentData } : comment))
      );
      setLikeCount((prev) => ({
        ...prev,
        [postedCommentData.comment_id]: postedCommentData.like_count ?? 0,
      }));
      setIsLiked((prev) => ({
        ...prev,
        [postedCommentData.comment_id]: postedCommentData.isliked ?? false,
      }));
    } catch (error) {
      console.error('Error posting comment:', error);
      setComments((prev) => prev.filter((c) => c.id !== tempId));
    }
  };

  // Handle like/unlike comment
  const handleCommentLike = async (commentId, currentLikeStatus) => {
    try {
      // Optimistically update UI
      setIsLiked((prev) => ({
        ...prev,
        [commentId]: !currentLikeStatus,
      }));

      setLikeCount((prev) => ({
        ...prev,
        [commentId]: currentLikeStatus ? (+prev[commentId] || 0) - 1 : (+prev[commentId] || 0) + 1,
      }));

      const token = await getAccessTokenSilently();
      const method = currentLikeStatus ? 'DELETE' : 'POST';
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments/${commentId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to update like status');

      const updatedCommentData = await response.json();
      setLikeCount((prev) => ({
        ...prev,
        [commentId]: updatedCommentData.like_count ?? prev[commentId],
      }));
    } catch (error) {
      console.error("Error updating like status:", error);
      setIsLiked((prev) => ({
        ...prev,
        [commentId]: currentLikeStatus,
      }));
      setLikeCount((prev) => ({
        ...prev,
        [commentId]: currentLikeStatus ? (+prev[commentId] || 0) + 1 : (+prev[commentId] || 0) - 1,
      }));
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete comment');

      setComments((prev) => prev.filter((comment) => comment.comment_id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className={styles.commentSection}>
      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className={styles.noComments}>No Comments yet, be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.comment_id} className={styles.commentContainer}>
              <div className={styles.commentText}>
                <strong>{comment.name}:</strong> {comment.text}
                <div className={styles.likeContainer}>
                  <Button
                    variant="link"
                    onClick={() => handleCommentLike(comment.comment_id, isLiked[comment.comment_id])}
                    style={{ color: isLiked[comment.comment_id] ? 'red' : 'gray' }}
                  >
                    {isLiked[comment.comment_id] ? <FaHeart /> : <FaRegHeart />}
                  </Button>
                  <span className={styles.likeCount}>{likeCount[comment.comment_id] || 0}</span>
                </div>
              </div>
              {comment.user_id === userId && (
                <Button
                  variant="link"
                  onClick={() => handleDeleteComment(comment.comment_id)}
                  className={styles.deleteButton}
                >
                  <FaTrash />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
      <div className="mt-4 d-flex">
        <input
          type="text"
          className="form-control"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
        />
        <Button className="ml-2" onClick={addComment} variant="primary">
          Post
        </Button>
      </div>
    </div>
  );
};

export default CommentSection;
