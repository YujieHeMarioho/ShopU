import React, { useState } from 'react';
import { CardGrid } from '../../Common';
import styles from './SocialFeed.module.css'; // Import CSS module for styling
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// Dummy data for the social feed
const dummyPosts = [
    {
      id: 1,
      author: 'Alice',
      profilePic: 'https://via.placeholder.com/50',
      content: 'Exploring the mountains today! 🏔️',
      image: 'https://via.placeholder.com/400x300',
      likes: 25,
      isLiked: false,
      itemDetails: {
        id: '123',
        title: 'Hiking Gear',
        description: 'Top-quality hiking gear for sale!',
      },
    },
    {
      id: 2,
      author: 'Bob',
      profilePic: 'https://via.placeholder.com/50',
      content: 'Look at this cute puppy I found! 🐶',
      image: 'https://via.placeholder.com/400x300',
      likes: 40,
      isLiked: false,
      itemDetails: {
        id: '456',
        title: 'Dog Supplies',
        description: 'High-quality dog supplies and toys.',
      },
    },
  ];

export const SocialFeed = () => {
  const [posts, setPosts] = useState(dummyPosts);
  const navigate = useNavigate();

  // Handle liking a post
  const handleLike = (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  // Map posts into the format for CardGrid
  const formattedPosts = posts.map((post) => ({
    image: post.image,
    title: post.author,
    description: post.content,
    customFooter: (
      <div className={styles.postFooter}>
        <Button
          variant={post.isLiked ? 'danger' : 'outline-danger'}
          onClick={() => handleLike(post.id)}
          className={styles.likeButton}
        >
          {post.isLiked ? 'Unlike' : 'Like'}
        </Button>
        <span className={styles.likesCount}>{post.likes} Likes</span>
      </div>
    ),
  }));

  return (
    <div className={styles.socialFeedContainer}>
      {/* Create Post Button */}
      <div className={styles.createPostWrapper}>
        <Button
          onClick={() => navigate('/create-post')}
          className={styles.createPostButton}
        >
          Create Post
        </Button>
      </div>

      {/* Card Grid for Posts */}
      <CardGrid listings={formattedPosts} variant='socialFeed' />
    </div>
  );
};

export default SocialFeed;
