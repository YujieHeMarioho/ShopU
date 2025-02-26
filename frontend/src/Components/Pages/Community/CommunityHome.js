import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import {CardGrid, SocialCard} from '../../Common'
import ListingModal from '../Marketplace/Listings';
import { Modal } from 'react-bootstrap';
import styles from "./CommunityHome.module.css";
import feedStyles from '../Feed/SocialFeed.module.css';

const CommunityHome = () => {
  const { community_id } = useParams(); // Get community id from URL
  const [community, setCommunity] = useState({});
  const [members, setMembers] = useState([]);
  const [listings, setListings] = useState([]);
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false); // State to toggle the modal
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    if (!isLoading) return;

    //get details of this community
    const getCommunityDetails = async () => {
      try {
        const token = await getAccessTokenSilently();

        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/community/${community_id}`,
          {  
            headers: {
              Authorization: `Bearer ${token}`,
            }, 
          }
        );
        console.log('Fetched info:', response.data[0]); // Debugging log
        setCommunity(response.data[0]);
      } catch (error) {
        console.error('Error fetching community info:', error);
      }
    };

    //get members of this community
    const fetchCommunityMembersInfo = async () => {
      try {
        const token = await getAccessTokenSilently();
        console.log('Access Token:', token);
  
        const membersResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/communities/members/${community_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(membersResponse.data)
        const memberDetails = await Promise.all(
          membersResponse.data.rows.map(async (member) => {
            try {
              const memberResponse = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/user/${encodeURIComponent(member.user_id)}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              console.log(`Member ${member.user_id} Details:`, memberResponse.data);
              return { 
                ...member, 
                username: memberResponse.data.username, 
                email: memberResponse.data.email, // Include email
                profile_picture: memberResponse.data.picture 
              };
            } catch (error) {
              console.error(`Error fetching data for member id ${member.user_id}:`, error.response ? error.response.data : error.message);
              return { 
                ...member, 
                username: 'Unknown User', 
                email: 'No Email Provided', // Fallback for email
                profile_picture: 'https://via.placeholder.com/100' 
              };
            }
          })
        );
  
        console.log('Merged Member Details:', memberDetails);
        setMembers(memberDetails);
      } catch (error) {
        console.error('Error fetching user info or members:', error.response ? error.response.data : error.message);
        alert('Failed to load community members. Please try again later.');
      };
    }

    //get listings in this community
    const getCommunityListings = async () => {
      try {
        const token = await getAccessTokenSilently();

        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/listings/communities/${community_id}`,
          {  
            headers: {
              Authorization: `Bearer ${token}`,
            }, 
          }
        );

        // Map the data to match the desired format, now including user_id
        const formattedData = response.data.map(item => ({
          id: item.listing_id,
          user_id: item.user_id,  // NEW: Include the seller's user_id
          title: item.title,
          description: item.description,
          category: item.category,
          type: item.item_type,
          rating: item.star_rating,
          price: item.price,
          image: item.file_keys,  // or item.file_keys[0] if you only want one image
          
        }));

        console.log('Fetched info:', formattedData); // Debugging log
        setListings(formattedData);
      } catch (error) {
        console.error('Error fetching community info:', error);
      }
    };

    //get posts of this community
    const getCommunityPosts = async () => {
      try {
        const token = await getAccessTokenSilently();

        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/feed/communities/${community_id}`,
          {  
            headers: {
              Authorization: `Bearer ${token}`,
            }, 
          }
        );

        console.log('Fetched posts:', response.data); // Debugging log
        setFeed(response.data);
      } catch (error) {
        console.error('Error fetching community info:', error);
      }
    };

    getCommunityDetails();
    fetchCommunityMembersInfo();
    getCommunityListings();
    getCommunityPosts();
    setIsLoading(false);
  });

  // Handler when user clicks a listing
  const handleCardClick = (listing) => {
    setSelectedListing(listing);
    setShowListingModal(true);
  };

  // Close modal for listing popup
  const handleCloseListingModal = () => {
    setShowListingModal(false);
    setSelectedListing(null);
  };

  //stuff for dealing with feeds

  const handleFeedCardClick = (post) => {
    setSelectedCard(post);
  };

  const closeCardModal = () => {
    setSelectedCard(null);
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
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/like/${postId}`, {
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
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/share/${postId}`, { method: 'POST' });
        if (!response.ok) throw new Error('Failed to share post');
        alert('Post shared successfully!');
    } catch (err) {
        console.error('Error sharing post:', err);
    }
};

  return (
    <div> 
      <h1 className={styles.communityPageTitle}>{community.name + " Homepage"}</h1>
      <div className='community-information'>
        <div className={styles.communityImageAndButtons}>
          <div className={styles.emptyForFormatting}></div>
          <div className={styles.imageContainer}>
              <img
                src={community.imageUrl}
                alt={community.name}
                className={styles.img}
              />
          </div>
          <div className={styles.communityButtons}>
            <button>Join</button>
            <button>Visit Community Groupchat</button>
          </div>
        </div>
        <div className={styles.content}>
            {/*<Button variant='dark' > Join {community.name} </Button>
            <Button variant='dark'> Button 2 </Button>}*/}
            <p className={styles.cardText}>{community.description}</p>
        </div>
      </div>
      <p className={styles.sectionTitle}>Members</p>
      <div className={styles.membersGrid}>
        {members.map((member) => (
          <div key={member.user_id} className={styles.memberCard}>
            <img
              src={member.profile_picture || 'https://via.placeholder.com/100'}
              alt={member.username || `User ${member.user_id}`}
              className={styles.memberAvatar}
            />
            <div className={styles.memberInfo}>
              <h3>{member.username || `User ${member.user_id}`}</h3>
            </div>
            <div className={styles.memberActions}>
               <button
                className={styles.memberMessageButton}
                /* onClick={() => handleMessage(member.user_id)} */
              >
                Message
              </button> 
              <button
                className={styles.addFriendButton}
                /* onClick={() => handleMessage(member.user_id)} */
              >
                Add Friend
              </button> 
            </div>
          </div>
        ))}
      </div>
      <p className={styles.sectionTitle}>Listings</p>
      <div>
        <CardGrid listings={listings} openListingDetails={handleCardClick} />
      </div>
      <p className={styles.sectionTitle}>Social Posts</p>
      <div>
        {feed.length === 0 ? (
          <p>No posts available.</p>
        ) : (
          feed.map((post) => (
            <div key={post.post_id} className={feedStyles.gridView} onClick={() => handleFeedCardClick(post)}> 
              <SocialCard
                post_id={post.post_id}                // Directly passing post_id
                image={post.image}                 // Passing image URL
                title={post.title}                     // Passing title
                description={post.content}             // Passing content as description
                profilePic={post.profile_pic_url}      // Passing profile picture URL
                author={post.author}                   // Passing author name
                initialLikes={post.likes_count}        // Mapping likes_count to initialLikes
                initialShares={post.shares}            // Mapping shares to initialShares
                isLikedAlready={post.isliked}                 // Check if post already liked by user
                tags={post.tags}                       // Passing tags
                onLike={() => handleLike(post.post_id, post.likes_count, post.is_liked)} // Handling like action
                onShare={() => shareFeedPost(post.post_id)}  // Handling share action
              />
            </div>
          ))
        )
        }
      </div>
      <ListingModal show={showListingModal} onHide={handleCloseListingModal} listing={selectedListing} />
      {/* Feed Modal */}
      <Modal show={!!selectedCard} onHide={closeCardModal} centered>
        <Modal.Header closeButton>
        </Modal.Header>

        <Modal.Body
            style={{
                color: "#000000",
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
                flexDirection: "column",
            }}
        >
            {selectedCard && (
                <SocialCard
                    post_id={selectedCard.post_id}
                    image={selectedCard.image}
                    title={selectedCard.title}
                    description={selectedCard.content}
                    profilePic={selectedCard.profile_pic_url}
                    author={selectedCard.author}
                    initialLikes={selectedCard.likes_count}
                    initialShares={selectedCard.shares}
                    isLikedAlready={selectedCard.isliked}
                    tags={selectedCard.tags}
                    onLike={() => handleLike(selectedCard.post_id, selectedCard.likes_count, selectedCard.is_liked)}
                    onShare={() => shareFeedPost(selectedCard.post_id)}
                />
            )}
        </Modal.Body>
      </Modal>
    </div>
  )
};

export default CommunityHome;