// ChatContent.js

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

const CommunityHome = () => {
  const { community_id } = useParams(); // Get community id from URL
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    //get details of this community
    const getCommunityDetails = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/community`,
          { community_id: community_id},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.error('Fetched info:', response.data); // Debugging log
        setCommunity(response.data);
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
          `${process.env.REACT_APP_BACKEND_URL}/api/communities/members`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { community_id: community.community_id },
          }
        );
  
        alert('Members Response:' + membersResponse.data);
  
        const memberDetails = await Promise.all(
          membersResponse.data.map(async (member) => {
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
    getCommunityDetails();
    //fetchCommunityMembersInfo();
  });



  return (
    <div> 
      <p>{community}</p>   
      {/* <div className='community-information'>
          <div className='image-container'>
              <img
                src={community.imageUrl}
                alt={community.title}
                className='img'
              />
          </div>
          <div className='content'>
            {/*<Button variant='dark' > Join {community.title} </Button>
            <Button variant='dark'> Button 2 </Button>}
            <p className='card-text'>{community.description}</p>
          </div>
        </div> */}
    </div>
  );
};

export default CommunityHome;