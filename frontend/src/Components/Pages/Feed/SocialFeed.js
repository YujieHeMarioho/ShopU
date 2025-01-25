import React, { useState, useEffect } from 'react';
import styles from './SocialFeed.module.css';
import { Button } from 'react-bootstrap';
import { SocialCard } from '../../Common'; // Import the SocialCard component
import { useAuth0 } from '@auth0/auth0-react';

const SocialFeed = () => {
    const [feed, setFeed] = useState([]);
    const [userFeed, setUserFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newPost, setNewPost] = useState({ title: '', content: '', imageUrl: '' });
    const [editPost, setEditPost] = useState(null);
    const [isPostLoading, setIsPostLoading] = useState(false);
    const [isGridLayout, setIsGridLayout] = useState(true); // State to toggle layout
    const { user, isAuthenticated, getAccessTokenSilently, isLoading: authLoading } = useAuth0();

    const userId = isAuthenticated ? user?.sub : null;

    const fetchFeed = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/feed');
            if (!response.ok) throw new Error(`Failed to fetch feed: ${response.statusText}`);
            const rawFeed = await response.json();
            setFeed(rawFeed);
            console.log('Raw Feed:', rawFeed);
        } catch (err) {
            console.error('Error fetching feed:', err);
            setError('Failed to load feed. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserFeed = async () => {
        if (!userId) return;

        try {
            const response = await fetch(`http://localhost:8080/api/feed/user/${userId}`);
            if (!response.ok) throw new Error(`Failed to fetch user feed: ${response.statusText}`);
            const rawUserFeed = await response.json();
            setUserFeed(rawUserFeed);
        } catch (err) {
            console.error('Error fetching user feed:', err);
        }
    };

    const createFeedPost = async () => {
        setIsPostLoading(true);
        try {
            const response = await fetch('http://localhost:8080/api/feed/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newPost, userId }),
            });
            if (!response.ok) throw new Error('Failed to create post');
            const createdPost = await response.json();
            setFeed((prev) => [createdPost, ...prev]);
            setUserFeed((prev) => [createdPost, ...prev]);
            setNewPost({ title: '', content: '', imageUrl: '' });
        } catch (err) {
            console.error('Error creating post:', err);
        } finally {
            setIsPostLoading(false);
        }
    };

    const handlePostOperation = async (postId, method, updatedPost = null) => {
        setIsPostLoading(true);
        const url = `http://localhost:8080/api/feed/${postId}`;
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: updatedPost ? JSON.stringify(updatedPost) : null,
        };

        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`Failed to ${method.toLowerCase()} post`);
            const updatedData = await response.json();
            setFeed((prev) => prev.map((post) => (post.post_id === postId ? updatedData : post)));
            setUserFeed((prev) => prev.map((post) => (post.post_id === postId ? updatedData : post)));
            setEditPost(null);
        } catch (err) {
            console.error('Error updating post:', err);
        } finally {
            setIsPostLoading(false);
        }
    };

    const handleLike = async (postId, currentLikes, isLiked) => {
        // Optimistic UI update for likes count
        setFeed((prev) =>
            prev.map((post) =>
                post.post_id === postId
                    ? { ...post, likes: isLiked ? currentLikes + 1 : currentLikes - 1, is_liked: !isLiked }
                    : post
            )
        );

        try {
            const response = await fetch(`http://localhost:8080/api/feed/like/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_liked: !isLiked }),
            });
            if (!response.ok) throw new Error('Failed to like post');
            const updatedData = await response.json();
            setFeed((prev) =>
                prev.map((post) => (post.post_id === postId ? updatedData : post))
            );
        } catch (err) {
            console.error('Error liking post:', err);
        }
    };

    const shareFeedPost = async (postId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/feed/share/${postId}`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to share post');
            alert('Post shared successfully!');
        } catch (err) {
            console.error('Error sharing post:', err);
        }
    };

    const toggleLayout = () => {
        setIsGridLayout((prev) => !prev); // Toggle between grid and scroll view
    };

    // useEffect(() => {
    //     if (userId) {
    //         fetchUserFeed();  // Fetch user feed if user is logged in
    //     } else {
    //         fetchFeed();      // Fetch general feed if user is not logged in
    //     }
    // }, [userId]);
    useEffect(()=>{
        fetchFeed();
    })
    

    if (loading) return <p>Loading feed...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className={styles.socialFeedContainer}>
            <h2>Social Feed</h2>
            
            {/* Toggle Layout Button */}
            <div className={styles.layoutToggleButton}>
                <Button
                    onClick={toggleLayout}
                    variant="outline-primary"
                >
                    {isGridLayout ? 'Switch to Scrolling Layout' : 'Switch to Grid Layout'}
                </Button>
            </div>

            {/* Display the feed */}
            <div className={`${styles.feedContainer} ${isGridLayout ? styles.gridView : styles.scrollView}`}>
                {feed.length === 0 ? (
                    <p>No posts available.</p>
                ) : (
                    feed.map((post) => (
                        <div key={post.post_id} className={styles.gridItem}>
                            <SocialCard
                                post_id={post.post_id}                // Directly passing post_id
                                image={post.image_url}                 // Passing image URL
                                title={post.title}                     // Passing title
                                description={post.content}             // Passing content as description
                                profilePic={post.profile_pic_url}      // Passing profile picture URL
                                author={post.author}                   // Passing author name
                                initialLikes={post.likes_count}        // Mapping likes_count to initialLikes
                                initialShares={post.shares}            // Mapping shares to initialShares
                                tags={post.tags}                       // Passing tags
                                onLike={() => handleLike(post.post_id, post.likes_count, post.is_liked)} // Handling like action
                                onShare={() => shareFeedPost(post.post_id)}  // Handling share action
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SocialFeed;
