import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import {CardGrid, SocialCard, CommentSection} from '../../Common'
import Masonry from 'react-masonry-css';
import ListingModal from '../Marketplace/Listings';
import { Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import styles from "./CommunityHome.module.css";
import feedStyles from '../Feed/SocialFeed.module.css';
import listingStyles from '../Marketplace/Marketplace.module.css';

const CommunityHome = () => {
  const { community_id } = useParams(); // Get community id from URL
  const [community, setCommunity] = useState({});
  const [members, setMembers] = useState([]);
  const [listings, setListings] = useState([]);
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false); // State to toggle the modal
  const navigate = useNavigate();
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const { user, isAuthenticated, getAccessTokenSilently, isLoading: authLoading } = useAuth0();

  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  const userId = isAuthenticated ? user?.sub : null;

  
  useEffect(() => {
    if (!user) return;
    const fetchFriends = async () => {
      try {
        const token = await getAccessTokenSilently();
        const friendsResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/friends`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { user_id: user.sub },
          }
        );

        const friendDetails = await Promise.all(
          friendsResponse.data.map(async (friend) => {
            try {
              const friendRes = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/user/${encodeURIComponent(friend.friend_id)}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return {
                ...friend,
                name: friendRes.data.name || 'Unnamed User',
                profile_picture: friendRes.data.picture || 'https://via.placeholder.com/40',
              };
            } catch (err) {
              console.error('Error fetching user info for friend:', err);
              return {
                ...friend,
                name: 'Unknown User',
                profile_picture: 'https://via.placeholder.com/40',
              };
            }
          })
        );

        setFriends(friendDetails);
      } catch (error) {
        console.error('Error fetching friends:', error);
        setFriends([]);
      } finally {
        setFriendsLoading(false);
      }
    };

    fetchFriends();
  }, [user, getAccessTokenSilently]);
  
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
                name: memberResponse.data.name, 
                email: memberResponse.data.email, // Include email
                profile_picture: memberResponse.data.picture 
              };
            } catch (error) {
              console.error(`Error fetching data for member id ${member.user_id}:`, error.response ? error.response.data : error.message);
              return { 
                ...member, 
                name: 'Unknown User', 
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
          location: item.location,
        }));

        console.log('Fetched info:', formattedData); // Debugging log
        setListings(formattedData);
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

  const reloadFeed = async (pageArg) => {
    getCommunityPosts();
  };

  const handleShowComments = (post_id) => {
    setSelectedPostId(post_id);
    setShowComments(true);
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedPostId(null);
  };

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

  // Handle Message button click
  const handleMessage = async (memberId) => {
    try {
      console.log('Starting conversation with:', memberId);
      const token = await getAccessTokenSilently();
      console.log('Access token fetched:', token);

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/conversations`,
        { user1_id: user.sub, user2_id: memberId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Conversation Created:', response.data);
      navigate(`/chat/${response.data.conversation_id}`);
      console.log('Navigated to chat page for conversation ID:', response.data.conversation_id);
    } catch (error) {
      console.error('Error starting conversation:', error.response ? error.response.data : error.message);
      alert('Unable to start a conversation. Please try again.');
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

// join a community
const joinCommunity = async () => {
  try {
    const token = await getAccessTokenSilently();
    const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/communities`, {
      community_id: community_id
    }, 
    {    
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    }
  );
    alert("Community added successfully"); // Success message

    setIsJoined(true);
    //get members of this community
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
              name: memberResponse.data.name, 
              email: memberResponse.data.email, // Include email
              profile_picture: memberResponse.data.picture 
            };
          } catch (error) {
            console.error(`Error fetching data for member id ${member.user_id}:`, error.response ? error.response.data : error.message);
            return { 
              ...member, 
              name: 'Unknown User', 
              email: 'No Email Provided', // Fallback for email
              profile_picture: 'https://via.placeholder.com/100' 
            };
          }
        })
      );
  
      console.log('Merged Member Details:', memberDetails);
      setMembers(memberDetails);
  } catch (error) {
    console.error('Error adding community:', error);
    alert('Error adding community.');
  }
};

// Remove a community
const leaveCommunity = async () => {
  try {
    const token = await getAccessTokenSilently();
    const response = await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/communities/${community_id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    );
    alert(response.data.message);
    setIsJoined(false);

    //get members of this community
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
            name: memberResponse.data.name, 
            email: memberResponse.data.email, // Include email
            profile_picture: memberResponse.data.picture 
          };
        } catch (error) {
          console.error(`Error fetching data for member id ${member.user_id}:`, error.response ? error.response.data : error.message);
          return { 
            ...member, 
            name: 'Unknown User', 
            email: 'No Email Provided', // Fallback for email
            profile_picture: 'https://via.placeholder.com/100' 
          };
        }
      })
    );
    console.log('Merged Member Details:', memberDetails);
    setMembers(memberDetails);
  } catch (error) {
    console.error('Error removing community:', error);
    alert('Error removing community.');
  }
};

  return (
    <div className={styles.communityHomeContainer}> 
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
          <button onClick={isJoined ? leaveCommunity : joinCommunity}>{isJoined ? "Leave" : "Join"}</button>
              
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
              alt={member.name || `User ${member.user_id}`}
              className={styles.memberAvatar}
            />
            <div className={styles.memberInfo}>
              <h3>{member.name || `User ${member.user_id}`}</h3>
            </div>
            <div className={styles.memberActions}>
               <button
                className={styles.memberMessageButton}
                onClick={() => handleMessage(member.user_id)}>
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
      <div className={listingStyles.cardGridContainer}>
        <CardGrid listings={listings} className={listingStyles.cardGrid} openListingDetails={handleCardClick} />
      </div>
      <p className={styles.sectionTitle}>Social Posts</p>
      <div style={{width: "100%"}}>
        {feed.length === 0 ? (
          <p className={styles.defaultFiller}>No posts available.</p>
        ) : (
          <Masonry
            breakpointCols={{ default: 8, 2560: 6, 1920:5, 1280: 3, 1024: 2, 768: 1 }}
            className={feedStyles.masonryGrid}
            columnClassName={feedStyles.masonryColumn}
          >
          {feed.map((post) => (
            <div key={post.post_id} className={feedStyles.gridItem} onClick={() => handleFeedCardClick(post)}> 
              <SocialCard
                post_id={post.post_id}
                image={post.image}
                title={post.title}
                description={post.content}
                profilePic={post.profile}
                author={post.author}
                authorId={post.author_id}
                initialLikes={post.likes_count}
                initialShares={post.shares}
                isLikedAlready={post.isliked}
                tags={post.tags}
                listingId={post.listing_id}
                onShowComments={() => handleShowComments(post.post_id)}
              />
            </div>
          ))}
          </Masonry>
        )
        }
      </div>
      {selectedListing && (<ListingModal show={showListingModal} onHide={handleCloseListingModal} listing={selectedListing} />)}
      
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
                  profilePic={selectedCard.profile}
                  author={selectedCard.author}
                  authorId={selectedCard.author_id}
                  initialLikes={selectedCard.likes_count}
                  initialShares={selectedCard.shares}
                  isLikedAlready={selectedCard.isliked}
                  tags={selectedCard.tags}
                  listingId={selectedCard.listing_id}
                  onShowComments={() => handleShowComments(selectedCard.post_id)}
                  reloadFeed={reloadFeed}
                  allFriends={friends}
                  friendsLoading={friendsLoading}
                />
            )}
        </Modal.Body>
      </Modal>

      {/* Comments Modal */}
      <Modal  show={showComments}
        onHide={handleCloseComments}
        animation={true}
        className="bottom-modal"
        dialogClassName="modal-dialog-bottom">
        <Modal.Header closeButton>
          <Modal.Title style={{ color: 'black' }}>Comments</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CommentSection selectedPostId={selectedPostId} userId={userId} />
        </Modal.Body>
      </Modal>
    </div>
  )
};

export default CommunityHome;