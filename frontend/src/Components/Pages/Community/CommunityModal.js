import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import './CommunityModal.css'; 
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

function CommunityModal({ show, onHide, community}) {
  const { getAccessTokenSilently } = useAuth0();
  const [members, setMembers] = useState([]);  

  if (!community) return null; // If no community data, render nothing

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


  return (
    <Modal show={show} onHide={onHide} dialogClassName='modal' centered>
      <Modal.Header closeButton>
          <Modal.Title className='card-title'>{community.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className='modal-body'>
        <div className='information'>
          <div className='image-container'>
              <img
                src={community.image}
                alt={community.title}
                className='img'
              />
          </div>
          <div className='content'>
            {/*<Button variant='dark' > Join {community.title} </Button>
            <Button variant='dark'> Button 2 </Button>*/}
            <p className='card-text'>{community.description}</p>
          </div>
        </div>
          {/* Members List */}
        <div className="member-list-section">
          <h2>Members of this Community</h2>
          {members.length === 0 ? (
            <p className="no-members">This community has no members. You could be the first!</p>
          ) : (
            <div className="members-grid">
              {members.map((member) => (
                <div key={member.user_id} className="member-card">
                  <img
                    src={member.profile_picture || 'https://via.placeholder.com/100'}
                    alt={member.username || `User ${member.user_id}`}
                    className="member-avatar"
                  />
                  <div className="member-info">
                    <h3>{member.username || `User ${member.user_id}`}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
          <h5 class='card-text'> add future similar stuff here </h5>
      </Modal.Footer>
    </Modal>
  );
}
export default CommunityModal;
