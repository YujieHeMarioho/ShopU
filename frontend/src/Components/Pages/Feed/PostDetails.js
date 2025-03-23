import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import { useAuth0 } from "@auth0/auth0-react";
import styles from './PostDetails.module.css';  // Import CSS Module

function PostDetails() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [listingId, setListingId] = useState("");
  const [tags, setTags] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Retrieve the edited image from the previous step
  const { image } = location.state || {};

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const fetchedListings = await getListings();
        setListings(fetchedListings);
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    };

    fetchListings();
  }, []);

  // Transform base64URL back into a file 
  const convertToImage = (dataUrl, fileName) => {
    var arr = dataUrl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[arr.length - 1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  };

  const uploadImage = async () => {
    const imageForm = new FormData();
    let mimeType = image.match(/[^:/]\w+(?=;|,)/)[0];
    let fileName = title + '.' + mimeType;
    const convertedImage = convertToImage(image, fileName.replace(/\s+/g, ''));
    imageForm.append('postImage', convertedImage);

    const token = await getAccessTokenSilently();
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: imageForm,
    });
    const data = await response.json();
    return data.fileKey;
  };

  const getListings = async () => {
    const token = await getAccessTokenSilently();
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    const data = await response.json();
    return data.map(listing => ({
      listing_id: listing.listing_id,
      title: listing.title
    }));
  };

  const handleSubmit = async () => {
    const postData = {
      title,
      content,
      listingId,
      tags,
      image,
    };

    try {
      setLoading(true);
      postData.image = await uploadImage();
    } catch {
      // Handle upload failure
      setLoading(false);
    }

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      alert("Post created successfully!");
      navigate("/Feed");
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Error creating post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.bg}>
    <div className={styles.container}>
      <h1>Create Post Details</h1>
      {image && (
        <div className={styles.imagePreview}>
          <h3>Edited Image Preview</h3>
          <img
            src={image}
            alt="Edited Preview"
          />
        </div>
      )}
      <Form>
        <Form.Group className={styles.formGroup}>
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.formControl}
          />
        </Form.Group>
        <Form.Group className={styles.formGroup}>
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${styles.formControl} ${styles.textarea}`}
          />
        </Form.Group>
        <Form.Group className={styles.formGroup}>
          <Form.Label>Link to Existing Listing</Form.Label>
          <Form.Select
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            className={styles.selectField}
          >
            <option value="">Select Listing Item</option>
            {listings.map((listing) => (
              <option key={listing.listing_id} value={`${listing.listing_id}`}>
                {listing.title}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className={styles.formGroup}>
          <Form.Label>Tags</Form.Label>
          <Form.Control
            type="text"
            placeholder="Add tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={styles.formControl}
          />
        </Form.Group>
        <div className={styles.buttonGroup}>
          <Button className="me-2" onClick={() => navigate(-1)} variant="primary">
            Back
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Confirm"}
          </Button>
        </div>
      </Form>
    </div>
    </div>
  );
}

export default PostDetails;
