import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import { useAuth0 } from "@auth0/auth0-react";

function PostDetails() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [listingId, setListingId] = useState("");
  const [tags, setTags] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
  const [listings, setListings] = useState([]);

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
    // Multer only works on form data
    const imageForm = new FormData();

    //Encoded URL does not include the mimetype so adding it back so browsers render correctly
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
    //imageForm.append('postImage', convertedImage);
    const token = await getAccessTokenSilently();
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    const data = await response.json();
    // Extract only the listing_id and title from each listing
    return data.map(listing => ({
      listing_id: listing.listing_id,
      title: listing.title
    }));
  };

  const handleSubmit = async () => {
    // Prepare the data to send
    const postData = {
      title,
      content,
      listingId,
      tags,
      image, // Include the image URL or base64 string
    };

    try {
      postData.image = await uploadImage();
    } catch {

    }
    try {
      const token = await getAccessTokenSilently();

      // This will return a filekey not a URL, want to fetch URL's based off the file key so s3 bucket remains private


      // Send the post data to the backend using fetch
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData), // Convert the post data to JSON
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      alert("Post created successfully!");
      navigate("/Feed"); // Navigate to the feed page after success
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Error creating post. Please try again.");
    }
  };

  return (
    <div>
      <h1>Create Post Details</h1>
      {image && (
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h3>Edited Image Preview</h3>
          <img
            src={image}
            alt="Edited Preview"
            style={{
              maxWidth: "100%",
              maxHeight: "300px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginBottom: "10px",
            }}
          />
        </div>
      )}
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Link to Existing Listing</Form.Label>
          <Form.Select
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
          >
            <option value="">Select Listing Item</option>
            {listings.map((listing) => (
              <option key={listing.listing_id} value={`${listing.listing_id}`}>
                {listing.title}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Tags</Form.Label>
          <Form.Control
            type="text"
            placeholder="Add tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </Form.Group>
        <Button className="me-2" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Confirm
        </Button>
      </Form>
    </div>
  );
}

export default PostDetails;
