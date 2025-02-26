import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import {CardGrid} from '../../Common'
import styles from "./CommunityHome.module.css";

const CommunityHome = () => {
  const { community_id } = useParams(); // Get community id from URL
  const [community, setCommunity] = useState({});
  const [members, setMembers] = useState([]);
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
    getCommunityDetails();
    fetchCommunityMembersInfo();
    setIsLoading(false);
  });

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
              alt={member.name || `User ${member.user_id}`}
              className={styles.memberAvatar}
            />
            <div className={styles.memberInfo}>
              <h3>{member.name || `User ${member.user_id}`}</h3>
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
        {/* FIXME: this is placeholder stuff. need to fix tables to match with communities. */}
        <CardGrid listings={[]} openListingDetails={setIsLoading} />
      </div>
      <p className={styles.sectionTitle}>Social Posts</p>
      <div>
        {/* FIXME: this is placeholder stuff. need to fix tables to match with communities. */}
        <p>No posts available.</p>
        {/* {feed.length === 0 ? (
          <p>No posts available.</p> */
        // ) : (
        //   feed.map((post) => (
        //     <div key={post.post_id} className={styles.gridItem}> 
        //       <SocialCard
        //         post_id={post.post_id}                // Directly passing post_id
        //         image={post.image}                 // Passing image URL
        //         title={post.title}                     // Passing title
        //         description={post.content}             // Passing content as description
        //         profilePic={post.profile_pic_url}      // Passing profile picture URL
        //         author={post.author}                   // Passing author name
        //         initialLikes={post.likes_count}        // Mapping likes_count to initialLikes
        //         initialShares={post.shares}            // Mapping shares to initialShares
        //         isLikedAlready={post.isliked}                 // Check if post already liked by user
        //         tags={post.tags}                       // Passing tags
        //         onLike={() => handleLike(post.post_id, post.likes_count, post.is_liked)} // Handling like action
        //         onShare={() => shareFeedPost(post.post_id)}  // Handling share action
        //       />
        //     </div>
        //   ))
        // )
        }
      </div>
    </div>
  )
};

export default CommunityHome;