import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { FaHeart, FaRegHeart, FaEllipsisH, FaTrash, FaExclamationTriangle, FaUserTimes } from 'react-icons/fa';
import styles from './CommentSection.module.css';
import { useAuth0 } from '@auth0/auth0-react';
import ReportModal from './ReportModal';

export const CommentSection = ({ selectedPostId, userId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState({});
  const [likeCount, setLikeCount] = useState({});
  const textAreaRef = useRef(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingItemId, setReportingItemId] = useState(null);

  const { user, isAuthenticated, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
  const username = user?.name || 'Anonymous';

  const [activeMenu, setActiveMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  const toggleMenu = (commentId, event) => {
    event.stopPropagation(); // Prevents menu from closing on click
  
    if (activeMenu === commentId) {
      setActiveMenu(null);
    } else {
      const button = event.currentTarget;
      const menuOffsetTop = button.offsetTop + button.offsetHeight;
      const menuOffsetLeft = button.offsetLeft;
  
      setMenuPosition({
        top: menuOffsetTop,
        left: menuOffsetLeft,
      });
  
      setActiveMenu(commentId);
    }
  };
  
  const handleCommentChange = (e) => {
    setNewComment(e.target.value);

    // Auto-expand the textarea
    const textarea = textAreaRef.current;
    textarea.style.height = "auto"; // Reset height
    textarea.style.height = `${textarea.scrollHeight}px`; // Set new height based on content
  };

  useEffect(() => {
    if (!selectedPostId) return;
    fetchComments();
  }, [selectedPostId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  

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
      setActiveMenu(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleReportClick = async (e, commentId) => {
    e.stopPropagation();
    setReportingItemId(commentId);
    setShowReportModal(true);
  }

  const submitReport = async (reason, description) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'post-comment',
          reportedItemId: reportingItemId,
          reason,
          description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      setShowReportModal(false);
      setReportingItemId(null);
      alert('Report submitted successfully');
      setActiveMenu(null); 
    } catch (error) {
      console.error('Error reporting comment:', error);
      alert('Failed to submit report');
    }
  };

  const handleBlockUser = (userId) => {
    console.log(`Blocked user: ${userId}`);
    setActiveMenu(null); // Close menu after action
  };

  return (
    <div className={styles.commentSection}>
      <div className={styles.commentInputContainer}>
        <textarea
          className={styles.commentInput}
          value={newComment}
          onChange={(e) => handleCommentChange(e)}
          placeholder="Add a comment..."
          rows="1"
          ref={textAreaRef}
        />
        <Button className={styles.commentPostButton} onClick={addComment}>
          Post
        </Button>
      </div>
  
      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className={styles.noComments}>No Comments yet, be the first!</p>
        ) : (
          <div className={styles.commentList}> {/* Add this wrapper for scrollable comments */}
            {comments.map((comment) => (
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
                  <div
                    className={styles.threeDotMenu}
                    onClick={(e) => toggleMenu(comment.comment_id, e)}
                  >
                    <FaEllipsisH />
                  </div>
                </div>
                <div className={styles.commentActions}>
                  {activeMenu === comment.comment_id && (
                    <div
                      ref={dropdownRef}
                      className={styles.threeDotDropdown}
                      style={{
                        position: 'absolute',
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                        zIndex: 10,
                      }}
                    >
                      {comment.user_id === userId && (
                        <div className={styles.dropdownItem} onClick={() => handleDeleteComment(comment.comment_id)}>
                          <FaTrash /> Delete
                        </div>
                      )}
                      {comment.user_id !== userId && (
                        <>                        
                          <div className={styles.dropdownItem} onClick={(e) => handleReportClick(e, comment.comment_id)}>
                            <FaExclamationTriangle /> Report
                          </div>
                          <div className={styles.dropdownItem} onClick={() => handleBlockUser(comment.user_id)}>
                            <FaUserTimes /> Block User
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.footer}></div>

      {showReportModal && (
        <div onClick={(e) => e.stopPropagation()}>
          <ReportModal
            show={showReportModal}
            onHide={() => setShowReportModal(false)}
            onSubmit={submitReport}
            itemType="post-comment"
          />
        </div>
      )}
    </div>
  );
};

export default CommentSection;
