import React, { useState, useEffect } from 'react';
import styles from './SocialFeed.module.css';

const SocialFeed = ({ userId }) => {
    const [feed, setFeed] = useState([]);
    const [userFeed, setUserFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/feed');
                if (!response.ok) {
                    throw new Error(`Failed to fetch feed: ${response.statusText}`);
                }
                const rawFeed = await response.json();
                setFeed(rawFeed);
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
                if (!response.ok) {
                    throw new Error(`Failed to fetch user feed: ${response.statusText}`);
                }
                const rawUserFeed = await response.json();
                setUserFeed(rawUserFeed);
            } catch (err) {
                console.error('Error fetching user feed:', err);
            }
        };

        fetchFeed();
        fetchUserFeed();
    }, [userId]);

    if (loading) return <p>Loading feed...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2>Social Feed</h2>
            {feed.length > 0 ? (
                feed.map((post) => (
                    <div key={post.post_id} className={styles.feedCard}>
                        <img src={post.image_url} alt={post.title} className={styles.feedCardImage} />
                        <div>
                            <h3>{post.title}</h3>
                            <p>{post.content}</p>
                            <p>
                                <strong>Author:</strong> {post.author}
                            </p>
                            <p>
                                <strong>Posted:</strong> {new Date(post.date_created).toLocaleString()}
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <p>No posts available.</p>
            )}

            {userId && (
                <>
                    <h2>Your Posts</h2>
                    {userFeed.length > 0 ? (
                        userFeed.map((post) => (
                            <div key={post.post_id} className={styles.feedCard}>
                                <img src={post.image_url} alt={post.title} className={styles.feedCardImage} />
                                <div>
                                    <h3>{post.title}</h3>
                                    <p>{post.content}</p>
                                    <p>
                                        <strong>Posted:</strong> {new Date(post.date_created).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>You have no posts yet.</p>
                    )}
                </>
            )}
        </div>
    );
};

export default SocialFeed;
