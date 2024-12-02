import React, { useState } from 'react';
import { CardGrid, SocialCard } from '../../Common';
import styles from './SocialFeed.module.css'; // Import CSS module for styling
import { Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// Dummy data for the social feed
const dummyPosts = [
  {
    id: 1,
    author: 'Alice',
    profilePic: 'https://via.placeholder.com/50',
    title: 'Exploring the mountains today! 🏔️',
    description: 'Had an amazing hike in the mountains with stunning views!',
    image: 'https://via.placeholder.com/400x300',
    likes: 25,
    shares: 5,
    isLiked: false,
    isShared: false,
    tags: ['adventure', 'hiking', 'nature'],
  },
  {
    id: 2,
    author: 'Bob',
    profilePic: 'https://via.placeholder.com/50',
    title: 'Look at this cute puppy I found! 🐶',
    description: 'This little puppy is the cutest thing ever!',
    image: 'https://via.placeholder.com/400x300',
    likes: 40,
    shares: 8,
    isLiked: false,
    isShared: false,
    tags: ['pets', 'dogs', 'cute'],
  },
  {
    id: 3,
    author: 'Carol',
    profilePic: 'https://via.placeholder.com/50',
    title: 'Had a blast at the beach today! 🌊',
    description: 'The sun, the sea, and the sand – perfect day!',
    image: 'https://via.placeholder.com/400x300',
    likes: 18,
    shares: 2,
    isLiked: false,
    isShared: false,
    tags: ['beach', 'summer', 'sunshine'],
  },
  {
    id: 4,
    author: 'David',
    profilePic: 'https://via.placeholder.com/50',
    title: 'Just baked some homemade cookies! 🍪',
    description: 'Fresh, warm, and delicious cookies just out of the oven!',
    image: 'https://via.placeholder.com/400x300',
    likes: 30,
    shares: 4,
    isLiked: false,
    isShared: false,
    tags: ['baking', 'cookies', 'food'],
  },
  {
    id: 5,
    author: 'Emma',
    profilePic: 'https://via.placeholder.com/50',
    title: 'New art project completed! 🎨',
    description: 'Finished my latest painting. It turned out beautifully!',
    image: 'https://via.placeholder.com/400x300',
    likes: 50,
    shares: 10,
    isLiked: false,
    isShared: false,
    tags: ['art', 'painting', 'creativity'],
  },
  {
    id: 6,
    author: 'Frank',
    profilePic: 'https://via.placeholder.com/50',
    title: 'Workout complete! Feeling great! 💪',
    description: 'Just finished an intense workout session. Feeling stronger!',
    image: 'https://via.placeholder.com/400x300',
    likes: 45,
    shares: 6,
    isLiked: false,
    isShared: false,
    tags: ['fitness', 'workout', 'health'],
  },
  {
    id: 7,
    author: 'Grace',
    profilePic: 'https://via.placeholder.com/50',
    title: 'Trying out a new recipe for dinner. 🍝',
    description: 'Cooking up something delicious for dinner tonight!',
    image: 'https://via.placeholder.com/400x300',
    likes: 20,
    shares: 3,
    isLiked: false,
    isShared: false,
    tags: ['cooking', 'recipes', 'food'],
  },
  {
    id: 8,
    author: 'Hannah',
    profilePic: 'https://via.placeholder.com/50',
    title: 'Morning yoga session by the lake. 🧘',
    description: 'Started my day with some peaceful yoga by the lake.',
    image: 'https://via.placeholder.com/400x300',
    likes: 35,
    shares: 7,
    isLiked: false,
    isShared: false,
    tags: ['yoga', 'wellness', 'mindfulness'],
  },
];


export const SocialFeed = () => {
  const [posts, setPosts] = useState(dummyPosts);
  const [isGridLayout, setIsGridLayout] = useState(true); // State to toggle layout
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

  // Handle sharing a post
  const handleShare = (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId && !post.isShared
          ? {
              ...post,
              isShared: true,
              shares: post.shares + 1,
            }
          : post
      )
    );
  };

  // Navigate to marketplace with filtered search by tag
  const handleTagClick = (tag) => {
    navigate(`/marketplace?tag=${encodeURIComponent(tag)}`);
  };

  // Map posts into the format for CardGrid
  const formattedPosts = posts.map((post) => ({
    
    image: post.image,
    title: post.title,
    description: (
      <>
        <p>{post.description}</p>
      </>
    ),
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

        <Button
          variant={post.isShared ? 'success' : 'outline-success'}
          onClick={() => handleShare(post.id)}
          className={styles.shareButton}
        >
          {post.isShared ? 'Shared' : 'Share'}
        </Button>
        <span className={styles.sharesCount}>{post.shares} Shares</span>
      </div>
    ),
    likes: post.likes,
    shares: post.shares,
    isLiked: post.isLiked,
    isShared: post.isShared,
    tags: post.tags
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

      {/* Toggle Layout Button */}
      <div className={styles.layoutToggleButton}>
        <Button
          onClick={() => setIsGridLayout(!isGridLayout)}
          variant="outline-primary"
        >
          {isGridLayout ? 'Switch to Scrolling Layout' : 'Switch to Grid Layout'}
        </Button>
      </div>

      {/* Card Grid for Posts */}
      {isGridLayout ? (
        <CardGrid listings={formattedPosts} variant="socialFeed" />
      ) : (
        <div className="single-column-layout">
          {posts.map((post) => (
            <SocialCard
              key={post.id}
              image={post.image}
              title={post.title}
              description={post.description}
              profilePic={post.profilePic}
              author={post.author}
              initialLikes={post.likes}
              initialShares={post.shares}
              isLiked={post.isLiked}
              isShared={post.isShared}
              tags={post.tags}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialFeed;
