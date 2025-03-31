import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from 'react-router-dom';

const OfferModal = ({ show, onHide, listing }) => {
  const [offerPrice, setOfferPrice] = useState("");
  const { getAccessTokenSilently, user } = useAuth0();
  const navigate = useNavigate();

  const handleOfferSubmit = async () => {
    if (!offerPrice) {
      alert('Please enter a valid offer.');
      return;
    }

    try {
      const token = await getAccessTokenSilently();
      
      const conversationResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/conversations/${user.sub}/${listing.user_id}/find`,
        {
          method: "GET",
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      const conversationData = await conversationResponse.json();
      if (!conversationResponse.ok) {
        throw new Error(conversationData.message || 'Failed to create conversation');
      }

      // Construct the full URL and message content
      const listingUrl = `http://localhost:3000/marketplace?listingId=${listing.id}`;

        const offerData = {
        offer_price: offerPrice,
        buyer_id: user.sub,
        conversation_id: conversationData.conversation_id,
        listing_id: listing.id,
        content: `Offer from ${user.email}: $${offerPrice} for ${listing.title} - ${listingUrl}`,
        };


      const offerResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/messages/${listing.id}/offer`,
        {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(offerData),
        }
      );

      const offerResult = await offerResponse.json();
      console.log('Offer response:', offerResult);

      if (!offerResponse.ok) {
        throw new Error(offerResult.error || 'Failed to send offer');
      }

      navigate(`/chat/${conversationData.conversation_id}`);
    } catch (error) {
      console.error('Error sending offer:', error);
      alert('Failed to send offer. Please try again.');
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Make an Offer</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Label>Enter Your Offer Price</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter your offer amount"
            value={offerPrice}
            onChange={(e) => setOfferPrice(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleOfferSubmit}>Submit</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OfferModal;